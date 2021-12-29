// @ts-check

const { twoslasher } = require("@typescript/twoslash")
const path = require("path")
const fs = require("fs/promises")
const { EOL } = require("os")

let testFile = path.resolve(process.cwd(), process.argv[2])

async function generate() {
  process.stdout.write("generating... ")
  let source = await fs.readFile(testFile, "utf8");
  let prefix = [
    "declare const global: any",
    "declare const expect: any",
    "declare const test: any",
  ].join(EOL) + EOL;

  let twoSlashQueries = minimalTwoSlashQueries(twoslasher(
    prefix + source, "ts", { vfsRoot: path.dirname(testFile) }
  ));

  let { imports, body } = parseSource(source)
  let generatedSource = [
    imports,
    "// @ts-ignore",
    "global.twoSlashQueries = getTwoSlashQueries()",
    body,
    "function getTwoSlashQueries() {",
    "  return (",
    JSON.stringify(twoSlashQueries, null, "  ")
    .split("\n")
    .map(l => "    " + l)
    .join(EOL),
    "  )",
    "}",
  ].join(EOL) + EOL

  await fs.writeFile(
    path.join(
      path.dirname(testFile),
      path.basename(testFile).replace("twoslash-", "")
    ),
    generatedSource
  )
  process.stdout.write("done.\n")
}
generate();

/**
 * @type {(result: import("@typescript/twoslash").TwoSlashReturn) =>
 *    { text?: string
 *    , completions?: string[]
 *    }[]
 * }
 */
function minimalTwoSlashQueries(result) {
  return result.queries
    .map(q =>
      q.kind !== "completions" ? q :
      q.completions.some(c => c.name === "globalThis")
        ? { ...q, completions: [] }
        : q
    )
    .map(q => ({
      text: q.text,
      completions:
        q.completions?.map(c => c.name)
    }))
}


/**
 * @param source {string}
 */
function parseSource(source) {
  return source
    .split(EOL)
    .reduce((r, l) =>
      l.startsWith("import") ||
      (r.body === "" && l.startsWith("/*")) // to include eslint comment
        ? { ...r, imports: r.imports + l + EOL }
        : { ...r, body: r.body + l + EOL },
      { imports: "", body: "" }
    )
}