import * as E from "./index.mjs"

const nth = (n, t) => $ =>
  n === 0 ? $ :
  race(
    p($, delay(t)),
    nth(n - 1, t)($)
  )

const race = (a$, b$) => s => {
  let dA = () => {}
  let dB = () => {}

  dA = a$(a => {
    dB()
    s(a)
  })
  dB = b$(b => {
    dA()
    s(b)
  })
  return () => (dA(), dB())
}

const delay = t => $ => s => {
  let i;
  let d = $(a => setTimeout(() => s(a), t))
  return () => (d(), clearTimeout(i))
}

const p =
  (a, ...fs) => fs.reduce((x, f) => f(x), a)

p(
  s => {
    s("a");
    let i = setTimeout(() => s("b"), 1000)
    return () => {}
  },
  nth(2, 2000)
)(console.log)
