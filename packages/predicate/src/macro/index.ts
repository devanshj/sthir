import type { types as bt, NodePath as btNodePath } from "@babel/core"
import { createMacro, MacroError } from "babel-plugin-macros"

export default createMacro(({ references, babel: { types: bt, parse, traverse } }) => {
  const main = () => doAndMapStringError(() => {
    transformPReferences(references.p ?? [])
    transformPaReferences(references.pa ?? [])
  }, e => new MacroError(e))

  
  // ----------
  // p

  const transformPReferences = (refs: btNodePath<bt.Node>[]) => {
    for (let path of refs.map(r => r.parentPath))
      path?.replaceWith(pMacro(parsePArguments(path.node)))
  }

  const pMacro = ({ value: as, identifiers: $s }: PArguments) => {
    if (as.length === 0) {
      return bt.identifier("Boolean")
    }

    let operators = 
      as.filter(a =>
        typeof a === "string" &&
        (isIndex(a) || isTypeof(a) || isBitwiseAnd(a))
      ) as Operator[]

    let operation = 
      parseExpression(operators.reduce((v, o) => {
        if (isIndex(o)) return `(${v}${o})`
        if (isTypeof(o)) return `(typeof ${v})`
        if (isBitwiseAnd(o)) return `(${v} ${o.replace("&", "& ")})`
        assertNever(o)
      }, "t"))
    
    fillIdentifiers(operation, $s)

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

  const fillIdentifiers = (destination: bt.Expression, identifiers: PArguments["identifiers"]) => {
    traverse(destination, {
      Identifier: n => {
        if (!n.node.name.startsWith("$")) return
        let i = Number(n.node.name.replace("$", ""))
        n.replaceWith(identifiers[i]!)
      },
      noScope: true
    })
  }

  type PArguments = 
    { value: [...Operator[], ...([] | [Comparator, Comparand])]
    , identifiers: bt.Expression[]
    }

  type Operator = `${`?` | `.`}${string}` | "typeof" | `&${string}`
  type Comparator = "===" | "!=="
  type Comparand = bt.Expression

  const parsePArguments = (node: bt.Node) => doAndMapStringError(() => {
    if (!bt.isCallExpression(node)) throw "`p` was expected to be called"

    let as = node.arguments
    if (as.length === 0) return { value: [], identifiers: [] } as PArguments

    if (!(bt.isStringLiteral(as[0]) || bt.isTemplateLiteral(as[0]))) {
      throw "Expected a string or template literal, at first argument"
    }
    let osCor =
      bt.isStringLiteral(as[0]) ? as[0].value.split(" ") :
      as[0].quasis.map(q => q.value.raw)
      .map((q, i, qs) => i !== qs.length - 1 ? `${q}$${i}` : q)
      .join("").split(" ")

    let identifiers =
      bt.isTemplateLiteral(as[0]) ? as[0].expressions : []

    if (as[1] && !bt.isExpression(as[1])) throw "Expected an expression, at first argument"
    let cnd = as[1]
    
    let os = (cnd !== undefined ? osCor.slice(0, -1) : osCor) as Operator[]
    let cor = (cnd ? osCor.slice(-1)[0] : undefined) as Comparator | undefined

    for (let o of os) {
      if (isIndex(o)) continue
      if (isTypeof(o)) continue
      if (isBitwiseAnd(o)) continue
      assertNever(o, `Unexpected operator "${o}"`)
    }
    if (cnd) {
      if (!cor) throw `Expected an comparator`
      if (!isComparator(cor)) throw `Unexpected comparator "${cor}"`
    }

    if (!cnd) return { value: os, identifiers } as PArguments
    return { value: [...os, cor, cnd], identifiers } as PArguments

  }, e => `${e}, at ${loc(node)}`)

  const isIndex = (o: string): o is `${`?` | `.`}${string}` =>
    o.startsWith(".") || o.startsWith("?.")

  const isTypeof = (o: string): o is "typeof" =>
    o === "typeof"

  const isBitwiseAnd = (o: string): o is `&${string}` =>
    o.startsWith("&")

  const isComparator = (c: string): c is "===" | "!==" =>
    c === "===" || c === "!=="

  const isComparand = (n: bt.Node): n is Comparand =>
    bt.isExpression(n)




  // ----------
  // pa

  const transformPaReferences = (refs: btNodePath<bt.Node>[]) => {
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

  const parseExpression = (code: string) => {
    let file = parse(code) as bt.File
    return (file.program.body[0]! as bt.ExpressionStatement).expression
  }

  const doAndMapStringError = <R>(e: () => R, f: (e: string) => unknown) => {
    try { return e() }
    catch (e) {
      if (typeof e !== "string") throw e
      throw f(e)
    }
  }

  const loc = (node: bt.Node) => {
    if (!node) return "<unknown>:<unknown>"
    let start = node.loc?.start
    if (!start) return "<unknown>:<unknown>"
    return start.line + ":" + start.column;
  }

  const assertNever: (a?: never, error?: unknown) => never = (a, error) => {
    throw (error ?? new Error(
      "Invariant: `assertNever` called with " +
      JSON.stringify(a, null, "  ")
    ));
  }

  return main()
})
