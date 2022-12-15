// TODO:
// - tests
// - ok and innerOk with score

export {
  Parser,
  name_ as name,
  is,

  intersect,
  union,
  then,

  object,
  record,

  tuple,
  array,

  string,
  number,
  boolean,
  null_ as null,
  undefined_ as undefined,
  symbol,
  bigint,

  value,
  predicate,
  accumulateErrors,

  bindLazy,
  UnknownParser,
  Parsed,
  Parsee,
  ParseeConstraint,
}


// ----------------------------------------------------------------------------------------------------

/**
 * parses a value of type `A` into type `T`
 * @param T parsed type
 * @param A parsee type (default is `unknown`)
 */
interface Parser<out T extends [A] extends [never] ? unknown : A, in A = unknown>
  { (this: unknown, a: A): Generator<ParserYield<T>, void>
  , typeName?: string
  }

/** supertype of all parsers, ie all parsers are assignable to this type */
interface UnknownParser
  extends Parser<unknown, never> {}

type ParserYield<T> =
  | void
  | ParserOkYield<T>
  | ParserErrorYield
  | ParserInnerOkYield

interface ParserOkYield<T>
  { type: "ok", value: T }

interface ParserErrorYield
  { type: "error", value: string }

interface ParserInnerOkYield
  { type: "innerOk" }

type Parsed<P extends UnknownParser> =
  P extends Parser<infer T, never> ? T : never

type Parsee<P extends UnknownParser> =
  P extends Parser<any, infer A> ? A : never

type ParseeConstraint<P extends UnknownParser> =
  unknown extends Parsee<P> ? never : Parsee<P>

interface _T
  { _isT: true }

interface _U
  { _isU: true }

interface _A
  { _isA: true }

type _K =
  & PropertyKey
  & { _isK: true }


// ----------------------------------------------------------------------------------------------------

type IntersectR =
  <Ps extends UnknownParser[]>
  (contituents: [...Ps]) =>
    Intersect<Ps>

type Intersect<Ps extends UnknownParser[]> =
  { [I in keyof Ps]: [Parsed<Ps[I]>] }[number] extends infer T ?
  { [I in keyof Ps]: [Parsee<Ps[I]>] }[number] extends infer A ?
  Parser<WrappedUnionToIntersection<T>, WrappedUnionToIntersection<A>> : never : never

type WrappedUnionToIntersection<U> = 
  (U extends unknown ? ((u: U) => void) : never) extends ((i: infer I) => void) ? I[0 & keyof I] : never

type TestL98 =
  Test<AreEqual<
    Intersect<[Parser<{ a: "a" } | { b: "b" }>, Parser<{ c: "c" }>]>,
    Parser<({ a: "a" } | { b: "b" }) & { c: "c" }>
  >>
  
type TestL105 =
  Test<AreEqual<
    Intersect<[
      Parser<{ a: "a" } | { b: "b" }, { a?: string, b?: string }>,
      Parser<{ c: "c" }, { c: string | number }>
    ]>,
    Parser<
      ({ a: "a" } | { b: "b" }) & { c: "c" },
      { a?: string, b?: string } & { c: string | number }
    >
  >>

type IntersectImpl =
  (ps: Parser<_T>[]) => Parser<_T, unknown>

let intersectImpl: IntersectImpl = ps => {
  ps = ps.filter(p => p !== unknown)
  if (ps.length === 1) return ps[0]!
  return function* (a) {
    let eP = hasTypeName(this) ? `is not of type '${this.typeName}' as it ` : ""
    let gs = [] as ReturnType<Parser<_T>>[]
    let irs = [] as Extract<keyof typeof gs, number>[]

    let everyOk = true
    while (ps.length > irs.length) {
      for (let i = 0; i < ps.length; i++) {
        let g = gs[i] ?? (gs[i] = ps[i]!(a))
        if (irs.includes(i)) continue
        let y = g.next().value
        if (!y) { irs.push(i); continue }
        if (y.type === "error") { yield { type: "error", value: eP + y.value }; everyOk = false; continue }
        if (y.type === "innerOk") { yield y; continue }
        if (y.type === "ok") { yield { type: "innerOk" }; continue }
        assertNever(y)
      }
    }
    if (everyOk) yield { type: "ok", value: a as _T }
  }
}

