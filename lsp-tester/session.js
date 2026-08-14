// @ts-check

const { spawn } = require("child_process")
const path = require("path")
const { LspClient } = require("./client")

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * @param {unknown} contents
 * @returns {string | undefined}
 */
function formatHoverContents(contents) {
  if (!contents) return undefined
  if (typeof contents === "string") return contents
  if (Array.isArray(contents)) {
    return contents
      .map((c) => (typeof c === "string" ? c : c.value))
      .join("")
  }
  if (typeof contents === "object" && contents !== null && "value" in contents) {
    return /** @type {{ value: string }} */ (contents).value
  }
  return undefined
}

/**
 * @param {string} repoRoot
 */
async function createTs7Session(repoRoot) {
  const tsc =
    [
      path.resolve(repoRoot, "node_modules/@typescript/native/bin/tsc"),
      path.resolve(repoRoot, "node_modules/.bin/tsc"),
    ].find((p) => require("fs").existsSync(p)) ??
    path.resolve(repoRoot, "node_modules/.bin/tsc")
  const proc = spawn(tsc, ["--lsp", "--stdio"], {
    cwd: repoRoot,
    stdio: ["pipe", "pipe", "pipe"],
  })
  proc.stderr.on("data", () => {})

  const client = new LspClient(proc)
  const rootUri = "file://" + repoRoot

  await client.request("initialize", {
    processId: process.pid,
    rootUri,
    workspaceFolders: [{ uri: rootUri, name: path.basename(repoRoot) }],
    capabilities: {
      workspace: { configuration: true },
      textDocument: {
        completion: { completionItem: { snippetSupport: true } },
        hover: {},
      },
    },
  })
  client.notify("initialized", {})

  return {
    client,
    /**
     * @param {string} filePath
     * @param {string} text
     */
    async openDocument(filePath, text) {
      const uri = "file://" + filePath
      client.notify("textDocument/didOpen", {
        textDocument: { uri, languageId: "typescript", version: 1, text },
      })
      await sleep(500)
      return uri
    },
    /**
     * @param {string} uri
     * @param {number} line
     * @param {number} character
     */
    async getCompletions(uri, line, character) {
      const result = /** @type {{ items?: { label: string }[] } | null} */ (
        await client.request("textDocument/completion", {
          textDocument: { uri },
          position: { line, character },
        })
      )
      return (result?.items ?? []).map((item) => item.label)
    },
    /**
     * @param {string} uri
     * @param {number} line
     * @param {number} character
     */
    async getHover(uri, line, character) {
      const result = /** @type {{ contents?: unknown } | null} */ (
        await client.request("textDocument/hover", {
          textDocument: { uri },
          position: { line, character },
        })
      )
      const text = formatHoverContents(result?.contents)
      if (text === undefined) {
        throw new Error(
          `hover returned no info at line ${line + 1}, character ${character + 1}`
        )
      }
      return text
    },
    shutdown() {
      proc.kill()
    },
  }
}

module.exports = { createTs7Session }
