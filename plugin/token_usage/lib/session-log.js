/**
 * 会话日志解析（zstd 帧扫描 + usage 提取）。
 *
 * DSH 的会话日志 (~/.dsh/sessions/<workspace>/<session>/session.jsonl.zstd)
 * 是“拼接的 zstd 帧”容器：每帧解压后是 JSONL 事件流。事件按 seq 有序，其中：
 *   - request/header         携带本次模型请求的模型名 (data.header.config.model)
 *   - assistant/chunk        携带 usage 分块 (inputTokens/outputTokens/cacheReadTokens)
 * 每次请求内所有 usage 分块求和，等价于 token_usage Host 在 llm/stream 上的实时累计。
 *
 * 本模块被两类调用方复用：
 *   - 插件 Host (lib/index.js)：首次运行时自动扫描全部会话日志回填历史；
 *   - 一次性工具 (tools/backfill-sessions.mjs)：生成 usage-stats.backfill.json。
 */
import { zstdDecompressSync } from 'node:zlib'

const ZSTD_MAGIC = 4247762216

/** 扫描拼接的 zstd 帧边界（与 dsh-session-persistence-jsonl 的 scanZstdFrames 一致）。 */
export function scanZstdFrames(buf) {
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

/** 从单个会话文件的原始字节中提取“每次模型请求一条记录”。 */
export function extractSessionRecords(buf) {
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
  for (const f of scanZstdFrames(buf)) {
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