const intersect = intersectImpl as unknown as IntersectR



// ----------------------------------------------------------------------------------------------------

type UnionR =
  <Ps extends UnknownParser[]>
  (constituents: [...Ps]) =>
    Union<Ps>

type Union<Ps extends UnknownParser[]> =
  WrappedUnionToIntersection<{ [I in keyof Ps]: [Parsee<Ps[I]>] }[number]> extends infer A
    ? ParserAsserted<{ [I in keyof Ps]: Parsed<Ps[I]> }[number], A>
    : never

type ParserAsserted<T, A> =
  Parser<[T] extends [A] ? T : T & A, A>

type Test165 =
  Test<AreEqual<
    Union<[Parser<{ a: "a" } & { b: "b" }>, Parser<{ c: "c" }>]>,
    Parser<({ a: "a" } & { b: "b" }) | { c: "c" }>
  >>

type TestL171 =
  Test<AreEqual<
    Union<[
      Parser<{ a: "a" } & { b: "b" }, { a?: string, b?: string }>,
      Parser<{ c: "c" }, { c: string | number }>
    ]>,
    Parser<
      (({ a: "a" } & { b: "b" }) | { c: "c" }) & ({ a?: string, b?: string } & { c: string | number }),
      { a?: string, b?: string } & { c: string | number }
    >
  >>

type UnionImpl =
  (ps: Parser<_T>[]) => Parser<_T>

let unionImpl: UnionImpl = ps => function* (a) {
  let eP = (hasTypeName(this) ? `is not of type '${this.typeName}', as it ` : "")
  let gs = ps.map(() => undefined as ReturnType<Parser<_T>> | undefined)
  let irs = [] as Extract<keyof typeof gs, number>[]
  let bestI = undefined as Extract<keyof typeof ps, number> | undefined
  let someOk = false
  let ss = ps.map(() => 0)
  let yss = ps.map(() => [] as ParserYield<_T>[])

  root: while (gs.length > irs.length) {
    for (let i = 0; i < gs.length; i++) {
      let g = gs[i] ?? (gs[i] = ps[i]!(a))
      if (irs.includes(i)) continue
      let y = g.next().value
      yss[i]!.push(y)
      if (!y) { irs.push(i); continue }
      if (y.type === "error") { irs.push(i); continue }
      if (y.type === "innerOk") { ss[i]++; continue }
      if (y.type === "ok") { bestI = i; someOk = true; break root }
      assertNever(y)
    }
  }

  if (bestI === undefined) {
    let bestS = Math.max(...ss)
    bestI = ss.findIndex(s => s === bestS)
  }
  let bestYs = yss[bestI!]!
  if (someOk) {
    yield* bestYs
    if (bestYs[bestYs.length - 1] !== undefined) {
      yield* gs[bestI!]!
    }
  } else {
    let bestName = ps[bestI!]!.typeName ?? ordinal(bestI!) + " constituent"
    eP += `did not match any contituents, best match was '${bestName}', but it `
    yield* bestYs.map((y): ParserYield<_T> => {
      if (y?.type === "error") return { type: "error", value: eP + y.value }
      return y
    })
    if (bestYs.slice(-1)[0] !== undefined) {
      for (let y of gs[bestI!]!) {
        if (y?.type === "error") { yield { type: "error", value: eP + y.value }; continue }
        yield y
      }
    }
  }
}
const union = unionImpl as unknown as UnionR



// ----------------------------------------------------------------------------------------------------

type ObjectR = 
  <Ps extends Record<string, UnknownParser>>
  (ps: Ps) =>
    ObjectT<Ps>

