// @ts-check

/**
 * Minimal LSP client over stdio (Content-Length framed JSON-RPC).
 */
class LspClient {
  /**
   * @param {import("child_process").ChildProcess} proc
   */
  constructor(proc) {
    this.proc = proc
    this.buf = Buffer.alloc(0)
    /** @type {Map<number, { resolve: (v: unknown) => void, reject: (e: unknown) => void }>} */
    this.pending = new Map()
    this.nextId = 1
    proc.stdout.on("data", (d) => this.onData(d))
  }

  /** @param {Buffer} chunk */
  onData(chunk) {
    this.buf = Buffer.concat([this.buf, chunk])
    while (true) {
      const headerEnd = this.buf.indexOf("\r\n\r\n")
      if (headerEnd === -1) return
      const header = this.buf.slice(0, headerEnd).toString()
      const m = /Content-Length: (\d+)/i.exec(header)
      if (!m) {
        this.buf = this.buf.slice(headerEnd + 4)
        continue
      }
      const len = +m[1]
      const start = headerEnd + 4
      if (this.buf.length < start + len) return
      const body = this.buf.slice(start, start + len).toString()
      this.buf = this.buf.slice(start + len)
      this.onMessage(JSON.parse(body))
    }
  }

  /** @param {Record<string, unknown>} msg */
  onMessage(msg) {
    if (msg.method && msg.id != null) {
      const result =
        msg.method === "workspace/configuration" ? [{}] : null
      this.send({ jsonrpc: "2.0", id: msg.id, result })
      return
    }
    if (msg.id != null && this.pending.has(/** @type {number} */ (msg.id))) {
      const p = this.pending.get(/** @type {number} */ (msg.id))
      this.pending.delete(/** @type {number} */ (msg.id))
      if (msg.error) p.reject(msg.error)
      else p.resolve(msg.result)
    }
  }

  /** @param {Record<string, unknown>} msg */
  send(msg) {
    const body = JSON.stringify(msg)
    this.proc.stdin.write(
      `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`
    )
  }

  /**
   * @param {string} method
   * @param {unknown} params
   */
  request(method, params) {
    const id = this.nextId++
    this.send({ jsonrpc: "2.0", id, method, params })
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject })
    )
  }

  /**
   * @param {string} method
   * @param {unknown} params
   */
  notify(method, params) {
    this.send({ jsonrpc: "2.0", method, params })
  }
}

module.exports = { LspClient }
