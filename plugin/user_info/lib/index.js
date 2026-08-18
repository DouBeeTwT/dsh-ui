import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { fileURLToPath } from 'node:url'

/**
 * Hand-applied stage-3 method decorator context: the `Remote` decorator
 * schedules a marker initializer via `context.addInitializer`. We capture
 * those initializers here and run them against the live instance after
 * construction, so plain JS (no TS decorator compile) can mark the Remote
 * endpoints the gateway discovers through `remoteMethods()`.
 */
const remoteInitializers = []
function remoteContext(name) {
  return {
    kind: 'method',
    name,
    static: false,
    private: false,
    addInitializer(fn) {
      remoteInitializers.push(fn)
    },
  }
}

const FILE = '.dsh/user-info.json'
// 头像源：插件包内 assets/avatar.png（由 DSHApp/Assets/AppIconSource.png 缩小生成）
const AVATAR = fileURLToPath(new URL('../assets/avatar.png', import.meta.url))

const EMPTY = { name: '', description: '', instructions: '', avatarPath: '', dailyCostLimit: 100, dailyTokenLimitM: 100 }
const toStr = (v) => (typeof v === 'string' ? v : '')
const toNum = (v, d = 0) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : d
}
const normalizeKind = (v) => (v === 'assistant' ? 'assistant' : 'user')
const clampPct = (v) => Math.max(0, Math.min(100, Math.round(v)))

// 按扩展名推断图片 MIME 类型
function mimeOf(path) {
  const lower = String(path).toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/png'
}