type ObjectT<Ps> =
  ParserAsserted<
    UnifyStructure<
      & { [K in keyof Ps as ExtractNonOptionalProperty<K>]: Parsed<Cast<Ps[K], UnknownParser>> }
      & { [K in keyof Ps as ExtractOptionalProperty<K>]?: Parsed<Cast<Ps[K], UnknownParser>> }
    >,
    CleanStructure<UnifyStructure<
      & { [K in keyof Ps as ExtractNonOptionalProperty<K>]: Parsee<Cast<Ps[K], UnknownParser>> }
      & { [K in keyof Ps as ExtractOptionalProperty<K>]?: Parsee<Cast<Ps[K], UnknownParser>> }
    >>
  >

type UnifyStructure<T> =
  { [K in keyof T]: T[K] }

type CleanStructure<T> =
  keyof T extends infer K
    ? true extends (K extends unknown ? (unknown extends T[K & keyof T] ? true : false) : never)
      ? unknown
      : T
    : never

type ExtractOptionalProperty<K> = 
  K extends `${infer X}?`
    ? X extends `${string}\\` ? never : X
    : never

type ExtractNonOptionalProperty<K> = 
  K extends `${infer X}?`
    ? X extends `${infer Y}\\` ? `${Y}?` : never
    : K

type Cast<T, U> =
  T extends U ? T : U

type Test285 =
  Test<AreEqual<
    ObjectT<{ a: Parser<"a">, "b?": Parser<"b">, "c\\?": Parser<"c"> }>,
    Parser<{ a: "a", b?: "b", "c?": "c" }>
  >>

type Test291 =
  Test<AreEqual<
    ObjectT<{ a: Parser<"a", string>, "b?": Parser<"b", string>, "c\\?": Parser<"c", string> }>,
    Parser<
      { a: "a", b?: "b", "c?": "c" },
      { a: string, b?: string, "c?": string }
    >
  >>

type ObjectImpl = 
  (ps: Record<string, Parser<_T>>) => Parser<Record<string, _T>>

const objectImpl: ObjectImpl = ps => function* (a) {
  let eP = hasTypeName(this) ? `is not of type '${this.typeName}' as it ` : ""

  if (typeof a !== "object" || a === null) {
    yield { type: "error", value: eP + "is not an object" }
    return
  }
  let aks = Object.keys(a)
  for (let k of Object.keys(ps)) {
    if (k.endsWith("?") && !k.endsWith("\\?")) continue
    if (!aks.includes(k)) {
      yield { type: "error", value: eP + `is missing key '${k.replace(/\\\?$/, "?")}'` }
    }
  }
  
  eP =
    eP === "" ? eP :
    eP.slice(0, "it ".length * -1) + "it's "

  for (let y of intersect(Object.entries(a).flatMap(([k, v]) => {
    let p = ps[k] ?? ps[k + "?"]
    if (!p) return []
    return [function*(_: unknown) {
      for (let y of p!(v)) {
        if (y?.type === "error") { yield { type: "error" as "error", value: eP + `value at key '${k}' ${y.value}` }; continue }
        yield y
      }
    }]
  }))(undefined)) {
    if (!y) { yield y; continue }
    if (y.type === "ok") { yield { type: "ok", value: a as Record<string, _T> }; continue }
    yield y
  }
}

const object = objectImpl as unknown as ObjectR



// ----------------------------------------------------------------------------------------------------

type Tuple = 
  <Ps extends (UnknownParser | [UnknownParser, "?"])[]>
  (elements: ParseElementParsers<Ps>) =>
    TupleT<Ps>

type ParseElementParsers<Ps, DidFindOptional = false> = 
  Ps extends [] ? [] :
  Ps extends [infer X extends [unknown, "?"], ...infer R]
    ? [X, ...ParseElementParsers<R, true>] :
  Ps extends [infer X, ...infer R]
    ? [ DidFindOptional extends true
          ? "Error: This element must be optional as it follows an optional element"
          : X
      , ...ParseElementParsers<R>
      ] :
  never
    
type TupleT<Ps> =
  ParserAsserted<TupleTParsed<Ps>, CleanStructure<TupleTParsee<Ps>>>

type TupleTParsed<Ps> = 
  Ps extends [] ? [] :
  Ps extends [[infer X extends UnknownParser, "?"], ...infer R] ? [Parsed<X>?, ...TupleTParsed<R>] :
  Ps extends [infer X extends UnknownParser, ...infer R] ? [Parsed<X>, ...TupleTParsed<R>] :
  never

