// @ts-check

const completionsMarker = /^\s*\/\/\s*\^\|$/
const hoverMarker = /^\s*\/\/\s*\^\?\s*$/

/**
 * @typedef {{ kind: "completions" | "hover", line: number, character: number }} LspQuery
 */

/**
 * Marker lines stay in the source for LSP queries (twoslash queries before
 * stripping). Only the generated test file omits markers via parseSource.
 *
 * @param {string} source
 * @returns {{ queries: LspQuery[] }}
 */
function parseMarkers(source) {
  const lines = source.split(/\r\n?|\n/g)
  /** @type {LspQuery[]} */
  const queries = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.includes("//")) continue

    if (hoverMarker.test(line)) {
      queries.push({
        kind: "hover",
        line: i - 1,
        character: line.indexOf("^"),
      })
    } else if (completionsMarker.test(line)) {
      queries.push({
        kind: "completions",
        line: i - 1,
        character: line.indexOf("^"),
      })
    }
  }

  return { queries }
}

module.exports = { parseMarkers }
