// TODO:
// - rewrite `accumulateErrors`
// - (maybe) cachify iterables
// - (maybe) functionalify some parts around iterables
// - tests
// - ok and innerOk with score

export {
  Parser,

  name_ as name,
  N,
  is,
  assert,

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

  bindLazy,
  UnknownParser,
  Parsed,
  Parsee,
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

type ParserThis = 
  | undefined
  | { typeName?: string }

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

type ParsedWrapped<P extends UnknownParser> =
  P extends Parser<infer T, never> ? [T] : never

type Parsee<P extends UnknownParser> =
  P extends Parser<any, infer A> ? A : never

type ParseeWrapped<P extends UnknownParser> =
  P extends Parser<any, infer A> ? [A] : never

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
  { <Ps extends UnknownParser[]>
    (contituents: [...Ps]):
    Intersect<Ps>
  , <Ps extends Iterable<UnknownParser>>
    (contituents: Ps):
      IntersectIterable<Ps>
  }

type Intersect<Ps extends UnknownParser[]> =
  { [I in keyof Ps]: [Parsed<Ps[I]>] }[number] extends infer T ?
  { [I in keyof Ps]: [Parsee<Ps[I]>] }[number] extends infer A ?
  Parser<WrappedUnionToIntersection<T>, WrappedUnionToIntersection<A>> : never : never

type IntersectIterable<Ps extends Iterable<UnknownParser>> =
  Ps extends Iterable<infer P extends UnknownParser>
    ? ParserAsserted<
        WrappedUnionToIntersection<ParsedWrapped<P>>,
        WrappedUnionToIntersection<ParseeWrapped<P>>
      >
    : never

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
  (ps: Iterable<Parser<_T>>) => Parser<_T, unknown>

let intersectImpl: IntersectImpl = ps => {
  if (Array.isArray(ps)) {
    ps = ps.filter(p => p !== unknown)
    if ((ps as Parser<_T>[]).length === 1) return (ps as Parser<_T>[])[0]!
  }
  return function*(a) {
    let gs = [] as ReturnType<Parser<_T>>[]
    let psLength = Infinity
    let irs = [] as number[]

    let everyOk = true
    while (psLength > irs.length) {
      let i = -1
      for (let p of ps) { i++
        if (irs.includes(i)) continue
        let g = gs[i] ?? (gs[i] = p(a))
        let y = g.next().value
        if (!y) { irs.push(i); continue }
        if (y.type === "error") { yield { type: "error", value: y.value }; everyOk = false; continue }
        if (y.type === "innerOk") { yield y; continue }
        if (y.type === "ok") { yield { type: "innerOk" }; continue }
        assertNever(y)
      }
      psLength = i + 1
    }
    if (everyOk) yield { type: "ok", value: a as _T }
  }
}

const intersect = intersectImpl as unknown as IntersectR



// ----------------------------------------------------------------------------------------------------

type UnionR =
  { <Ps extends UnknownParser[]>
    (constituents: [...Ps]):
    Union<Ps>
  , <Ps extends Iterable<UnknownParser>>
    (constituents: Ps):
      UnionIterable<Ps>
  }

type Union<Ps extends UnknownParser[]> =
  WrappedUnionToIntersection<{ [I in keyof Ps]: [Parsee<Ps[I]>] }[number]> extends infer A
    ? ParserAsserted<{ [I in keyof Ps]: Parsed<Ps[I]> }[number], A>
    : never

type UnionIterable<Ps extends Iterable<UnknownParser>> =
  Ps extends Iterable<infer P extends UnknownParser>
    ? ParserAsserted<
        WrappedUnionToIntersection<ParsedWrapped<P>>,
        WrappedUnionToIntersection<ParseeWrapped<P>>
      >
    : never
      
type ParserAsserted<T, A> =
  [T] extends [A] ? Parser<T, A> : Parser<T & A, A>

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
  (ps: Iterable<Parser<_T>>) => Parser<_T>

let unionImpl: UnionImpl = ps => function*(a) {
  let eP = `is not of type '${(this as ParserThis)?.typeName ?? "<unnamed>"}' as it `
  let gs = [] as ReturnType<Parser<_T>>[]
  let bestI = undefined as number | undefined
  let someOk = false
  let ss = [] as number[]
  let yss = [] as ParserYield<_T>[][]
  let irs = [] as number[]
  let psLength = Infinity

  root: while (psLength > irs.length) {
    let i = -1
    for (let p of ps) { i++
      if (irs.includes(i)) continue;
      let g = gs[i] ?? (g => (gs[i] = g, ss[i] = 0, yss[i] = [], g))(p(a))
      let y = g.next().value
      yss[i]!.push(y)
      if (!y) { irs.push(i); continue }
      if (y.type === "error") { irs.push(i); continue }
      if (y.type === "innerOk") { ss[i]++; continue }
      if (y.type === "ok") { bestI = i; someOk = true; break root }
      assertNever(y)
    }
    psLength = i + 1
  }

  let bestP = undefined as Parser<_T> | undefined
  if (bestI === undefined) {
    let i = -1
    for (let p of ps) { i++
      if (ss[i]! > (bestI !== undefined ? ss[bestI]! : -1)) {
        bestI = i
        bestP = p
      }
    }
  }
  let bestYs = yss[bestI!]!
  if (someOk) {
    yield* bestYs
    if (bestYs[bestYs.length - 1] !== undefined) {
      yield* gs[bestI!]!
    }
  } else {
    eP += `did not match any contituents, best match was '${bestP!.typeName ?? "<unnamed>"}' but`
    yield* bestYs.map((y): ParserYield<_T> => {
      if (y?.type === "error") {
        return {
          type: "error",
          value: eP + y.value.replace(/is not of type '[^']+' as/, "")
        }
      }
      return y
    })
    if (bestYs.slice(-1)[0] !== undefined) {
      for (let y of gs[bestI!]!) {
        if (y?.type === "error") {
          yield { type: "error", value: eP + y.value.replace(/is not of type '[^']+' as/, "") };
          continue
        }
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
  { [K in keyof T]: T[K] } & unknown

type CleanStructure<T> =
  IsStructureReducibleToUnknown<T> extends true
    ? unknown
    : T extends unknown[] ? T : { [K in keyof T as unknown extends T[K] ? never : K]: T[K] }

type IsStructureReducibleToUnknown<T> = 
  { [K in keyof T]-?:
      unknown extends T[K & keyof T] ? true : K
  }[keyof T & (T extends unknown[] ? number : unknown)] extends true ? true : false

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

type Test300 =
  Test<AreEqual<
    ObjectT<{ a: Parser<"a">, "b?": Parser<"b", string>, "c\\?": Parser<"c"> }>,
    Parser<
      { a: "a", b?: "b", "c?": "c" },
      { b?: string }
    >
  >>

type ObjectImpl = 
  (ps: Record<string, Parser<_T>>) => Parser<Record<string, _T>>

const objectImpl: ObjectImpl = ps => function*(a) {
  let eP = `is not of type '${(this as ParserThis)?.typeName ?? "<unnamed>"}' as it `

  if (typeof a !== "object" || a === null) {
    yield { type: "error", value: eP + "is not an object" }
    return
  }
  for (let k in ps) {
    if (k.endsWith("?") && !k.endsWith("\\?")) continue
    if (!(k in a)) {
      yield { type: "error", value: eP + `is missing key '${k.replace(/\\\?$/, "?")}'` }
    }
  }
  
  eP = eP.slice(0, "it ".length * -1) + "it's "
  for (let y of intersect({
    [Symbol.iterator]: function*() {
      for (let k in a) {
        let p = ps[k] ?? ps[k + "?"]
        if (!p) continue
        yield function*(_: undefined) {
          let v = a[k as keyof typeof a] as _T
          for (let y of p!(v)) {
            if (y?.type === "error") { yield { type: "error" as "error", value: eP + `value at key '${k}' ${y.value}` }; continue }
            yield y
          }
        }
      }
    }
  })(undefined)) {
    if (y?.type === "ok") { yield { type: "ok", value: a as Record<string, _T> }; continue }
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

type Test397 =
  Test<AreEqual<
    TupleT<[Parser<"a">, Parser<"b", string | number>, [Parser<"c">, "?"]]>,
    Parser<["a", "b", "c"?], [unknown, string | number, unknown?]>
    // TODO: perhaps make the parsee `{ 1: string | number }`? Should the above parsee
    // have the same change?
  >>

type TupleImpl = 
  (ps: (Parser<_T> | [Parser<_T>, "?"])[]) => Parser<unknown[] & Record<string, _T>>

const tupleImpl: TupleImpl = ps => function*(a: unknown) {
    let eP: string = `is not of type '${(this as ParserThis)?.typeName ?? "<unnamed>"}' as it `
    if (!Array.isArray(a)) {
      yield { type: "error", value: eP + "is not an array" }
      return
    }
  let minLength = ps.filter(p => !Array.isArray(p)).length
  let maxLength = ps.length
  if (a.length < minLength) {
    yield { type: "error", value: eP + "has missing indices" }
    return
  }
  if (a.length > maxLength) {
    yield { type: "error", value: eP + "has extra indices" }
    return
  }

  eP = eP.slice(0, "it ".length * -1) + "it's "
  for (let y of intersect({
    [Symbol.iterator]: function*(){
      for (let i of a) {
        let p = (x => Array.isArray(x) ? x[0] : x)(ps[i])
        if (!p) continue
        yield function*(_: undefined) {
          let v = a[i as keyof typeof a] as _T
          for (let y of p!(v)) {
            if (y?.type === "error") { yield { type: "error" as "error", value: eP + `value at key '${i}' ${y.value}` }; continue }
            yield y
          }
        }
      }
    }
  })(undefined)) {
    if (!y) { yield y; continue }
    if (y.type === "ok") { yield { type: "ok", value: a as unknown[] & Record<string, _T> }; continue }
    yield y
  }
}

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

const recordImpl: RecordImpl = (k, v) => function*(a) {
  let eP = `is not of type '${(this as ParserThis)?.typeName ?? "<unnamed>"}' as it `

  if (typeof a !== "object" || a === null) {
    yield { type: "error", value: eP + "is not an object" }
    return
  }

  eP = eP.slice(0, "it ".length * -1) + "it's "
  for (let y of intersect({
    [Symbol.iterator]: function*() {
      for (let ak in a) {
        let av = a[ak as keyof typeof a] as _T
        yield intersect([
          k === unknown || k === string ? unknown : function*(_: undefined) {
            for (let y of k(ak)) {
              if (y?.type === "error") { yield { type: "error", value: eP + `key '${ak}' ${y.value}` }; continue }
              yield y
            }
          },
          function*(_: undefined) {
            for (let y of v(av)) {
              if (y?.type === "error") { yield { type: "error", value: eP + `value at key '${ak}' ${y.value}` }; continue }
              yield y
            }
          }
        ])
      }
    }
  })(undefined)) {
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
    let eP: string = `is not of type '${(this as ParserThis)?.typeName ?? "<unnamed>"}' as it `
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

const typeImpl: TypeImpl = t => function*(a) {
  let eP =
    (this as ParserThis)?.typeName !== undefined
      ? `is not of type '${(this as ParserThis)?.typeName!}' as it `
      : ""

  if (typeof a !== t) { yield { type: "error", value: eP + `is not of type '${t}'` }; return }
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

const value = (e => function*(a) {
  let eP =
    (this as ParserThis)?.typeName !== undefined
      ? `is not of type '${(this as ParserThis)?.typeName!}' as it `
      : ""
  let s = e === undefined ? "undefined" : e === null ? "null" : e.toString()

  if (a !== e) { yield { type: "error", value: eP + `is not of type '${s}'` }; return }
  yield { type: "ok", value: a }
}) as Value

const undefined_ = value(undefined)
const null_ = value(null)


// ----------------------------------------------------------------------------------------------------

const unknown: UnknownParser =
  function*(a: unknown) { yield { type: "ok", value: a } }



// ----------------------------------------------------------------------------------------------------

type Predicate = 
  <T extends A, A>
  (isT: ((t: A) => t is T) | ((t: A) => boolean)) =>
    Parser<T, A>

type PredicateImpl =
  (isT: (t: _A) => t is _A & _T) =>
    Parser<_A & _T, _A>

const predicateImpl: PredicateImpl = isT => function*(a) {
  if (isT(a)) { yield { type: "ok", value: a }; return }
  yield { type: "error", value: `is not of type '${(this as ParserThis)?.typeName ?? "<unnamed>"}'` }
}

const predicate = predicateImpl as unknown as Predicate



// ----------------------------------------------------------------------------------------------------

type Then = 
  { <A, T extends A, U extends T>
    (t: Parser<T, A>, u: Parser<U, T>):
      Parser<U, A>

  , < T extends UnknownParser
    , U extends Parser<any, Parsed<T>>
    >
    (t: T, u: U):
      // TODO: perhaps we don't need the `Parsed<T> &` part?
      ParserAsserted<Parsed<T> & Parsed<U>, Parsee<T>>
  }

type ThenImpl =
  (t: Parser<_A & _T, _A>, u: Parser<_A & _T & _U, _A & _T>) => Parser<_A & _T & _U, _A>

const thenImpl: ThenImpl = (t, u) => function*(a) {
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

type Name = 
  { <T extends UnknownParser>
      (typeName: string, parser: T): T

  , <T extends UnknownParser, N extends Parsed<T> = Parsed<T>>
      ( typeName: string
      , typescriptTypeName: (i: Parsed<T>) => N
      , parser: T
      ):
        ParserAsserted<N, Parsee<T>>
  }

const name_ = ((typeName: string, ...a: [() => void, UnknownParser] | [UnknownParser]) =>
  Object.assign((a.length === 1 ? a[0] : a[1]).bind({ typeName }), { typeName })) as Name

type N<T> =
  T


// ----------------------------------------------------------------------------------------------------

type Is =
  <T, P extends Parser<T, T>>
  (value: T, parser: P) =>
    value is Parsed<P>

const is = ((v, p) => {
  for (let y of p(v)) {
    if (y?.type === "error") return false
    if (y?.type === "ok") return true
  }
}) as Is



// ----------------------------------------------------------------------------------------------------

type Assert =
  <T, P extends Parser<T, T>>
  (value: T, parser: P) =>
    asserts value is Parsed<P>

const assert: Assert = ((v, p) => {
  for (let y of p(v)) if (y?.type === "error") throw new Error(y.value)
})



// ----------------------------------------------------------------------------------------------------

const bindLazy =
  <P extends UnknownParser>
  (f: () => P) => {
    let p: P | undefined

    return Object.defineProperty(
      function(this: unknown, a: never) {
        if (!p) p = f()
        return p.bind(this)(a)
      },
      "typeName", {
        get: () => {
          if (!p) p = f()
          return p.typeName
        }
      }
    ) as P
  }

// ----------------------------------------------------------------------------------------------------

const assertNever =
  (() => {}) as (x?: never) => never

type Test<T extends true> =
  T

type AreEqual<A, B> =
  (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
    ? true
    : false