type TupleTParsee<Ps> = 
  Ps extends [] ? [] :
  Ps extends [[infer X extends UnknownParser, "?"], ...infer R] ? [Parsee<X>?, ...TupleTParsee<R>] :
  Ps extends [infer X extends UnknownParser, ...infer R] ? [Parsee<X>, ...TupleTParsee<R>] :
  never

type Test373 =
  Test<AreEqual<
    TupleT<[Parser<"a">, Parser<"b">, [Parser<"c">, "?"]]>,
    Parser<["a", "b", "c"?]>
  >>

type Test379 =
  Test<AreEqual<
    TupleT<[Parser<"a", string>, Parser<"b", string | number>, [Parser<"c", string>, "?"]]>,
    Parser<["a", "b", "c"?], [string, string | number, string?]>
  >>

type TupleImpl = 
  (ps: (Parser<_T> | [Parser<_T>, "?"])[]) => Parser<unknown[] & Record<string, _T>>

const tupleImpl: TupleImpl = ps => then(
  function* (a: unknown) {
    let eP: string = hasTypeName(this) ? `is not of type '${this.typeName}' as it ` : ""
    if (!Array.isArray(a)) {
      yield { type: "error", value: eP + "is not an array" }
      return
    }
    yield { type: "ok", value: a as unknown[] };
  },
  object(Object.fromEntries(
    ps.map((p, i) => [i.toString() + (Array.isArray(p) ? "?" : ""), Array.isArray(p) ? p[0] : p])
  ))
)

const tuple = tupleImpl as unknown as Tuple




// ----------------------------------------------------------------------------------------------------

type RecordR = 
  <K extends Parser<PropertyKey, never>, V extends UnknownParser>
  (key: K, value: V) =>
    RecordT<K, V>
    
type RecordT<K extends Parser<PropertyKey, never>, V extends UnknownParser> =
  ParserAsserted<
    Record<Parsed<K>, Parsed<V>>,
    [unknown, unknown] extends [Parsee<K>, Parsee<V>]
      ? unknown
      : Record<Parsee<K> & PropertyKey, Parsee<V>>
  >

type Test422 =
  Test<AreEqual<
    RecordT<Parser<"a">, Parser<"b">>,
    Parser<Record<"a", "b">>
  >>

type Test428 =
  Test<AreEqual<
    RecordT<Parser<"a", string>, Parser<"b", string | number>>,
    Parser<Record<"a", "b">, Record<string, string | number>>
  >>

type RecordImpl = 
  (k: Parser<_K>, v: Parser<_T>) => Parser<Record<_K, _T>>

const recordImpl: RecordImpl = (k, v) => function* (a) {
  let eP = hasTypeName(this) ? `is not of type '${this.typeName}' as it ` : ""

  if (typeof a !== "object" || a === null) {
    yield { type: "error", value: eP + "is not an object" }
    return
  }

  eP =
    eP === "" ? eP :
    eP.slice("it ".length * -1) + "it's "

  for (let y of intersect(Object.entries(a).map(([ak, av]) => intersect([k === unknown ? unknown : function*(_: unknown) {
    for (let y of k(ak)) {
      if (y?.type === "error") { yield { type: "error", value: eP + `key '${ak}' ${y.value}` }; continue }
      yield y
    }
  }, function*(_: unknown) {
    for (let y of v(av)) {
      if (y?.type === "error") { yield { type: "error", value: eP + `value at key '${ak}' ${y.value}` }; continue }
      yield y
    }
  }])))(undefined)) {
    if (!y) { yield y; continue }
    if (y.type === "ok") { yield { type: "ok", value: a as Record<_K, _T> }; continue }
    yield y
  }
}

const record = recordImpl as unknown as RecordR



// ----------------------------------------------------------------------------------------------------

type Array = 
  <P extends UnknownParser>
  (element: P) =>
    ParserAsserted<Parsed<P>[], unknown extends Parsee<P> ? unknown : Parsee<P>[]>

type ArrayImpl = 
  (p: Parser<_T>) => Parser<unknown[] & Record<number, _T>>

