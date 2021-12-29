declare const p: 
  <T, A extends P<T, A>>
    (...a: A) =>
      (t: T) => t is
        A extends [...infer Os, infer Cor, infer Cnd]
          ? T & Constraint<Os, Cor, Cnd>
          : never

type P<T, A> = 
  [ ...(
      A extends { 0: Operator<T> }
        ? A extends [infer Ah, ...infer At]
            ? | ( A extends { 1: Comparator<Operate<T, Ah>> }
                    ? A extends { 1: infer Self1 }
                        ? [Ah & string, Self1 & string, Comparand<Operate<T, Ah>, Self1>]
                        : never
                    : [Ah & string, Comparator<Operate<T, Ah>>]
                )
              | [Ah & string, ...P<Operate<T, Ah>, At>]
            : never
        : [Operator<T>]
    )
  ]

declare const ps: 
  <T, A extends Ps<T, A>>
    (...a: A) =>
      (t: T) => t is
        A extends [infer OsCor, infer Cnd]
          ? S.Split<OsCor, " "> extends [...infer Os, infer Cor]
              ? T & Constraint<Os, Cor, Cnd>
              : never
          : never

type Ps<T, A> = 
  [...(
    A extends [`${Operator<T>} ${string}`, unknown?]
      ? A extends [`${infer Oh} ${infer Ot}`, unknown?]
          ? | ( A extends [`${Oh} ${Comparator<Operate<T, Oh>>}`, unknown?]
                  ? A extends [`${Oh} ${infer Cor}`, unknown?]
                      ? [`${Oh} ${Cor}`, Comparand<Operate<T, Oh>, Cor>]
                      : never
                  : [`${Oh} ${Comparator<Operate<T, Oh>>}`]
              )
            | PsR<Oh, Ps<Operate<T, Oh>, [Ot]>>
          : never
      : [`${Operator<T>} `]
  )]

type PsR<Oh extends string, R extends unknown[]> =
  R extends unknown
    ? R["length"] extends 1 ? [`${Oh} ${R[0] & string}`] :
      R["length"] extends 2 ? [`${Oh} ${R[0] & string}`, R[1]] :
      never
    : never

declare const test:
  <T, U extends T>(t: T, p: (t: T) => t is U) => t is U

declare let x: { a: { c: number }, x: number } | { b: number } | number

if (test(x, ps(".a ?.c typeof ===", "number"))) {
  x
}

type Operator<T> =
  | ( A.Path<T> extends infer P
        ? U.Exclude<S.Replace<`.${L.Join<P, ".">}`, ".?", "?.">, ".">
        : never
    )
  | "typeof"

type Operate<T, O> = 
  T extends unknown
    ? O extends `${"?" | ""}.${string}`
        ? A.Get<T, S.Split<S.Replace<S.ReplaceLeading<O, "." | "?.", "">, "?.", ".">, ".">, undefined> :
      O extends "typeof"
        ? T extends string ? "string" :
          T extends number ? "number" :
          T extends bigint ? "bigint" :
          T extends boolean ? "boolean" :
          T extends symbol ? "symbol" :
          T extends undefined ? "undefined" :
          T extends null ? "object" :
          T extends object ? "object" :
          never :
      never
    : never

type Comparator<T> = _Comparator<T>
type _Comparator<T, T_ = T> =
  | "==="

type Comparand<T, C> =
  T extends unknown
    ? C extends "===" ? T :
      C extends "typeof" ? 
        | "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined"
        | "object" | "function" :
      never
    : never
  
type Constraint<Os, Cor, Cnd> = 
  Cor extends "==="
    ? Os extends [infer Oh, ...infer Ot]
        ? Oh extends `${"?" | ""}.${string}`
            ? A.Pattern<S.Split<S.Replace<S.ReplaceLeading<Oh, "." | "?.", "">, "?.", ".">, ".">,
                Ot extends [] ? Cnd : Constraint<Ot, Cor, Cnd>
              > :
          Oh extends "typeof"
            ? Cnd extends "string" ? string :
              Cnd extends "number" ? number :
              Cnd extends "bigint" ? bigint :
              Cnd extends "boolean" ? boolean :
              Cnd extends "symbol" ? symbol :
              Cnd extends "undefined" ? undefined :
              Cnd extends "null" ? object :
              Cnd extends "object" ? object :
              never :
          never
        : never
    : never

// ======================================================================
// Extras

