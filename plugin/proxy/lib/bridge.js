/**
 * UA 改写反向代理的核心实现。
 *
 * 背景：某些 LLM 网关按 `User-Agent` 做客户端白名单，
 * 只放行特定客户端（例如 Claude Code 的 `claude-cli/x.y.z (external, sdk-cli)`）。
 * DSH 的 `dsh-llm` 有强制归因机制：`attributionHeaders()` 把 `user-agent` 列为
 * 保留头，在 `requestHeaders()` 里会过滤掉 provider 配置的 `user-agent`，强制
 * 发送自己的 `deepseek-harness/...`，因此**无法**通过 settings.yaml 覆盖 UA。
 *
 * 本模块提供一个只监听回环地址的轻量反代：接收 DSH 的请求，把 `user-agent`
 * 改写成规则指定的值，再转发给上游网关；其余 header / body / 路径 / query /
 * 流式响应（SSE）全部原样透传。DSH 侧只需把 provider 的 baseURL 指向本代理。
 *
 * @module dsh-client-ui-proxy/bridge
 */
import http from 'node:http'
import https from 'node:https'

/** 上游 URL 解析结果：协议模块 + 主机 + 端口 + 路径前缀。 */
function parseUpstream(rawUrl) {
  const url = new URL(rawUrl)
  const isTLS = url.protocol === 'https:'
  return {
    transport: isTLS ? https : http,
    isTLS,
    hostname: url.hostname,
    port: url.port !== '' ? Number(url.port) : isTLS ? 443 : 80,
    // 上游 URL 里可能带路径前缀（如 http://host/api）。DSH 侧 baseURL 指向
    // 本代理的同名前缀，转发时按原样拼接，避免前缀被吞掉或重复。
    prefix: url.pathname.replace(/\/+$/, ''),
  }
}

/**
 * 启动一条 UA 改写代理。
 * @param rule - 已校验的规则：{ listenPort, upstream, userAgent }。
 * @returns 运行句柄：{ port, close() }。
 */
export function startBridge(rule) {
  const upstream = parseUpstream(rule.upstream)
  const fakeUA = rule.userAgent

  const server = http.createServer((req, res) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('error', () => {
      if (!res.headersSent) res.writeHead(400)
      res.end()
    })
    req.on('end', () => {
      const body = Buffer.concat(chunks)
      const headers = { ...req.headers }
      // 核心：改写 UA + 指向上游 host。
      headers['user-agent'] = fakeUA
      headers['host'] = upstream.hostname
      // 让上游按未压缩返回，避免我们透传时与 content-length 打架。
      delete headers['accept-encoding']
      delete headers['content-length']
      if (body.length > 0) headers['content-length'] = String(body.length)
      // hop-by-hop 头不应转发。
      delete headers['connection']
      delete headers['proxy-connection']
      delete headers['keep-alive']
      delete headers['transfer-encoding']
      delete headers['upgrade']

      // 请求路径：DSH 发来的 path 已含代理侧前缀，直接透传给上游即可。
      const path = req.url

      const forward = upstream.transport.request(
        {
          hostname: upstream.hostname,
          port: upstream.port,
          path,
          method: req.method,
          headers,
        },
        (upRes) => {
          res.writeHead(upRes.statusCode || 502, upRes.headers)
          upRes.pipe(res) // 透传，天然支持 SSE 流式
        },
      )
      forward.on('error', (e) => {
        if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ error: 'proxy upstream error', message: String((e && e.message) || e) }))
      })
      forward.end(body)
    })
  })

  return new Promise((resolve, reject) => {
    const onError = (e) => {
      server.removeListener('error', onError)
      reject(e)
    }
    server.on('error', onError)
    // 只绑回环，绝不对外暴露。
    server.listen(rule.listenPort, '127.0.0.1', () => {
      server.removeListener('error', onError)
      // 监听成功后把 error 交给运行期处理，避免未捕获异常打挂 Host。
      server.on('error', () => {})
      resolve({
        port: rule.listenPort,
        close: () =>
          new Promise((done) => {
            server.close(() => done())
            server.closeAllConnections?.()
          }),
      })
    })
  })
}
