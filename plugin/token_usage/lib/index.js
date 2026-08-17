import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

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

const DAY = 86400000
const MAX_RECORDS = 100000
const FILE = '.dsh/usage-stats.json'

const ZERO = { cacheRead: 0, input: 0, output: 0 }
const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}
const localDate = (ts) => {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Host service owning the token-usage ledger. Registers itself as
 * `ctx.tokenUsage`, exposes `get` and `setPrices` as Remote endpoints the
 * browser reaches through `ctx.remote.tokenUsage`, and watches `llm/stream`
 * to record every model call's cache-read/input/output tokens.
 */
class TokenUsageService extends TypertRemoteService {
  static inject = ['fs', 'timer', 'sandboxPolicy']

  constructor(ctx, _config) {
    super(ctx, 'tokenUsage')
    for (const fn of remoteInitializers) fn.call(this)
    this._fs = ctx.fs
    this._timer = ctx.timer
    this._sandboxPolicy = ctx.sandboxPolicy
    this._prices = {}
    this._records = []
    this._goals = { cost: 100, tokens: 100000000, count: 200 }
    this._ready = this._loadState()
    this._listenStream()
  }

  _policy() {
    return this._sandboxPolicy ? this._sandboxPolicy.resolve() : undefined
  }

  _target() {
    return this._fs.resolve(FILE)
  }

  async _loadState() {
    try {
      const t = await this._target()
      const text = await this._fs.readText(t)
      const data = JSON.parse(text)
      if (data && Array.isArray(data.records)) {
        this._records = data.records.map((r) => ({ ...r, model: r.model || 'unknown' }))
      }
      if (data && data.prices && typeof data.prices === 'object') {
        const raw = data.prices
        if (typeof raw.cacheRead === 'number' || typeof raw.input === 'number' || typeof raw.output === 'number') {
          this._prices = {
            __default__: {
              cacheRead: toNum(raw.cacheRead),
              input: toNum(raw.input),
              output: toNum(raw.output),
            },
          }
        } else {
          this._prices = raw
        }
      }
      if (data && data.goals && typeof data.goals === 'object') {
        const clampGoal = (v, d) => {
          const n = Number(v)
          return Number.isFinite(n) && n >= 0 ? n : d
        }
        this._goals = {
          cost: clampGoal(data.goals.cost, 100),
          tokens: clampGoal(data.goals.tokens, 100000000),
          count: clampGoal(data.goals.count, 200),
        }
      }
      this._prune()
    } catch (e) {
      this._records = []
    }
    await this._mergeBackfill()
  }

  /**
   * 合并一次性回填文件（tools/backfill-sessions.mjs 的产物）：只并入早于
   * 现有最早记录的 ts，避免与实时记录重叠；合并后把回填文件清空，防止重复并入。
   */
  async _mergeBackfill() {
    const diag = async (payload) => {
      try {
        const dTarget = await this._fs.resolve('.dsh/usage-stats.backfill.diag')
        await this._fs.writeText(
          dTarget,
          JSON.stringify({ ...payload, at: new Date().toISOString() }),
          undefined,
          undefined,
          this._policy(),
        )
      } catch (e) {
        /* 诊断文件写失败不影响主流程 */
      }
    }
    try {
      await diag({ step: 'start' })
      const bfTarget = await this._fs.resolve('.dsh/usage-stats.backfill.json')
      const bfText = await this._fs.readText(bfTarget)
      await diag({ step: 'read', bytes: bfText.length })
      const bf = JSON.parse(bfText)
      if (!bf || !Array.isArray(bf.records) || bf.records.length === 0) {
        await diag({ step: 'empty-or-none' })
        return
      }
      const existing = this._records.filter((r) => typeof r.ts === 'number' && r.ts > 0)
      const minTs = existing.length > 0 ? Math.min(...existing.map((r) => r.ts)) : Infinity
      const seen = new Set()
      for (const r of existing) seen.add(`${r.ts}|${r.model}|${r.input || 0}|${r.output || 0}|${r.cacheRead || 0}`)
      let added = 0
      for (const r of bf.records) {
        if (typeof r.ts !== 'number' || r.ts <= 0 || r.ts >= minTs) continue
        const key = `${r.ts}|${r.model || 'unknown'}|${r.input || 0}|${r.output || 0}|${r.cacheRead || 0}`
        if (seen.has(key)) continue
        seen.add(key)
        this._records.push({
          ts: r.ts,
          model: r.model || 'unknown',
          input: toNum(r.input),
          output: toNum(r.output),
          cacheRead: toNum(r.cacheRead),
          cacheWrite: toNum(r.cacheWrite),
        })
        added++
      }
      await diag({ step: 'computed', existing: existing.length, minTs, added })
      if (added > 0) {
        this._records.sort((a, b) => a.ts - b.ts)
        this._prune()
        await this._persist()
        console.log(`[token-usage] backfilled ${added} historical records`)
        await diag({ step: 'persisted', added })
      }
      await this._fs.writeText(bfTarget, JSON.stringify({ records: [] }), undefined, undefined, this._policy())
      await diag({ step: 'done', added })
    } catch (e) {
      await diag({ step: 'error', message: String((e && e.message) || e), stack: String((e && e.stack) || '') })
      console.error('[token-usage] backfill merge failed:', e)
    }
  }

  _prune() {
    const cutoff = Date.now() - 366 * DAY
    this._records = this._records.filter((r) => r.ts >= cutoff)
    if (this._records.length > MAX_RECORDS) this._records = this._records.slice(this._records.length - MAX_RECORDS)
  }

  async _persist() {
    try {
      const t = await this._target()
      await this._fs.writeText(
        t,
        JSON.stringify({ version: 3, prices: this._prices, records: this._records, goals: this._goals }),
        undefined,
        undefined,
        this._policy(),
      )
    } catch (e) {
      console.error('[token-usage] persist failed', e)
    }
  }

  _listenStream() {
    this.ctx.on('llm/stream', (options, next) => {
      const model = options && options.model ? options.model : 'unknown'
      return (async function* () {
        let source
        try {
          source = next()
        } catch (e) {
          throw e
        }
        let acc = null
        try {
          for await (const chunk of source) {
            if (chunk && chunk.type === 'usage' && chunk.usage) {
              if (acc === null) acc = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
              acc.input += chunk.usage.inputTokens || 0
              acc.output += chunk.usage.outputTokens || 0
              acc.cacheRead += chunk.usage.cacheReadTokens || 0
              acc.cacheWrite += chunk.usage.cacheWriteTokens || 0
            }
            yield chunk
          }
        } finally {
          if (acc !== null) {
            this._records.push({ ts: Date.now(), model, ...acc })
            this._prune()
            this._persistSoon()
          }
        }
      }).call(this)
    })
  }

  _persistSoon() {
    if (!this._debounced) {
      this._debounced = this._timer.debounce(() => {
        this._persist().catch(() => {})
      }, 1500)
    }
    this._debounced()
  }

  /** Remote: return per-model 1/7/30-day usage, request counts, and the 364-day daily heatmap totals. */
  async get() {
    await this._ready
    const now = Date.now()
    const models = []
    for (const r of this._records) if (r.model && !models.includes(r.model)) models.push(r.model)
    if (models.length === 0) models.push('unknown')
    models.sort()
    const fallback = this._prices.__default__ || ZERO
    for (const m of models) if (!this._prices[m]) this._prices[m] = { ...fallback }

    // Daily totals for the Token heatmap: 364 days ending today, keyed by local date.
    const daily = {}
    const today = localDate(now)
    for (let i = 363; i >= 0; i--) daily[localDate(now - i * DAY)] = 0
    for (const r of this._records) {
      const key = localDate(r.ts)
      if (daily[key] !== undefined) daily[key] += (r.cacheRead || 0) + (r.input || 0) + (r.output || 0)
    }

    const windows = {}
    for (const days of [1, 7, 30]) {
      const since = now - days * DAY
      const byModel = {}
      for (const m of models) byModel[m] = { cacheRead: 0, input: 0, output: 0, cost: 0, count: 0 }
      let tCache = 0
      let tInput = 0
      let tOutput = 0
      let tCost = 0
      let tCount = 0
      for (const r of this._records) {
        if (r.ts >= since) {
          const m = r.model || 'unknown'
          const b = byModel[m] || (byModel[m] = { cacheRead: 0, input: 0, output: 0, cost: 0, count: 0 })
          b.cacheRead += r.cacheRead || 0
          b.input += r.input || 0
          b.output += r.output || 0
          b.count += 1
        }
      }
      for (const m of models) {
        const b = byModel[m]
        const p = this._prices[m] || fallback
        b.cost = (b.cacheRead / 1e6) * p.cacheRead + (b.input / 1e6) * p.input + (b.output / 1e6) * p.output
        tCache += b.cacheRead
        tInput += b.input
        tOutput += b.output
        tCost += b.cost
        tCount += b.count
      }
      windows[String(days)] = {
        totals: { cacheRead: tCache, input: tInput, output: tOutput, cost: tCost, count: tCount },
        byModel,
      }
    }

    // 今日（本地自然日）用量汇总：费用 / 总Token / 请求次数，供半圆环使用。
    let tCost = 0
    let tTokens = 0
    let tCount = 0
    for (const r of this._records) {
      if (localDate(r.ts) !== today) continue
      const m = r.model || 'unknown'
      const p = this._prices[m] || fallback
      tCost += (r.cacheRead || 0) / 1e6 * p.cacheRead + (r.input || 0) / 1e6 * p.input + (r.output || 0) / 1e6 * p.output
      tTokens += (r.cacheRead || 0) + (r.input || 0) + (r.output || 0)
      tCount += 1
    }

    // 本周（周一..周日）每日用量：费用 / 总Token / 请求次数，供每日三环图使用。
    const week = []
    {
      const nowD = new Date(now)
      const monday = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate())
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(d.getDate() + i)
        week.push({ date: localDate(d.getTime()), cost: 0, tokens: 0, count: 0 })
      }
      for (const r of this._records) {
        const key = localDate(r.ts)
        const w = week.find((x) => x.date === key)
        if (!w) continue
        const m = r.model || 'unknown'
        const p = this._prices[m] || fallback
        w.cost += (r.cacheRead || 0) / 1e6 * p.cacheRead + (r.input || 0) / 1e6 * p.input + (r.output || 0) / 1e6 * p.output
        w.tokens += (r.cacheRead || 0) + (r.input || 0) + (r.output || 0)
        w.count += 1
      }
    }

    return { models, prices: this._prices, windows, count: this._records.length, daily, today, goals: this._goals, todayUsage: { cost: tCost, tokens: tTokens, count: tCount }, week }
  }

  /** Remote: persist the daily goal caps for the semicircle rings (cost / tokens / requests). */
  async setGoals(args) {
    const g = (args && args.goals) || {}
    const clamp = (v, d) => {
      const n = Number(v)
      return Number.isFinite(n) && n >= 0 ? n : d
    }
    this._goals = {
      cost: clamp(g.cost, 100),
      tokens: clamp(g.tokens, 100000000),
      count: clamp(g.count, 200),
    }
    await this._persist()
    return { goals: this._goals }
  }

  /** Remote: persist per-model prices for cache-read / input / output tokens. */
  async setPrices(args) {
    const model = args && args.model ? String(args.model) : ''
    const p = (args && args.prices) || {}
    if (model) {
      this._prices[model] = {
        cacheRead: toNum(p.cacheRead),
        input: toNum(p.input),
        output: toNum(p.output),
      }
      await this._persist()
    }
    return { prices: this._prices }
  }
}

Remote('get')(TokenUsageService.prototype.get, remoteContext('get'))
Remote('setPrices')(TokenUsageService.prototype.setPrices, remoteContext('setPrices'))
Remote('setGoals')(TokenUsageService.prototype.setGoals, remoteContext('setGoals'))

export { TokenUsageService }
export default TokenUsageService