namespace L {
  export type Join<L, D> =
    L extends [] ? "" :
    L extends [infer Lh] ? A.Cast<Lh, A.Templateable> :
    L extends [infer Lh, ...infer Lt]
      ? `${A.Cast<Lh, A.Templateable>}${A.Cast<D, A.Templateable>}${L.Join<Lt, D>}` :
    never

  export type Pop<L> =
    L extends [] ? [] :
    L extends [...infer X, unknown] ? X :
    never
}

namespace S {
  export type Split<S, D> =
    S extends "" ? [] :
    S extends `${infer Sh}${A.Cast<D, A.Templateable>}${infer St}`
      ? [Sh, ...Split<St, D>] :
    [S]

  export type Replace<S, X, W> =
    S extends X ? W :
    S extends `${A.Cast<X, A.Templateable>}${infer T}`
      ? L.Join<[W, Replace<T, X, W>], ""> :
    S extends `${infer H}${infer T}`
      ? L.Join<[H, Replace<T, X, W>], ""> :
    S

  export type ReplaceLeading<S, X, W> =
    S extends X ? W :
    S extends (X extends unknown ? `${A.Cast<X, A.Templateable>}${infer T}` : never)
      ? `${A.Cast<W, A.Templateable>}${T}` :
    S

  export type Unshift<S> =
    S extends `${infer H}${infer T}`
      ? T
      : ""

  export type InferLiteral<S> =
    S extends string ? S : string
}

namespace B {
  export type Not<T> =
    T extends true ? false : true
}

namespace A {
  export type Path<T> = _Path<T>
  export type _Path<T, T_ = T> =
    T extends unknown ?
      T extends A.Primitive ? [] :
      keyof T extends never ? [] :
      | []
      | ( keyof T extends infer K
            ? K extends unknown
                ? _Path<T_ extends unknown ? A.Get<T_, K> : never> extends infer P
                    ? P extends unknown
                        ? [ K extends keyof T_ ? K :
                            [T_] extends [{}] ? K :
                            `?${A.Cast<K, A.Templateable>}`
                          , ...A.Cast<P, unknown[]>
                          ]
                        : never
                    : never
                : never
            : never
        )
    : never

  A.test(A.areEqual<
    A.Path<
    | { a: {}, c: { x: {}, y: {} } }
    | { a: {}, c: { x: {}, z: {} } }
    >
  , [] | ["a"] | ["c"] | ["c", "x"] | ["c", "y"] | ["c", "z"]
  >())

  A.test(A.areEqual<
    A.Path<
    | { a: {}, b: {} }
    | { a: {}, c: { x: {}, y: {} } }
    | { a: {}, c: { x: {}, z: {} } }
    >
  , [] | ["a"] | ["b"] | ["c"] | ["c", "?x"] | ["c", "?y"] | ["c", "?z"]
  >())

  A.test(A.areEqual<
    A.Path<{ a: {} } | undefined>
  , [] | ["?a"]
  >())

  A.test(A.areEqual<
    A.Path<{ a: {} } | {}>
  , [] | ["a"]
  >())

  export type Pattern<P, V> =
    P extends [] ? V :
    P extends [infer Ph, ...infer Pt]
      ? { [_ in A.Cast<Ph, keyof any>]: Pattern<Pt, V> } :
    never

  export type Get<T, P, F = undefined> =
    B.Not<A.DoesExtend<P, unknown[]>> extends true ? Get<T, [P]> :
    P extends [] ? T :
    P extends [infer Ph] ? Ph extends keyof T ? T[Ph] : F :
    P extends [infer Ph, ...infer Pr] ? Get<Get<T, [Ph], never>, Pr, F> :
    never

  export type InferStringLiteralTuple<T> =
    T extends string[] ? T : string[]

  export type DoesExtend<A, B> =
    A extends B ? true : false

  export type Cast<T, U> =
    T extends U ? T : U

  export type Templateable = 
    | string 
    | number 
    | boolean
    | null
    | undefined

  export type Primitive =
    | string
    | number
    | boolean
    | null
    | undefined

  export type AreEqual<A, B> =
    (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
      ? true
      : false;

  export const test = (_o: true) => {};
  export const areEqual =
    <A, B>(_debug?: (value: A) => void) =>
      undefined as unknown as A.AreEqual<A, B>
}

namespace U {
  export type Exclude<T, U> = 
    T extends U ? never : T

  export type Extract<T, U> = 
    T extends U ? T : never
}