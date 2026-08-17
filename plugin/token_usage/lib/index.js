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
const MAX_RECORDS = 20000
const FILE = '.dsh/usage-stats.json'

const ZERO = { cacheRead: 0, input: 0, output: 0 }
const toNum = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
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
      this._prune()
    } catch (e) {
      this._records = []
    }
  }

  _prune() {
    const cutoff = Date.now() - 31 * DAY
    this._records = this._records.filter((r) => r.ts >= cutoff)
    if (this._records.length > MAX_RECORDS) this._records = this._records.slice(this._records.length - MAX_RECORDS)
  }

  async _persist() {
    try {
      const t = await this._target()
      await this._fs.writeText(
        t,
        JSON.stringify({ version: 3, prices: this._prices, records: this._records }),
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

  /** Remote: return the per-model 1/7/30-day usage snapshot plus prices. */
  async get() {
    await this._ready
    const now = Date.now()
    const models = []
    for (const r of this._records) if (r.model && !models.includes(r.model)) models.push(r.model)
    if (models.length === 0) models.push('unknown')
    models.sort()
    const fallback = this._prices.__default__ || ZERO
    for (const m of models) if (!this._prices[m]) this._prices[m] = { ...fallback }

    const windows = {}
    for (const days of [1, 7, 30]) {
      const since = now - days * DAY
      const byModel = {}
      for (const m of models) byModel[m] = { cacheRead: 0, input: 0, output: 0, cost: 0 }
      let tCache = 0
      let tInput = 0
      let tOutput = 0
      let tCost = 0
      for (const r of this._records) {
        if (r.ts >= since) {
          const m = r.model || 'unknown'
          const b = byModel[m] || (byModel[m] = { cacheRead: 0, input: 0, output: 0, cost: 0 })
          b.cacheRead += r.cacheRead || 0
          b.input += r.input || 0
          b.output += r.output || 0
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
      }
      windows[String(days)] = {
        totals: { cacheRead: tCache, input: tInput, output: tOutput, cost: tCost },
        byModel,
      }
    }
    return { models, prices: this._prices, windows, count: this._records.length }
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

export { TokenUsageService }
export default TokenUsageService