const arrayImpl: ArrayImpl = p => then(
  function*(a: unknown) {
    let eP: string = hasTypeName(this) ? `is not of type '${this.typeName}' as it ` : ""
    if (!Array.isArray(a)) {
      yield { type: "error", value: eP + "is not an array" }
      return
    }
    yield { type: "ok", value: a as unknown[] };
  },
  record(unknown as unknown as Parser<number>, p)
)

const array = arrayImpl as Array


// ----------------------------------------------------------------------------------------------------

type Type =
  <T extends keyof Types>
  (t: T) =>
    Parser<Types[T]>

type Types =
  { string: string
  , number: number
  , boolean: boolean
  , symbol: symbol
  , bigint: bigint
  }

type TypeImpl =
  (t: keyof Types) =>
    Parser<Types[keyof Types]>

const typeImpl: TypeImpl = t => function* (a) {
  let eP = hasTypeName(this) ? `is not of type '${this.typeName}' as it ` : ""
  if (typeof a !== t) { yield { type: "error", value: eP + `is not ${t}` }; return }
  yield { type: "ok", value: a as Types[keyof Types] }
}

const type = typeImpl as unknown as Type

const string = type("string")
const number = type("number")
const boolean = type("boolean")
const symbol = type("symbol")
const bigint = type("bigint")



// ----------------------------------------------------------------------------------------------------

type Value = 
  <E extends string | number | boolean | bigint | symbol | undefined | null>
    (e: E) =>
      Parser<E>

const value = (e => function* (a) {
  let eP = hasTypeName(this) ? `is not of type '${this.typeName}' as it ` : ""
  let s = e === undefined ? "undefined" : e === null ? "null" : e.toString()

  if (a !== e) { yield { type: "error", value: eP + `as it is not ${s}` }; return }
  yield { type: "ok", value: a }
}) as Value

const undefined_ = value(undefined)
const null_ = value(null)


// ----------------------------------------------------------------------------------------------------

const unknown: UnknownParser =
  function* (a: unknown) { yield { type: "ok", value: a } }



// ----------------------------------------------------------------------------------------------------

type Predicate = 
  <T extends A, A>
  (isT: (t: A) => t is T) =>
    Parser<T, A>

type PredicateImpl =
  (isT: (t: _A) => t is _A & _T) =>
    Parser<_A & _T, _A>

const predicateImpl: PredicateImpl = isT => function* (a) {
  if (isT(a)) { yield { type: "ok", value: a }; return }
  yield { type: "error", value: `is not of type '${hasTypeName(this) ? this.typeName : "<unnamed>"}'` }
}

const predicate = predicateImpl as unknown as Predicate



// ----------------------------------------------------------------------------------------------------

type Then = 
  < T extends UnknownParser
  , U extends Parser<any, ParseeConstraint<T>>
  >
  (t: T, u: U) =>
    // TODO: perhaps we don't need the `Parsed<T> &` part?
    ParserAsserted<Parsed<T> & Parsed<U>, Parsee<T>>

type ThenImpl =
  (t: Parser<_A & _T, _A>, u: Parser<_A & _T & _U, _A & _T>) => Parser<_A & _T & _U, _A>

const thenImpl: ThenImpl = (t, u) => function* (a) {
  let isT = true
  for (let y of t.bind(this)(a)) {
    if (!y) continue;
    if (y.type === "error") { isT = false; yield y; continue }
    if (y.type === "ok") continue
    if (y.type === "innerOk") { yield y; continue }
    assertNever(y)
  }
  if (!isT) return
  yield* u.bind(this)(a as _A & _T)
}

const then = thenImpl as unknown as Then



// ----------------------------------------------------------------------------------------------------

const name_ = <T extends UnknownParser>(typeName: string, parser: T) =>
  Object.assign(parser.bind({ typeName }), { typeName }) as T

const hasTypeName = (x: unknown): x is { typeName: string } => 
  x !== undefined && x !== null && typeof (x as { typeName?: unknown }).typeName === "string"



// ----------------------------------------------------------------------------------------------------

