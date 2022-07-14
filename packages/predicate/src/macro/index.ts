import b from "@babel/core"
import { parseExpression } from "@babel/parser"
import * as bt from "@babel/types"
import { createMacro, MacroError } from "babel-plugin-macros"

export default createMacro(({ references }) => doAndMapStringError(() => {
  transformPReferences(references.p ?? [])
  transformPaReferences(references.pa ?? [])
}, e => new MacroError(e)))


// ----------
// p

const transformPReferences = (refs: b.NodePath<bt.Node>[]) => {
  for (let path of refs.map(r => r.parentPath))
    path?.replaceWith(pMacro(...parsePArguments(path.node)))
}

const pMacro = (...as: PArguments) => {
  if (as.length === 0) {
    return bt.identifier("Boolean")
  }

  let operators = 
    as.filter(a =>
      typeof a === "string" &&
      (isIndex(a) || isTypeof(a))
    ) as Operator[]

  let operation = 
    parseExpression(operators.reduce((v, o) => {
      if (isIndex(o)) return `${v}${o}`
      if (isTypeof(o)) return `typeof ${v}`
      assertNever(o)
    }, "t"))

  let comparator =
    as.find(a =>
      typeof a === "string" &&
      isComparator(a)
    ) as Comparator | undefined
  
  let comparand = 
    as.find(a =>
      typeof a === "object" &&
      isComparand(a)
    ) as Comparand | undefined

  
  if (!comparand) {
    return bt.arrowFunctionExpression(
      [bt.identifier("t")],
      bt.callExpression(bt.identifier("Boolean"), [operation])
    )
  }
  
  return bt.arrowFunctionExpression(
    [bt.identifier("t")],
    bt.binaryExpression(comparator!, operation, comparand) 
  )
}

type PArguments = 
  [...Operator[], ...([] | [Comparator, Comparand])]

type Operator = `${`?` | `.`}${string}` | "typeof"
type Comparator = "===" | "!==" | "&"
type Comparand = bt.Expression

const parsePArguments = (node: bt.Node) => doAndMapStringError(() => {
  if (!bt.isCallExpression(node)) throw "`p` was expected to be called"

  let as = node.arguments
  if (as.length === 0) return [] as PArguments

  if (!bt.isStringLiteral(as[0])) throw "Expected a string literal, at first argument"
  let osCor = as[0].value.split(" ")

  if (as[1] && !bt.isExpression(as[1])) throw "Expected an expression, at first argument"
  let cnd = as[1]
  
  let os = (cnd !== undefined ? osCor.slice(0, -1) : osCor) as Operator[]
  let cor = (cnd ? osCor.slice(-1)[0] : undefined) as Comparator | undefined

  for (let o of os) {
    if (isIndex(o)) continue
    if (isTypeof(o)) continue
    throw `Unexpected operator "${o}"`
  }
  if (cnd) {
    if (!cor) throw `Expected an comparator`
    if (!isComparator(cor)) throw `Unexpected comparator "${cor}"`
  }

  if (!cnd) return os as PArguments
  return [...os, cor, cnd] as PArguments

}, e => `${e}, at ${loc(node)}`)

const isIndex = (o: string): o is `${`?` | `.`}${string}` =>
  o.startsWith(".") || o.startsWith("?.")

const isTypeof = (o: string): o is "typeof" =>
  o === "typeof"

const isComparator = (c: string): c is "===" | "!==" | "&" =>
  c === "===" || c === "!==" || c === "&"

const isComparand = (n: bt.Node): n is Comparand =>
  bt.isExpression(n)




// ----------
// pa

const transformPaReferences = (refs: b.NodePath<bt.Node>[]) => {
  for (let path of refs.map(r => r.parentPath))
    path?.replaceWith(paMacro(path.node))
}

const paMacro = (node: bt.Node) => doAndMapStringError(() => {
  if (!bt.isCallExpression(node)) throw "`pa` was expected to be called"
  
  let as = node.arguments
  if (as.length !== 2) throw "Expected 2 arguments"

  let [a0, a1] = as as [bt.Node, bt.Node]
  if (!bt.isExpression(a0)) throw "Expected an expression, at first argument"
  if (!bt.isExpression(a1)) throw "Expected an expression, at second argument"

  return bt.callExpression(a1, [a0])

}, e => `${e}, at ${loc(node)}`)




// ----------
// extras

const doAndMapStringError = <R>(e: () => R, f: (e: string) => unknown) => {
  try { return e() }
  catch (e) {
    if (typeof e !== "string") throw e
    throw f(e)
  }
}

const loc = (node: b.Node) => {
  if (!node) return "<unknown>:<unknown>"
  let start = node.loc?.start
  if (!start) return "<unknown>:<unknown>"
  return start.line + ":" + start.column;
}

const assertNever: (a?: never) => never = a => {
  throw new Error(
    "Invariant: `assertNever` called with " +
    JSON.stringify(a, null, "  ")
  );
}