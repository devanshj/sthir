export { P, Ps, Pa }

// ----------
// P

type P = 
  <T, A extends PArgs<T, A>>
    (...a: A) =>
      (t: T) => t is
        A extends [...infer Os, infer Cor, infer Cnd]
          ? A.NotAwareIntersect<T, Constraint<Os, Cor, Cnd>>
          : never

type PArgs<T, A> =
  [ ...(
    A extends { 0: Operator<T> }
      ? A extends [infer Ah, ...infer At]
          ? | ( A extends { 1: Comparator<Operate<T, Ah>> }
                  ? A extends { 1: infer Self1 }
                      ? [Ah & string, Self1 & string, Comparand<Operate<T, Ah>, Self1>]
                      : never
                  : [Ah & string, Comparator<Operate<T, Ah>>]
              )
            | [Ah & string, ...PArgs<Operate<T, Ah>, At>]
          : never
      : [Operator<T>]
  )]


type Operator<T> =
  | IndexFromPath<A.Path<T>>
  | "typeof"

type Operate<T, O> = 
  T extends unknown
    ? O extends `${"?" | ""}.${string}`
        ? A.Get<T, PathFromIndex<O>> :
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

type Comparator<T> =
  | "==="
  | "!=="

type Comparand<T, C> =
  T extends unknown
    ? C extends "===" ? T :
      C extends "!==" ? T : 
      C extends "typeof" ? 
        | "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined"
        | "object" | "function" :
      never
    : never
  
type Constraint<Os, Cor, Cnd> = 
  Cor extends "==="
    ? Os extends [] ? Cnd :
      Os extends [infer Oh, ...infer Ot]
        ? Oh extends `${"?" | ""}.${string}`
            ? A.Pattern<
                PathFromIndex<Oh>,
                Ot extends [] ? Cnd : Constraint<Ot, Cor, Cnd>
              > :
          Oh extends "typeof"
            ? Ot extends []
                ? Cnd extends "string" ? string :
                  Cnd extends "number" ? number :
                  Cnd extends "bigint" ? bigint :
                  Cnd extends "boolean" ? boolean :
                  Cnd extends "symbol" ? symbol :
                  Cnd extends "undefined" ? undefined :
                  Cnd extends "null" ? object :
                  Cnd extends "object" ? object :
                  never
                : unknown :
          never
        : never :
  Cor extends "!=="
    ? A.Not<Constraint<Os, "===", Cnd>> :
  never

// ----------
// Ps

type Ps = 
  <T, A extends PsArgs<T, A>>
    (...a: A) =>
      (t: T) => t is
        A extends [infer OsCor, infer Cnd]
          ? S.Split<OsCor, " "> extends [...infer Os, infer Cor]
              ? A.NotAwareIntersect<T, Constraint<Os, Cor, Cnd>>
              : never
          : never

type PsArgs<T, A> = 
  [...(
    A extends [`${Operator<T>} ${string}`, unknown?]
      ? A extends [`${infer Oh} ${infer Ot}`, unknown?]
          ? | ( A extends [`${Oh} ${Comparator<Operate<T, Oh>>}`, unknown?]
                  ? A extends [`${Oh} ${infer Cor}`, unknown?]
                      ? [`${Oh} ${Cor}`, Comparand<Operate<T, Oh>, Cor>]
                      : never
                  : [`${Oh} ${Comparator<Operate<T, Oh>>}`]
              )
            | PsArgsR<Oh, PsArgs<Operate<T, Oh>, [Ot]>>
          : never
      : [`${Operator<T>} `]
  )]

type PsArgsR<Oh extends string, R extends unknown[]> =
  R extends unknown
    ? R["length"] extends 1 ? [`${Oh} ${R[0] & string}`] :
      R["length"] extends 2 ? [`${Oh} ${R[0] & string}`, R[1]] :
      never
    : never




// ----------
// Pa

type Pa =
  <T, U extends T>
    (t: T, p: (t: T) => t is U) =>
      t is U




// ----------
// extras

type IndexFromPath<P> =
  U.Exclude<S.Replace<`.${L.Join<P, ".">}`, ".?", "?.">, ".">

type PathFromIndex<S> = 
  S.Split<S.Replace<S.ReplaceLeading<S, "." | "?.", "">, "?.", ".">, ".">

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

  declare const $$not: unique symbol
  export type Not<T> = { [$$not]: T }

  export type NotAwareIntersect<A, B> = 
    B extends Not<infer NotB>
      ? A extends object
          ? O.Normalize<U.ToIntersection<
              NotB extends object
                ? { [K in keyof A]:
                      K extends O.Key<NotB>
                        ? NotAwareIntersect<A[K], A.Not<A.Get<NotB, K>>>
                        : A[K]
                  }
                : A
            >>
          : A extends NotB
              ? never
              : A
      : A & B

  A.test(A.areEqual
    < NotAwareIntersect<"A" | "B" | "C", A.Not<"A" | "B">>
    , "C"
    >()
  )

  A.test(A.areEqual
    < NotAwareIntersect<{ x: "A" } | "B" | "C", A.Not<{ x: "A" } | "B">>
    , "C"
    >()
  )

  A.test(A.areEqual
    < NotAwareIntersect<
        { x: "A" } | { y: "X" | "Z" } | "B" | "C"
      , A.Not<{ x: "A" } | { y: "X" } | "B">
      >
    , | ({ y: "X" | "Z" } & { y: "Z" })
      | "C"
    >()
  )

  A.test(A.areEqual
    < NotAwareIntersect<{ x: "A" | "Z" } | "B" | "C", A.Not<{ x: "A" } | "B">>
    , | ({ x: "A" | "Z" } & { x: "Z" })
      | "C"
    >()
  )

  A.test(A.areEqual
    < NotAwareIntersect<
        | { x: "A"
          , y: { x: "B" | "Z" }
          }
        | { z: "T" | "U" }
        | "B"
        | "C"
      , A.Not<
          | { x: "A", y: { x: "B" } }
          | { z: "T" | "U" }
          | "B"
        >
      >
    , | ( { x: "A"
          , y: { x: "B" | "Z" }
          }
        & { x: never
          , y: { x: "Z" }
          }
        )
      | "C"
    >()
  )

  A.test(A.areEqual
    < NotAwareIntersect<{ x: "A" } | string | number,  A.Not<object | number>>
    , string
    >()
  )

  export type Get<T, P> =
    B.Not<A.DoesExtend<P, unknown[]>> extends true ? Get<T, [P]> :
    P extends [] ? T :
    P extends [infer Ph] ?
      object extends T ? unknown :
      Ph extends keyof T ? T[Ph] :
      T extends null ? null :
      T extends undefined ? undefined :
      undefined :
    P extends [infer Ph, ...infer Pr] ? Get<Get<T, [Ph]>, Pr> :
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

  export type ToIntersection<T> =
    (T extends unknown ? (k: T) => void : never) extends ((k: infer I) => void)
      ? I
      : never;
}

namespace B {
  export type Not<T> = 
    T extends true ? false : true
}

namespace O {
  export type Normalize<T> =
    T[keyof T] extends never ? never : T

  export type Key<T> = 
    object extends T ? keyof any : keyof T
}