// Uint8Array → base64（分块，避免大数组栈溢出）
function bytesToBase64(bytes) {
  let binary = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * Host service owning the user/assistant info documents. Registers itself as
 * `ctx.userInfo`, exposes `get` and `save` as Remote endpoints the browser
 * reaches through `ctx.remote.userInfo`, and persists both documents to
 * ~/.dsh/user-info.json under the `user` and `assistant` keys.
 */
class UserInfoService extends TypertRemoteService {
  static inject = ['fs', 'sandboxPolicy']

  constructor(ctx, _config) {
    super(ctx, 'userInfo')
    for (const fn of remoteInitializers) fn.call(this)
    this._fs = ctx.fs
    this._sandboxPolicy = ctx.sandboxPolicy
    this._data = { user: { ...EMPTY }, assistant: { ...EMPTY } }
    this._ready = this._loadState()
  }

  _policy() {
    return this._sandboxPolicy ? this._sandboxPolicy.resolve() : undefined
  }

  _read(kind) {
    return kind === 'assistant' ? this._data.assistant : this._data.user
  }

  async _loadState() {
    try {
      const t = await this._fs.resolve(FILE)
      const text = await this._fs.readText(t)
      const data = JSON.parse(text)
      this._data = {
        user: {
          name: toStr(data.user && data.user.name),
          description: toStr(data.user && data.user.description),
          instructions: toStr(data.user && data.user.instructions),
          avatarPath: toStr(data.user && data.user.avatarPath),
          dailyCostLimit: toNum(data.user && data.user.dailyCostLimit, 100),
          dailyTokenLimitM: toNum(data.user && data.user.dailyTokenLimitM, 100),
        },
        assistant: {
          name: toStr(data.assistant && data.assistant.name),
          description: toStr(data.assistant && data.assistant.description),
          instructions: toStr(data.assistant && data.assistant.instructions),
          avatarPath: toStr(data.assistant && data.assistant.avatarPath),
          dailyCostLimit: toNum(data.assistant && data.assistant.dailyCostLimit, 100),
          dailyTokenLimitM: toNum(data.assistant && data.assistant.dailyTokenLimitM, 100),
        },
      }
    } catch (e) {
      this._data = { user: { ...EMPTY }, assistant: { ...EMPTY } }
    }
  }

  async _persist() {
    try {
      const t = await this._fs.resolve(FILE)
      await this._fs.writeText(
        t,
        JSON.stringify(this._data, null, 2),
        undefined,
        undefined,
        this._policy(),
      )
    } catch (e) {
      console.error('[user-info] persist failed', e)
    }
  }

  /** Remote: return both info documents ({ user, assistant }). 无参数，避免参数匹配问题。 */
  async get() {
    await this._ready
    return {
      user: { ...this._data.user },
      assistant: { ...this._data.assistant },
    }
  }

  /** Remote: persist one info document (name / description / instructions). */
  async save(args) {
    await this._ready
    const kind = normalizeKind(args && args.kind)
    const data = args && typeof args === 'object' ? args : {}
    this._data[kind] = {
      name: toStr(data.name),
      description: toStr(data.description),
      instructions: toStr(data.instructions),
      avatarPath: toStr(data.avatarPath),
      dailyCostLimit: toNum(data.dailyCostLimit, 100),
      dailyTokenLimitM: toNum(data.dailyTokenLimitM, 100),
    }
    await this._persist()
    return { ...this._data[kind] }
  }

  /** Remote: return the bundled avatar image as a base64 PNG data URL fragment. */
  async getAvatar() {
    try {
      const t = await this._fs.resolve(AVATAR)
      const bytes = await this._fs.readBytes(t, undefined, 8 * 1024 * 1024)
      return { mime: 'image/png', data: bytesToBase64(bytes) }
    } catch (e) {
      console.error('[user-info] avatar load failed', e)
      return { mime: '', data: '' }
    }
  }

  /** Remote: 按用户提供的图片文件路径读取头像，返回 base64（支持 png/jpg/webp/gif）。 */
  async loadAvatar(args) {
    const path = args && typeof args.path === 'string' ? args.path : ''
    if (!path) return { mime: '', data: '' }
    try {
      const t = await this._fs.resolve(path)
      const bytes = await this._fs.readBytes(t, undefined, 8 * 1024 * 1024)
      return { mime: mimeOf(path), data: bytesToBase64(bytes) }
    } catch (e) {
      console.error('[user-info] loadAvatar failed:', path, e)
      return { mime: '', data: '' }
    }
  }

  /** Remote: 经验值统计。累计 token 账本（usage-stats.json）的总 Tokens，
   *  每 100M 一等级：totalM ÷ 100 的整数部分为等级，余数为当前经验值进度（整数 %）。 */
  async getStats() {
    try {
      const t = await this._fs.resolve('.dsh/usage-stats.json')
      const text = await this._fs.readText(t)
      const data = JSON.parse(text)
      let total = 0
      if (data && Array.isArray(data.records)) {
        for (const r of data.records) {
          total += (r.input || 0) + (r.output || 0) + (r.cacheRead || 0)
        }
      }
      const totalM = total / 1e6
      return {
        totalTokens: total,
        totalM: Number(totalM.toFixed(2)),
        level: Math.floor(totalM / 100),
        progress: Math.round(totalM % 100),
      }
    } catch (e) {
      console.error('[user-info] stats load failed', e)
      return { totalTokens: 0, totalM: 0, level: 0, progress: 0 }
    }
  }

  /** Remote: 本周（周一到今天）已用费用 / Tokens，以及生命值、魔力值剩余百分比。
   *  生命值：每日费用限额×7 为 100%，本周已用费用向下扣；魔力值同理按 Tokens。
   *  周一 0 点本周已用归零，自然恢复满。 */
  async getWeekStats() {
    const now = new Date()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    monday.setHours(0, 0, 0, 0)
    const since = monday.getTime()

    let weekCost = 0
    let weekTokens = 0
    try {
      const t = await this._fs.resolve('.dsh/usage-stats.json')
      const text = await this._fs.readText(t)
      const data = JSON.parse(text)
      const prices = (data && data.prices) || {}
      const records = (data && Array.isArray(data.records)) ? data.records : []
      for (const r of records) {
        if (typeof r.ts !== 'number' || r.ts < since) continue
        const input = r.input || 0
        const output = r.output || 0
        const cacheRead = r.cacheRead || 0
        weekTokens += input + output + cacheRead
        const p = prices[r.model] || prices.__default__ || { cacheRead: 0, input: 0, output: 0 }
        weekCost += (cacheRead / 1e6) * (p.cacheRead || 0) + (input / 1e6) * (p.input || 0) + (output / 1e6) * (p.output || 0)
      }
    } catch (e) {
      /* 账本缺失/损坏时本周已用视为 0 */
    }

    const dailyCostLimit = toNum(this._data.user.dailyCostLimit, 100)
    const dailyTokenLimitM = toNum(this._data.user.dailyTokenLimitM, 100)
    const weekCostLimit = dailyCostLimit * 7
    const weekTokenLimit = dailyTokenLimitM * 7
    const hp = weekCostLimit > 0 ? clampPct(((weekCostLimit - weekCost) / weekCostLimit) * 100) : 100
    const mp = weekTokenLimit > 0 ? clampPct(((weekTokenLimit - weekTokens / 1e6) / weekTokenLimit) * 100) : 100

    return {
      weekCost: Number(weekCost.toFixed(2)),
      weekTokens,
      dailyCostLimit,
      dailyTokenLimitM,
      hp,
      mp,
    }
  }
}

Remote('get')(UserInfoService.prototype.get, remoteContext('get'))
Remote('save')(UserInfoService.prototype.save, remoteContext('save'))
Remote('getAvatar')(UserInfoService.prototype.getAvatar, remoteContext('getAvatar'))
Remote('getStats')(UserInfoService.prototype.getStats, remoteContext('getStats'))
Remote('loadAvatar')(UserInfoService.prototype.loadAvatar, remoteContext('loadAvatar'))
Remote('getWeekStats')(UserInfoService.prototype.getWeekStats, remoteContext('getWeekStats'))

export { UserInfoService }
export default UserInfoService
