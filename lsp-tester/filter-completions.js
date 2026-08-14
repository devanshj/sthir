// @ts-check

/**
 * Text typed so far inside the string literal containing the cursor,
 * or null when the cursor is not inside a string.
 *
 * @param {string} lineText
 * @param {number} character
 * @returns {string | null}
 */
function stringPrefixAt(lineText, character) {
  let inString = false
  let quote = ""
  let start = 0

  for (let i = 0; i < character; i++) {
    const c = lineText[i]
    if (!inString && (c === '"' || c === "'" || c === "`")) {
      inString = true
      quote = c
      start = i + 1
      continue
    }
    if (inString && c === quote && lineText[i - 1] !== "\\") {
      inString = false
      continue
    }
  }

  if (!inString) return null
  return lineText.slice(start, character)
}

/** @param {string} label */
function isOperatorLabel(label) {
  return label === "===" || label === "!==" || label === "typeof"
}

/** @param {string} label */
function isPathOrOperator(label) {
  return label.startsWith(".") || isOperatorLabel(label)
}

/**
 * Filter raw LSP completion labels the way editors do: by the string
 * literal prefix at the cursor.
 *
 * @param {string[]} labels
 * @param {string} lineText
 * @param {number} character
 */
function filterCompletions(labels, lineText, character) {
  if (labels.includes("globalThis")) return []

  const prefix = stringPrefixAt(lineText, character)

  if (prefix === null) {
    return labels.filter(isOperatorLabel)
  }

  const matching = labels.filter((label) => label.startsWith(prefix))
  if (matching.length > 0) return matching

  if (prefix.trim() === "") {
    const comparands = labels.filter((label) => !isPathOrOperator(label))
    if (comparands.length > 0) return comparands
    return labels.filter(isPathOrOperator)
  }

  return labels.filter(isPathOrOperator)
}

module.exports = { filterCompletions, stringPrefixAt }
