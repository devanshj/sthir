import type { types as bt, NodePath as btNodePath } from "@babel/core"
import { createMacro, MacroError } from "babel-plugin-macros"

export default createMacro(({ references, babel: { types: bt, parse, traverse } }) => () => {
  const main = () => doAndMapStringError(() => {
    transformEReferences(references.e ?? [])
  }, e => new MacroError(e))

  // ----------
  // e

  const transformEReferences = (refs: btNodePath<bt.Node>[]) => {
    for (let path of refs.map(r => r.parentPath))
      path?.replaceWith(eMacro(...parseEArguments(path.node)))
  }

  const eMacro = (...[a]: EArguments) => {
    if (bt.isStringLiteral(a)) return parseExpression(a.value)

    let n = parseExpression(a.quasis.map(q => q.value.raw).join("$"))
    let i = 0
    traverse(n, {
      Identifier: n => (n.replaceWith(a.expressions[i]!), i++),
      noScope: true
    })
    return n
  }

  type EArguments = 
    [bt.StringLiteral | bt.TemplateLiteral]

  const parseEArguments = (node: bt.Node) => doAndMapStringError(() => {
    if (!bt.isCallExpression(node)) throw "`e` was expected to be called"

    let as = node.arguments
    if (!(as.length === 1)) throw "`e` expects 1 argument"

    if (!(bt.isStringLiteral(as[0]) || bt.isTemplateLiteral(as[0]))) {
      throw "`e` expects a string or template literal as the first argument"
    }

    return as as EArguments
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

  return main()
})
