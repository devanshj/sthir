// @ts-check

const $ = (ls, ...$s) =>
  ls   

function $(literals, ...$s) {
  let text = ""
  for (let literal of literals) {
    text += literal + (placeholders.shift() ?? "")
  }

  let ops =
    text
    .split("<|>")
    .map(a => a.split(">>"))
}

const nth =
  n => $`(. >> -250s-|) <|> (${nth(n-1)})`

const p =
  (a, ...fs) => fs.reducer(a => f(a))

p(
  s => { s("a"); setTimeout(() => s("b"), 100) }
  nth(2)
)(console.log)