type Is =
  <T, P extends Parser<T, T>>
  (value: T, parser: P) =>
    value is Parsed<P>

const is = ((v, p) => {
  for (let r of p(v)) {
    if (r?.type === "error") return false
    if (r?.type === "ok") return true
  }
}) as Is



// ----------------------------------------------------------------------------------------------------

type AccumulateErrors = 
  <P extends UnknownParser>(p: P) => P

type AccumulateErrorsImpl =
  (p: UnknownParser) => UnknownParser

const accumulateErrorsImpl: AccumulateErrorsImpl = p => function* (a) {
  type Node = {
    value: string,
    children: Node[],
    readonly parent: Node | undefined
  }

  let root: Node = { value: "", children: [], parent: undefined }
  let cursor: Node | undefined = undefined

  for (let y of p(a)) {
    if (y?.type !== "error") { yield y; continue }
    while (true) {
      let newErrorText = y.value
      if (!cursor) {
        let newCursor = {
          value: newErrorText,
          children: [],
          parent: root
        }
        root.children.push(newCursor)
        cursor = newCursor
        yield renderError()
        break
      }
      let cursorText = text(cursor)
      let cursorPrefix = subtractRight(cursorText, cursor.value)

      if (newErrorText.startsWith(cursorPrefix)) {
        let newErrorValue = subtractLeft(newErrorText, cursorPrefix)
        let newPrefix = common(cursor.value, newErrorValue)
        if (newPrefix === "'") newPrefix = ""

        if (newPrefix === "") {
          let cursorSibling: Node = {
            value: newErrorValue,
            children: [],
            parent: cursor.parent
          }
          cursor.parent!.children.push(cursorSibling)
          cursor = cursorSibling
          yield renderError()
          break
        }

        let newCursor: Node = {
          value: newPrefix,
          children: [{
            value: subtractLeft(cursor.value, newPrefix),
            children: cursor.children,
            get parent() { return newCursor }
          }, {
            value: subtractLeft(newErrorValue, newPrefix),
            children: [],
            get parent() { return newCursor }
          }],
          parent: cursor.parent
        }
        cursor.parent!.children.splice(-1, 1, newCursor)
        cursor = newCursor.children[1]!
        yield renderError()
        break
      }
      cursor = cursor.parent!
      continue
    }
  }

  function text(node: Node): string {
    return (node.parent ? text(node.parent) : "") + node.value
  }
  function subtractRight(a: string, b: string) {
    return a.slice(0, a.length - b.length)
  }
  function subtractLeft(a: string, b: string) {
    return a.slice(b.length)
  }
  function common(a: string, b: string): string {
    if (a.length > b.length) return common(b, a)
    while (true) {
      if (b.startsWith(a)) {
        if (a.lastIndexOf(" ") === -1) return a
        return a.slice(0, a.lastIndexOf(" ") + 1)
      }
      a = a.slice(0, -1)
    }
  }
  function renderError() {
    return { type: "error" as "error", value: render(root!) }
  }
  function render(node: Node): string {
    if (node === root) return node.children.map(render).join("\n")
    if (node.children.length === 0) return node.value.trimEnd()
    return node.value.trimEnd() + "\n" + node.children.map(n => indent("  ", render(n))).join("\n")
  }
  function indent(i: string, a: string) {
    return a.split("\n").map(a => i + a).join("\n")
  }
}

const accumulateErrors = accumulateErrorsImpl as unknown as AccumulateErrors



// ----------------------------------------------------------------------------------------------------

const bindLazy =
  (f => function(a) { return f().bind(this)(a) }) as <T extends UnknownParser>(f: () => T) => T

// ----------------------------------------------------------------------------------------------------

const ordinal = (zeroBase: number) => {
  let cardinal = zeroBase + 1
  let lastDigit = Number(cardinal.toFixed(0).slice(-1)[0])
  return `${cardinal}${lastDigit === 1 ? "st" : lastDigit === 2 ? "nd" : lastDigit === 3 ? "rd" : "th"}`
}

const assertNever =
  (() => {}) as (x?: never) => never

type Test<T extends true> =
  T

type AreEqual<A, B> =
  (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
    ? true
    : false
