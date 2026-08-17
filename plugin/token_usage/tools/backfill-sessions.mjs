#!/usr/bin/env node
/**
 * 一次性历史用量回填工具。
 *
 * DSH 的会话日志 (~/.dsh/sessions/<workspace>/<session>/session.jsonl.zstd)
 * 是“拼接的 zstd 帧”容器：每帧解压后是 JSONL 事件流。事件按 seq 有序，其中：
 *   - request/header         携带本次模型请求的模型名 (data.header.config.model)
 *   - assistant/chunk        携带 usage 分块 (inputTokens/outputTokens/cacheReadTokens)
 * 每次请求内所有 usage 分块求和，等价于 token_usage Host 在 llm/stream 上的实时累计。
 *
 * 产出 ~/.dsh/usage-stats.backfill.json，由 Host 下一次启动时合并进
 * usage-stats.json（只合并早于现有最早记录的 ts，避免与实时记录重复）。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { zstdDecompressSync } from 'node:zlib'
import { homedir } from 'node:os'
import { join } from 'node:path'

const home = homedir()
const SESSIONS = join(home, '.dsh', 'sessions')
const STATS = join(home, '.dsh', 'usage-stats.json')
const OUT = join(home, '.dsh', 'usage-stats.backfill.json')
const ZSTD_MAGIC = 4247762216

/** 扫描拼接的 zstd 帧边界（与 dsh-session-persistence-jsonl 的 scanZstdFrames 一致）。 */
function scanFrames(buf) {
  const frames = []
  let offset = 0
  while (offset < buf.length) {
    const start = offset
    if (buf.length - offset < 4) break
    if (buf.readUInt32LE(offset) !== ZSTD_MAGIC) throw new Error(`invalid zstd magic at byte ${offset}`)
    offset += 4
    const descriptor = buf.readUInt8(offset)
    offset += 1
    if ((descriptor & 24) !== 0) throw new Error(`reserved zstd frame-header bit at byte ${offset - 1}`)
    const contentSizeFlag = descriptor >>> 6
    const singleSegment = (descriptor & 32) !== 0
    const checksum = (descriptor & 4) !== 0
    const dictionaryFlag = descriptor & 3
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : (1 << contentSizeFlag)
    offset += (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes
    for (;;) {
      if (buf.length - offset < 3) return frames
      const blockHeader = buf.readUIntLE(offset, 3)
      offset += 3
      const lastBlock = (blockHeader & 1) !== 0
      const blockType = (blockHeader >>> 1) & 3
      const blockSize = blockHeader >>> 3
      if (blockType === 3) throw new Error(`reserved zstd block type at byte ${offset - 3}`)
      offset += blockType === 1 ? 1 : blockSize
      if (lastBlock) break
    }
    if (checksum) offset += 4
    frames.push({ start, end: offset })
  }
  return frames
}

/** 从单个会话文件中提取“每次模型请求一条记录”。 */
function extractRecords(buf) {
  const records = []
  let acc = null
  const flush = () => {
    if (acc !== null && acc.lastTs !== null) {
      records.push({
        ts: acc.lastTs,
        model: acc.model || 'unknown',
        cacheRead: acc.cacheRead,
        input: acc.input,
        output: acc.output,
        cacheWrite: acc.cacheWrite,
      })
    }
    acc = null
  }
  const boundaryModel = (j) => {
    const d = j && j.data
    const cfg = (d && d.header && d.header.config) || (d && d.config) || null
    return cfg && typeof cfg.model === 'string' ? cfg.model : null
  }
  for (const f of scanFrames(buf)) {
    const text = zstdDecompressSync(buf.subarray(f.start, f.end)).toString('utf8')
    for (const line of text.split('\n')) {
      if (!line.trim()) continue
      let j
      try {
        j = JSON.parse(line)
      } catch {
        continue
      }
      // 注意：session/title-llm-request 会紧跟 request/header 出现（标题生成先排队），
      // 若把它当边界会把主请求的 usage 归到无模型名的标题请求上 —— 因此只有
      // request/header 才开启新的请求归属。
      if (j.type === 'request/header') {
        flush()
        acc = { model: boundaryModel(j), cacheRead: 0, input: 0, output: 0, cacheWrite: 0, lastTs: null }
      } else if (
        j.type === 'assistant/chunk' &&
        j.data && j.data.chunk && j.data.chunk.type === 'usage' &&
        j.data.chunk.usage
      ) {
        const u = j.data.chunk.usage
        if (acc === null) acc = { model: null, cacheRead: 0, input: 0, output: 0, cacheWrite: 0, lastTs: null }
        acc.cacheRead += u.cacheReadTokens || 0
        acc.input += u.inputTokens || 0
        acc.output += u.outputTokens || 0
        acc.cacheWrite += u.cacheWriteTokens || 0
        if (typeof j.time === 'number') acc.lastTs = j.time
      }
    }
  }
  flush()
  return records
}

const dry = process.argv.includes('--dry')

// 截止点：现有记录的最早 ts（避免与实时记录重叠）。
let cutoff = Infinity
try {
  const d = JSON.parse(readFileSync(STATS, 'utf8'))
  const tss = (d.records || []).map((r) => r.ts).filter((t) => typeof t === 'number' && t > 0)
  if (tss.length > 0) cutoff = Math.min(...tss)
} catch {
  /* 没有现有数据 → 全部回填 */
}

const collected = []
let skipped = 0
for (const ws of readdirSync(SESSIONS)) {
  let sessionDirs = []
  try {
    sessionDirs = readdirSync(join(SESSIONS, ws))
  } catch {
    continue
  }
  for (const sid of sessionDirs) {
    const file = join(SESSIONS, ws, sid, 'session.jsonl.zstd')
    if (!existsSync(file)) continue
    let buf
    try {
      buf = readFileSync(file)
    } catch (e) {
      skipped++
      continue
    }
    let recs
    try {
      recs = extractRecords(buf)
    } catch (e) {
      console.error(`[backfill] 跳过损坏文件 ${file}: ${e.message}`)
      skipped++
      continue
    }
    for (const r of recs) {
      if (r.ts >= cutoff) continue
      collected.push(r)
    }
  }
}
collected.sort((a, b) => a.ts - b.ts)

const total = collected.reduce(
  (s, r) => ({
    input: s.input + r.input,
    output: s.output + r.output,
    cacheRead: s.cacheRead + r.cacheRead,
  }),
  { input: 0, output: 0, cacheRead: 0 },
)

const byDay = {}
for (const r of collected) {
  const day = new Date(r.ts).toLocaleDateString('sv-SE')
  const b = byDay[day] || (byDay[day] = { n: 0, tokens: 0 })
  b.n++
  b.tokens += r.input + r.output + r.cacheRead
}

console.log(`[backfill] 截止时间: ${cutoff === Infinity ? '无(全部)' : new Date(cutoff).toISOString()}`)
console.log(`[backfill] 会话日志记录: ${collected.length} 条请求 | 跳过文件: ${skipped}`)
console.log(`[backfill] 合计: 输入 ${total.input} / 输出 ${total.output} / 缓存命中 ${total.cacheRead}`)
for (const day of Object.keys(byDay).sort()) {
  console.log(`[backfill]   ${day}: ${byDay[day].n} 条请求, ${byDay[day].tokens.toLocaleString('en-US')} Token`)
}
console.log(`[backfill] 模型分布: ${JSON.stringify(collected.reduce((m, r) => { m[r.model] = (m[r.model] || 0) + 1; return m }, {}))}`)

if (!dry) {
  writeFileSync(OUT, JSON.stringify({ records: collected }))
  console.log(`[backfill] 已写入 ${OUT}`)
} else {
  console.log('[backfill] dry-run：未写入文件')
}
