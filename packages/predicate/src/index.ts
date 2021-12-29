export { p, ps, pa }

import { P, Pa, Ps } from "./types"

// ----------
// p

type PImpl = 
  (...a: [...Operator[], Comparator, Comparand]) =>
    (operand: Operand) => boolean

type Operand = unknown & { __isOperand: true }
type Operator = (`${`?` | `.`}${string}` | "typeof") & { __isOperator: true }
type Comparator = "===" & { __isComparator: true }
type Comparand = unknown & { __isComparand: true }

const pImpl: PImpl = (...as) => (operand) => {
  let [operators, comparator, comparand] = pop2(as)
  return compare(operators.reduce(operate, operand), comparator, comparand)
}
const p = pImpl as P

const operate = (t: Operand, o: Operator): Operand => {
  if (/^(\.|\?\.)/.test(o)) {
    return get(t, o.replace(/^(\.|\?\.)/, "").replace(/\?\./g, ".").split(".")) as Operand
  }
  if (o === "typeof") {
    return (typeof t) as unknown as Operand
  }
  assertNever(o as never)
}

const compare = (operand: Operand, comparator: Comparator, comparand: Comparand): boolean => {
  if (comparator === "===") {
    return (operand as unknown) === comparand
  }
  assertNever(comparator)
}




// ----------
// ps

type PsImpl = 
  (...a: [OperatorsComparator, Comparand]) =>
    (operand: Operand) => boolean
type OperatorsComparator = string & { __isOperatorsComparator: true }

const psImpl: PsImpl = (a0, a1) =>
  pImpl(...(a0.split(" ") as [...Operator[], Comparator]), a1)
const ps = psImpl as Ps;




// ---------
// pa

const pa = ((t, p) => p(t)) as Pa




// ----------
// extras

const get = (t: unknown, ks: string[]): unknown => {
  if (ks.length === 0) return t;
  let [k, ...ks_] = ks as [string, ...string[]]
  if (t === undefined || t === null) return t;
  return get((t as never)[k], ks_)
}
 
const pop2 = <A extends unknown[], B, C>(xs: [...A, B, C]) =>
  [xs.slice(0, -2), xs.slice(-2)[0], xs.slice(-1)[0]] as [A, B, C]

const assertNever: (a?: never) => never = a => {
  throw new Error(
    "Invariant: `assertNever` called with " +
    JSON.stringify(a, null, "  ")
  );
}