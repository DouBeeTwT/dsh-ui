/**
 * 代理插件 Host 服务。
 *
 * 职责：
 *  1. 持久化 UA 改写代理规则到 `.dsh/proxy-rules.json`；
 *  2. 管理每条启用规则对应的本地 bridge 监听（进程内 http server）；
 *  3. 通过 Remote 端点把规则的增删改查 / 开关 / 连通性测试暴露给设置页面。
 *
 * 设计取舍：bridge 跑在 DSH Host 进程内，随 DSH 启停，不再依赖 launchd 常驻，
 * 界面开关即时生效。DSH 侧仍需把 provider 的 baseURL 指向 `127.0.0.1:<port>`。
 *
 * @module dsh-client-ui-proxy
 */
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import { startBridge } from './bridge.js'

/**
 * 手工套用 stage-3 方法装饰器上下文：`Remote` 装饰器通过 `context.addInitializer`
 * 登记标记初始化函数。这里收集它们并在实例构造后执行，使纯 JS（不走 TS 装饰器
 * 编译）也能标记网关通过 `remoteMethods()` 发现的 Remote 端点。
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

const FILE = '.dsh/proxy-rules.json'
const DEFAULT_UA = 'claude-cli/2.1.233 (external, sdk-cli)'
const PI_AI_NS = settingsNamespace('llm-pi-ai')

const isStr = (v) => typeof v === 'string' && v.length > 0
const clampPort = (v) => {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1024 && n <= 65535 ? n : 0
}

/** 生成稳定 id（时间戳 + 随机尾巴，足够本地场景用）。 */
function newId() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/**
 * 规则规范化 + 校验。返回 { rule } 或 { error }。
 * 字段：id / name / upstream / userAgent / listenPort / enabled。
 */
function normalizeRule(raw, existing = []) {
  const rule = {
    id: isStr(raw?.id) ? String(raw.id) : newId(),
    name: isStr(raw?.name) ? String(raw.name).slice(0, 60) : '未命名代理',
    upstream: isStr(raw?.upstream) ? String(raw.upstream).trim() : '',
    userAgent: isStr(raw?.userAgent) ? String(raw.userAgent) : DEFAULT_UA,
    listenPort: clampPort(raw?.listenPort),
    enabled: raw?.enabled === true,
  }
  if (rule.upstream === '') return { error: '上游地址不能为空' }
  try {
    const u = new URL(rule.upstream)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { error: '上游地址必须是 http:// 或 https://' }
    }
  } catch {
    return { error: '上游地址不是合法 URL' }
  }
  if (rule.listenPort === 0) return { error: '监听端口需为 1024-65535 的整数' }
  if (rule.userAgent.trim() === '') return { error: 'User-Agent 不能为空' }
  // 端口不能和别的规则撞。
  for (const other of existing) {
    if (other.id !== rule.id && other.listenPort === rule.listenPort) {
      return { error: `端口 ${rule.listenPort} 已被规则「${other.name}」占用` }
    }
  }
  return { rule }
}

/**
 * Host 服务：注册为 `ctx.proxyBridge`，浏览器通过 `ctx.remote.proxyBridge` 访问。
 */
class ProxyBridgeService extends TypertRemoteService {
  static inject = ['fs', 'sandboxPolicy', 'settings', 'credentials', 'launchEnvironment']

  constructor(ctx, _config) {
    super(ctx, 'proxyBridge')
    for (const fn of remoteInitializers) fn.call(this)
    this._fs = ctx.fs
    this._sandboxPolicy = ctx.sandboxPolicy
    this._settings = ctx.settings
    this._credentials = ctx.credentials
    this._launchEnvironment = ctx.launchEnvironment
    this._rules = []
    /** @type {Map<string, {port:number, close:()=>Promise<void>}>} */
    this._running = new Map()
    /** @type {Map<string, string>} 规则 id -> 最近一次启动错误 */
    this._errors = new Map()
    this._ready = this._boot()
    // DSH 关停时释放所有监听。
    ctx.on('dispose', () => {
      void this._stopAll()
    })
  }

  _policy() {
    return this._sandboxPolicy ? this._sandboxPolicy.resolve() : undefined
  }

  async _boot() {
    await this._load()
    await this._reconcile()
  }

  async _load() {
    try {
      const target = await this._fs.resolve(FILE)
      const text = await this._fs.readText(target)
      const data = JSON.parse(text)
      if (data && Array.isArray(data.rules)) {
        const acc = []
        for (const raw of data.rules) {
          const { rule } = normalizeRule(raw, acc)
          if (rule) acc.push(rule)
        }
        this._rules = acc
      }
    } catch {
      this._rules = []
    }
  }

