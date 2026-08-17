#!/usr/bin/env node
/**
 * 一次性历史用量回填工具。
 *
 * 从 DSH 的会话日志 (~/.dsh/sessions/<workspace>/<session>/session.jsonl.zstd)
 * 提取历史模型请求用量，产出 ~/.dsh/usage-stats.backfill.json，由 Host
 * 下一次启动时合并进 usage-stats.json。
 *
 * 注意：插件 Host 现在自带首次运行自动回填（扫描同一份会话日志），本工具
 * 仍保留用于手动强制回填 / 查看历史数据量。解析逻辑与插件共用
 * lib/session-log.js。
 *
 * 用法：
 *   node plugin/token_usage/tools/backfill-sessions.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { extractSessionRecords } from '../lib/session-log.js'

const home = homedir()
const SESSIONS = join(home, '.dsh', 'sessions')
const STATS = join(home, '.dsh', 'usage-stats.json')
const OUT = join(home, '.dsh', 'usage-stats.backfill.json')

const dry = process.argv.includes('--dry')

// 全新机器可能还没有任何会话（~/.dsh/sessions 不存在）：直接视为无历史数据，
// 不要因目录缺失而崩溃。
if (!existsSync(SESSIONS)) {
  console.log('[backfill] 未发现会话目录，无历史用量可回填:', SESSIONS)
  if (!dry) {
    writeFileSync(OUT, JSON.stringify({ records: [] }))
    console.log(`[backfill] 已写入空回填文件 ${OUT}`)
  }
  process.exit(0)
}

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
      recs = extractSessionRecords(buf)
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
