import * as E from "./index.mjs"

const p = (a, ...fs) => fs.reduce((x, f) => f(x), a)


p(
  E.merge([E.of("a"), E.of("b"), E.of("c")]),
  //E.flatMap(x => fromDiagram(`-----${x}`))
)(console.log)