// @ts-check

const path = require("path")
const fs = require("fs/promises")
const { EOL } = require("os")
const { parseMarkers } = require("./parse-markers")
const { createTs7Session } = require("./session")
const { filterCompletions } = require("./filter-completions")

const testFile = path.resolve(process.cwd(), process.argv[2])
const repoRoot = path.resolve(__dirname, "..")
const tempFileName = ".lsp-temp.ts"

const lspPrefix = [
  "declare const global: any",
  "declare const expect: any",
  "declare const test: any",
].join(EOL) + EOL

const lspPrefixLines = lspPrefix.split(EOL).length - 1

const completionQuery = /query\(\)\.completions/
const hoverQuery = /query\(\)\.text/

async function generate() {
  process.stdout.write("generating... ")

  const source = await fs.readFile(testFile, "utf8")
  const { queries } = parseMarkers(source)
  const lspSource = lspPrefix + source
  const lspQueries = queries.map((q) => ({
    ...q,
    line: q.line + lspPrefixLines,
  }))
  const testDir = path.dirname(testFile)
  const tempFile = path.join(testDir, tempFileName)
  await fs.writeFile(tempFile, lspSource)

  const session = await createTs7Session(repoRoot)
  const uri = await session.openDocument(tempFile, lspSource)
  const lspLines = lspSource.split(EOL)

  /** @type {{ text?: string, completions?: string[] }[]} */
  const results = []
  for (const q of lspQueries) {
    if (q.kind === "completions") {
      const raw = await session.getCompletions(uri, q.line, q.character)
      const completions = filterCompletions(
        raw,
        lspLines[q.line],
        q.character
      )
      results.push({ completions })
    } else {
      const text = await session.getHover(uri, q.line, q.character)
      results.push({ text })
    }
  }

  session.shutdown()
  await fs.unlink(tempFile)

  let resultIndex = 0
  const body = source.replace(
    new RegExp(`${completionQuery.source}|${hoverQuery.source}`, "g"),
    (match) => {
      const result = results[resultIndex++]
      if (match === "query().completions") {
        return JSON.stringify(result.completions ?? [])
      }
      return JSON.stringify(result.text ?? "")
    }
  )

  const { imports, body: parsedBody } = parseSource(body)
  const generatedSource = imports + parsedBody

  await fs.writeFile(
    path.join(testDir, path.basename(testFile).replace("lsp-", "")),
    generatedSource
  )

  process.stdout.write("done.\n")
}

/**
 * @param {string} source
 */
function parseSource(source) {
  return source.split(EOL).reduce(
    (r, l) =>
      l.startsWith("import") ||
      (r.body === "" && l.startsWith("/*"))
        ? { ...r, imports: r.imports + l + EOL }
        : { ...r, body: r.body + l + EOL },
    { imports: "", body: "" }
  )
}

generate().catch((err) => {
  console.error(err)
  process.exit(1)
})
