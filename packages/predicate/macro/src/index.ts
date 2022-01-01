import b from "@babel/core"
import { parseExpression } from "@babel/parser"
import bt from "@babel/types"
import { createMacro, MacroError } from "babel-plugin-macros"

export default createMacro(({ references }) => doAndMapStringError(() => {
  transformPReferences(references.p ?? [])
  transformPsReferences(references.ps ?? [])
  transformPaReferences(references.pa ?? [])
}, e => new MacroError(e)))


// ----------
// p

const transformPReferences = (refs: b.NodePath<bt.Node>[]) => {
  for (let path of refs.map(r => r.parentPath))
    path?.replaceWith(pMacro(...parsePArguments(path.node)))
}

const pMacro = (...as: [] | [...Operator[], Comparator, Comparand]) => {
  if (isEmpty(as)) {
    return bt.arrowFunctionExpression(
      [bt.identifier("t")],
      bt.identifier("t")
    )
  }

  let [operators, comparator, comparand] = pop2(as);
  return bt.arrowFunctionExpression(
    [bt.identifier("t")],
    bt.binaryExpression(
      comparator,
      parseExpression(operators.reduce((t, o) => {
        if (isIndex(o)) return `${t}${o}`
        if (isTypeof(o)) return `typeof ${t}`
        assertNever(o)
      }, "t")),
      comparand
    )
  )
}

type PArguments = [] | [...Operator[], Comparator, Comparand]
const parsePArguments = (node: bt.Node) => doAndMapStringError(() => {
  if (!bt.isCallExpression(node)) throw "`p` was expected to be called"

  let as = node.arguments;
  if (as.length === 0) return [] as PArguments
  if (as.length === 1) throw "Expected 0 or >=2 arguments"
  return as.map((a, i, { length: n }) => doAndMapStringError(
    () =>
      i === n - 1 ? parseComparand(a) :
      i === n - 2 ? parseComparator(a) :
      parseOperator(a),
    e => `${e}, at argument ${i}`
  )) as PArguments

}, e => `${e}, at ${loc(node)}`)

type Operator = `${`?` | `.`}${string}` | "typeof" 
const parseOperator = (n: bt.Node) => {
  let v = parseStringLiteral(n)
  if (isIndex(v)) return v as Operator
  if (isTypeof(v)) return v as Operator
  throw `Unexpected operator '${v}'`
}
const isIndex = (o: string): o is `${`?` | `.`}${string}` =>
  o.startsWith(".") || o.startsWith("?.")
const isTypeof = (o: string): o is "typeof" => o === "typeof"

type Comparator = "===" | "!=="
const parseComparator = (n: bt.Node) => {
  let v = parseStringLiteral(n)
  if (v === "===") return v as Comparator
  if (v === "!==") return v as Comparator
  throw `Unexpected comparator '${v}'`
}

const parseStringLiteral = (n: bt.Node) => {
  if (bt.isStringLiteral(n)) return n.value;
  throw "Expected a string literal"
}

type Comparand = bt.Expression
const parseComparand = (n: bt.Node) => {
  if (bt.isExpression(n)) return n as Comparand;
  throw "Expected an expression"
}




// ----------
// ps

const transformPsReferences = (refs: b.NodePath<bt.Node>[]) => {
  for (let path of refs.map(r => r.parentPath))
    path?.replaceWith(pMacro(...parsePsArguments(path.node)))
}

const parsePsArguments = (node: bt.Node) => doAndMapStringError(() => {
  if (!bt.isCallExpression(node)) throw "`ps` was expected to be called"

  let as = node.arguments;
  if (as.length === 0) return [] as PArguments
  if (as.length !== 2) throw "Expected 0 or 2 arguments"
  let [a0, a1] = as as [bt.Node, bt.Node];

  return [
    ...parseStringLiteral(a0).split(" ")
    .map((a, i, as) => doAndMapStringError(
      () =>
        i === as.length - 1
          ? parseComparator(bt.stringLiteral(a))
          : parseOperator(bt.stringLiteral(a)) ,
      e => `${e}, at column ${as.join(" ").indexOf(a)}, at argument 0`)
    ),
    doAndMapStringError(() => parseComparand(a1), e => `${e}, at argument 1`)
  ] as PArguments

}, e => `${e}, at ${loc(node)}`)





// ----------
// pa

const transformPaReferences = (refs: b.NodePath<bt.Node>[]) => {
  for (let path of refs.map(r => r.parentPath))
    path?.replaceWith(paMacro(path.node))
}

const paMacro = (node: bt.Node) => doAndMapStringError(() => {
  if (!bt.isCallExpression(node)) throw "`pa` was expected to be called"
  
  let as = node.arguments;
  if (as.length !== 2) throw "Expected 2 arguments";

  let [a0, a1] = as as [bt.Node, bt.Node]
  if (!bt.isExpression(a0)) throw "Expected an expression, at argument 1"
  if (!bt.isExpression(a1)) throw "Expected an expression, at argument 1"

  return bt.callExpression(a1, [a0])

}, e => `${e}, at ${loc(node)}`)




// ----------
// extras

const doAndMapStringError = <R>(e: () => R, f: (e: string) => unknown) => {
  try { return e() }
  catch (e) {
    if (typeof e !== "string") throw e;
    throw f(e)
  }
}

const loc = (node: b.Node) => {
  if (!node) return "<unknown>:<unknown>"
  let start = node.loc?.start
  if (!start) return "<unknown>:<unknown>"
  return start.line + ":" + start.column;
}

const isEmpty = <T extends [] | unknown[]>(xs: T): xs is T & [] =>
  xs.length === 0

const pop2 = <A extends unknown[], B, C>(xs: [...A, B, C]) =>
  [xs.slice(0, -2), xs.slice(-2)[0], xs.slice(-1)[0]] as [A, B, C]

const assertNever: (a?: never) => never = a => {
  throw new Error(
    "Invariant: `assertNever` called with " +
    JSON.stringify(a, null, "  ")
  );
}