  async _persist() {
    try {
      const target = await this._fs.resolve(FILE)
      await this._fs.writeText(
        target,
        JSON.stringify({ version: 1, rules: this._rules }, null, 2),
        undefined,
        undefined,
        this._policy(),
      )
    } catch (e) {
      console.error('[proxy] persist failed', e)
    }
  }

  /** 让实际监听状态与规则的 enabled 对齐。 */
  async _reconcile() {
    // 停掉不该再跑的。
    for (const [id, handle] of [...this._running.entries()]) {
      const rule = this._rules.find((r) => r.id === id)
      if (!rule || !rule.enabled || rule.listenPort !== handle.port) {
        try {
          await handle.close()
        } catch {
          /* 关闭失败不阻塞后续对齐 */
        }
        this._running.delete(id)
      }
    }
    // 起还没跑的。
    for (const rule of this._rules) {
      if (!rule.enabled || this._running.has(rule.id)) continue
      try {
        const handle = await startBridge(rule)
        this._running.set(rule.id, handle)
        this._errors.delete(rule.id)
        console.log(`[proxy] bridge up: 127.0.0.1:${rule.listenPort} -> ${rule.upstream} (UA: ${rule.userAgent})`)
      } catch (e) {
        const msg = String((e && e.code === 'EADDRINUSE' ? `端口 ${rule.listenPort} 已被占用` : (e && e.message) || e))
        this._errors.set(rule.id, msg)
        console.error(`[proxy] bridge failed for ${rule.name}: ${msg}`)
      }
    }
  }

  async _stopAll() {
    for (const [id, handle] of [...this._running.entries()]) {
      try {
        await handle.close()
      } catch {
        /* 退出路径上忽略关闭异常 */
      }
      this._running.delete(id)
    }
  }

  /** 对外投影：附带运行状态与错误。 */
  _project() {
    return this._rules.map((r) => ({
      ...r,
      running: this._running.has(r.id),
      error: this._errors.get(r.id) ?? '',
    }))
  }

  /** Remote: 列出全部规则（含运行状态）与默认值。 */
  async list() {
    await this._ready
    return { rules: this._project(), defaultUserAgent: DEFAULT_UA }
  }

  /**
   * Remote: 列出已配置的 LLM providers（供测试下拉框用）。
   * 从 llm-pi-ai settings section 读取 providers 字典，返回不含密钥的
   * { provider, displayName, models } 列表。
   */
  async providers() {
    await this._ready
    const raw = this._readPiAiSection()
    const providers = raw && typeof raw === 'object' ? raw.providers : null
    if (!providers || typeof providers !== 'object') return { providers: [] }
    const out = []
    for (const [key, profile] of Object.entries(providers)) {
      if (!profile || typeof profile !== 'object') continue
      const models = Array.isArray(profile.models)
        ? profile.models.map((m) => (m && typeof m === 'object' ? m.id : m)).filter(Boolean)
        : []
      out.push({
        provider: key,
        displayName: profile.displayName || key,
        models,
      })
    }
    return { providers: out }
  }

  /**
   * 读取 llm-pi-ai settings section 的当前值。
   */
  _readPiAiSection() {
    const settings = this._settings
    if (!settings) return {}
    try {
      // 标准入口：settings 维护一个 section map，按 ns 取 scope，scope.get() 返回当前值。
      if (typeof settings.get === 'function') return settings.get(PI_AI_NS) ?? {}
      if (settings.scope && typeof settings.scope === 'function') {
        const scope = settings.scope(PI_AI_NS)
        return scope && typeof scope.get === 'function' ? scope.get() ?? {} : {}
      }
    } catch {
      /* 读取失败返回空对象 */
    }
    return {}
  }

  /**
   * 解析某个 provider 的 API key：读 llm-pi-ai section 拿 apiKeyEnv，
   * 再用 credentials service 解析该引用。与 llm-pi-ai adapter 的
   * resolveApiKey 同路径，保证拿到的 key 和实际请求一致。
   */
  async _resolveProviderKey(providerName) {
    const raw = this._readPiAiSection()
    const providers = raw && typeof raw === 'object' ? raw.providers : null
    const profile = providers && typeof providers === 'object' ? providers[providerName] : null
    if (!profile || typeof profile !== 'object') return undefined
    const ref = profile.apiKeyEnv
    if (!ref || typeof ref !== 'string') return undefined
    const credentials = this._credentials
    if (credentials && typeof credentials.resolve === 'function') {
      try {
        const hit = await credentials.resolve(ref)
        if (hit && typeof hit.value === 'string' && hit.value.length > 0) return hit.value
      } catch {
        /* 凭据解析失败，回退到环境变量 */
      }
    }
    // 回退：launchEnvironment 里的环境变量（和 llm-pi-ai adapter 一致）。
    const env = this._launchEnvironment
    if (env && typeof env.get === 'function') {
      try {
        const hit = env.get(ref)
        if (hit && typeof hit.value === 'string' && hit.value.length > 0) return hit.value
      } catch {
        /* 环境变量读取失败 */
      }
    }
    return undefined
  }

