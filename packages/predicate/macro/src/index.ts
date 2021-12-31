import { NodePath, Node } from "@babel/core"
import { parseExpression } from "@babel/parser"
import t, { Expression } from "@babel/types"
import { createMacro, MacroError } from "babel-plugin-macros"


type Operator = `${`?` | `.`}${string}` | "typeof"
type Comparator = "==="
type Comparand = Expression

const predicate = (...as: [...Operator[], Comparator, Comparand]) => {
  let [operators, comparator, comparand] = pop2(as);

  return t.arrowFunctionExpression(
    [t.identifier("t")],
    t.binaryExpression(
      comparator,
      parseExpression(operators.reduce((t, o) => {
        if (/^(\.|\?\.)/.test(o)) return `${t}${o}`
        if (o === "typeof") return `typeof ${t}`
        return "" as never;
      }, "t")),
      comparand
    )
  )
}

const pMacro = (path: NodePath<Node> | null) => {
  if (!path || !t.isCallExpression(path.node)) {
    throw new MacroError("`p` was expected to be called at " + loc(path?.node));
  }
  if (path.node.arguments.length < 2) {
    throw new MacroError("`p` expected 2 or more arguments at " + loc(path.node));
  }
  
  let args = path.node.arguments.map((node, i, nodes) => {
    if (i < nodes.length - 2) {
      if (!t.isStringLiteral(node)) {
        throw new MacroError("A string literal was expected at" + loc(node));
      }
      if (!(/^(\.|\?\.)/.test(node.value) || node.value === "typeof")) {
        throw new MacroError(`Unsupported operator ${node.value} at ${loc(node)}`);
      }
      return node.value
    }
    if (i < nodes.length - 1) {
      if (!t.isStringLiteral(node)) {
        throw new MacroError("A string literal was expected at" + loc(node));
      }
      if (node.value !== "===") {
        throw new MacroError(`Unsupported comparator at ${node.value} at ${loc(node)}`);
      }
      return node.value
    }
    if (!t.isExpression(node)) {
      throw new MacroError("`p` expected an expression as the last argument at" + loc(node));
    }
    return node;
  }) as [...Operator[], Comparator, Comparand]

  path.replaceWith(predicate(...args));
}

const psMacro = (path: NodePath<Node> | null) => {
  if (!path || !t.isCallExpression(path.node)) {
    throw new MacroError("`ps` was expected to be called at " + loc(path?.node));
  }
  if (path.node.arguments.length !== 2) {
    throw new MacroError("`ps` expected 2 arguments at " + loc(path.node));
  }
  if (!t.isStringLiteral(path.node.arguments[0])) {
    throw new MacroError("`ps` expected a string literal as the first argument at " + loc(path.node));
  }

  let operatorsComparator = path.node.arguments[0].value.split(" ") as [...Operator[], Comparator]
  operatorsComparator.forEach((v, i, vs) => {
    if (i === vs.length - 1 && v !== "===") {
      throw new MacroError(`Unsupported comparator at ${v} at ${loc(path.node)}`);
    }
    if (!(/^(\.|\?\.)/.test(v) || v === "typeof")) {
      throw new MacroError(`Unsupported operator ${v} at ${loc(path.node)}`);
    }
  })

  if (!t.isExpression(path.node.arguments[1])) {
    throw new MacroError("`ps` expected an expression as the second argument at " + loc(path.node));
  }
  let comparand = path.node.arguments[1]

  path.replaceWith(predicate(...operatorsComparator, comparand));
}

const paMacro = (path: NodePath<Node> | null) => {
  if (!path || !t.isCallExpression(path.node)) {
    throw new MacroError("`pa` was expected to be called at " + loc(path?.node));
  }
  if (path.node.arguments.length !== 2) {
    throw new MacroError("`pa` expected 2 arguments at " + loc(path.node));
  }
  if (!t.isExpression(path.node.arguments[1])) {
    throw new MacroError("`pa` expected an expression as second argument at " + loc(path.node));
  }

  return t.callExpression(
    path.node.arguments[1]!,
    [path.node.arguments[0]!]
  )
}

export default createMacro(({ references }) => {
  references.p?.map(r => r.parentPath).forEach(pMacro);
  references.ps?.map(r => r.parentPath).forEach(psMacro);
  references.pa?.map(r => r.parentPath).forEach(paMacro);
})

const loc = (node: Node | undefined) => {
  if (!node) return "<unknown>:<unknown>"
  let start = node.loc?.start
  if (!start) return "<unknown>:<unknown>"
  return start.line + ":" + start.column;
}

const pop2 = <A extends unknown[], B, C>(xs: [...A, B, C]) =>
  [xs.slice(0, -2), xs.slice(-2)[0], xs.slice(-1)[0]] as [A, B, C]