export { p, pa }

import { P, Pa } from "./types"

// ----------
// p

type PImpl = 
  (...a: [] | [Operators] | [OperatorsComparator, Comparand]) =>
    (operand: Operand) => boolean

type Operand = unknown & { __isOperand: true }
type Operators = string & { __isOperators: true }
type OperatorsComparator = string & { __isOperatorsComparator: true }
type Comparand = unknown & { __isComparand: true }

const pImpl: PImpl = (...a) => t => {
  if (isEmpty(a)) return Boolean(t)

  let [_osCor, cnd] = a
  let osCor = _osCor.split(" ") as
    (`.${string}` | `?.${string}` | "typeof" | "===" | "!==" | `&${string}`)[]

  return osCor.reduce((v, x) => {
    if (doesStartWith(x, ".") || doesStartWith(x, "?.")) return get(
      v,
      x.replace("?.", ".").replace(/^\./, "").split(".")
    )
    if (x === "typeof") return typeof v
    if (x === "===") return v === (cnd as unknown)
    if (x === "!==") return v !== (cnd as unknown)
    if (doesStartWith(x, "&")) return (v as number) & Number(x.slice(1))

    if (process.env.NODE_ENV === "development") {
      assertNever(x)
    }
    return v
  }, t as unknown) as boolean
}
  
const p = pImpl as P



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

const isEmpty = <T extends [] | unknown[]>(xs: T): xs is T & [] =>
  xs.length === 0

const doesStartWith =
  <S extends string, H extends string>
    (s: S, h: H): s is S & `${H}${string}` =>
      s.startsWith(h)

const assertNever: (a?: never) => never = a => {
  throw new Error(
    "Invariant: `assertNever` called with " +
    JSON.stringify(a, null, "  ")
  )
}