  /** Remote: 新增或更新一条规则，随后对齐监听。 */
  async save(args) {
    await this._ready
    const { rule, error } = normalizeRule(args?.rule, this._rules)
    if (error) return { ok: false, message: error, rules: this._project() }
    const idx = this._rules.findIndex((r) => r.id === rule.id)
    if (idx >= 0) this._rules[idx] = rule
    else this._rules.push(rule)
    await this._persist()
    await this._reconcile()
    return { ok: true, message: '', rules: this._project() }
  }

  /** Remote: 删除一条规则并停掉它的监听。 */
  async deleteRule(args) {
    await this._ready
    const id = isStr(args?.id) ? String(args.id) : ''
    this._rules = this._rules.filter((r) => r.id !== id)
    await this._persist()
    await this._reconcile()
    return { ok: true, message: '', rules: this._project() }
  }

  /** Remote: 切换启用状态。 */
  async toggle(args) {
    await this._ready
    const id = isStr(args?.id) ? String(args.id) : ''
    const rule = this._rules.find((r) => r.id === id)
    if (!rule) return { ok: false, message: '规则不存在', rules: this._project() }
    rule.enabled = args?.enabled === true
    await this._persist()
    await this._reconcile()
    const err = this._errors.get(id)
    if (rule.enabled && err) return { ok: false, message: err, rules: this._project() }
    return { ok: true, message: '', rules: this._project() }
  }

  /**
   * Remote: 连通性测试。经本地 bridge 请求上游的 `/v1/models`，
   * 用于确认「UA 改写后能否被上游放行」。需要该规则处于运行中。
   * 传入 provider 名，从已配置的 credentials 解析其 API key。
   */
  async test(args) {
    await this._ready
    const id = isStr(args?.id) ? String(args.id) : ''
    const rule = this._rules.find((r) => r.id === id)
    if (!rule) return { ok: false, message: '规则不存在' }
    if (!this._running.has(id)) {
      return { ok: false, message: this._errors.get(id) || '规则未启用，请先打开开关' }
    }
    const providerName = isStr(args?.provider) ? String(args.provider) : ''
    let apiKey = ''
    if (providerName) {
      apiKey = (await this._resolveProviderKey(providerName)) ?? ''
      if (!apiKey) return { ok: false, message: `无法解析 provider「${providerName}」的 API key，请先在 Models 页配置` }
    }
    let prefix = ''
    try {
      prefix = new URL(rule.upstream).pathname.replace(/\/+$/, '')
    } catch {
      prefix = ''
    }
    const url = `http://127.0.0.1:${rule.listenPort}${prefix}/v1/models`
    try {
      const headers = { accept: 'application/json' }
      if (apiKey) headers['x-api-key'] = apiKey
      const res = await fetch(url, { method: 'GET', headers })
      const text = await res.text()
      if (!res.ok) {
        return { ok: false, message: `上游返回 ${res.status}：${text.slice(0, 200)}` }
      }
      let count = 0
      try {
        const data = JSON.parse(text)
        if (Array.isArray(data?.data)) count = data.data.length
      } catch {
        /* 非 JSON 也算连通 */
      }
      return { ok: true, message: count > 0 ? `连通，上游返回 ${count} 个模型` : '连通' }
    } catch (e) {
      return { ok: false, message: `请求失败：${String((e && e.message) || e)}` }
    }
  }
}

Remote('list')(ProxyBridgeService.prototype.list, remoteContext('list'))
Remote('providers')(ProxyBridgeService.prototype.providers, remoteContext('providers'))
Remote('save')(ProxyBridgeService.prototype.save, remoteContext('save'))
Remote('deleteRule')(ProxyBridgeService.prototype.deleteRule, remoteContext('deleteRule'))
Remote('toggle')(ProxyBridgeService.prototype.toggle, remoteContext('toggle'))
Remote('test')(ProxyBridgeService.prototype.test, remoteContext('test'))

export { ProxyBridgeService }
export default ProxyBridgeService
