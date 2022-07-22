export { P, Pa }

import * as N from "@sthir/number"

// ----------
// P

type P = 
  <T, A extends PArgs<T, A>>
    (...a: PArgsNarrowed<A>) =>
      (t: T) => t is
        ( A extends [] ? ["!==", A.Falsy] :
          A extends [infer Os] ? [`${Os & string} !==`, A.Falsy] :
          A
        ) extends [infer OsCor, infer Cnd]
          ? S.Split<OsCor, " "> extends [...infer Os, infer Cor]
              ? I.Intersect<
                  T,
                  Constraint<NormaliseOperations<Os>, Cor, Cnd>
                >
              : never
          : never

type PArgs<T, Self> =
  [...(
    Self extends [`${Operator<T>} ${string}`, unknown?]
      ? Self extends [`${infer O} ${infer R}`, unknown?]
          ? PArgsR<O, PArgs<Operate<T, O>, [R]>>
          : never :
    Self extends [Comparator<T>, unknown?]
      ? Self extends [infer C, unknown?]
          ? [C & string, Comparand<T, C>]
          : never :
    | []
    | [Operator<T>]
    | [Comparator<T>]
  )]

type PArgsNarrowed<T> =
  { [I in keyof T]:
      [I, T] extends [1, [`${string} &`, number]] ? number : T[I]
  }

type PArgsR<O extends string, T extends unknown[]> =
  T extends unknown
    ? T["length"] extends 0 ? [`${O}`] :
      T["length"] extends 1 ? [`${O} ${T[0] & string}`] :
      T["length"] extends 2 ? [`${O} ${T[0] & string}`, T[1]] :
      never
    : never

type Operator<T> =
  | IndexFromPath<
      U.HasConstituentsMoreThan<T extends unknown ? keyof T : never, 10> extends true
        ? A.PathShallow<T>
        : A.Path<T>
    >
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

type NormaliseOperations<Os> =
  Os extends [] ? [] :
  Os extends [infer O]
    ? O extends `${"?" | ""}.${string}`
        ? [...S.SplitBefore<O, "?.">]
        : [O] :
  Os extends [infer Oh, ...infer Ot]
    ? [...NormaliseOperations<[Oh]>, ...NormaliseOperations<Ot>] : 
  never

type Comparator<T> =
  | "==="
  | "!=="
  | (T extends number ? "&" : never)

type Comparand<T, C> =
  T extends unknown
    ? C extends "===" ? T :
      C extends "!==" ? T :
      C extends "&" ? number :
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
    ? I.Not<Constraint<Os, "===", Cnd>> :
  Cor extends "&"
    ? I.Not<Constraint<Os, "===", I.BitwiseAndZero<A.Cast<Cnd, number>>>> :
  never


namespace I {
  declare const $$not: unique symbol
  export type Not<T> = { [$$not]: T }

  declare const $$bitwiseAndZero: unique symbol  
  export type BitwiseAndZero<T extends number> = { [$$bitwiseAndZero]: T }

  export type Intersect<A, B> = 
    B extends Not<infer B>
      ? [B] extends [BitwiseAndZero<infer B>]
          ? IntersectWithNotBitwiseAndZero<A, B>
          : IntersectWithNot<A, B> :
    A & B

  type IntersectWithNot<A, NotB, A_ = A> =
    A extends object
      ? A.Get<U.ToIntersection<
          NotB extends unknown
            ? [ object extends NotB ? never :
                NotB extends object
                  ? O.Normalize<
                      & A
                      & O.Normalize<{
                          [K in keyof NotB]:
                            Intersect<
                              A_ extends unknown ? A.Get<A_, K> : never,
                              I.Not<NotB[K]>
                            >
                        }>
                    >
                  : A
              ]
            : never
        >, 0>
      : A extends NotB
          ? never
          : A

  type Test0 = A.Test<A.AreEqual<
    Intersect<"A" | "B" | "C", Not<"A" | "B">>,
    "C"
  >>

  type Test1 = A.Test<A.AreEqual<
    Intersect<{ x: "A" } | "B" | "C", Not<{ x: "A" } | "B">>,
    "C"
  >>

  type Test2 = A.Test<A.AreEqual<
    Intersect<{ a: string | undefined } | { b: string }, Not<{ a: undefined }>>,
    | ({ a: string | undefined } & { a: string })
    | ({ b: string } & { a: string })
  >>

  type Test3 = A.Test<A.AreEqual<
    Intersect<
      { x: "A" } | { y: "X" | "Z" } | "B" | "C"
    , Not<{ x: "A" } | { y: "X" } | "B">
    >,
    | ({ y: "X" | "Z" } & { x: undefined } & { y: "Z" | undefined })
    | "C"
  >>

  type Test4 = A.Test<A.AreEqual<
    Intersect<{ x: "A" | "Z" } | "B" | "C", Not<{ x: "A" } | "B">>,
    | ({ x: "A" | "Z" } & { x: "Z" | undefined })
    | "C"
  >>

  type Test5 = A.Test<A.AreEqual<
    Intersect<
      | { x: "A"
        , y: { x: "B" | "Z" }
        }
      | { z: "T" | "U" }
      | "B"
      | "C"
    , Not<
        | { y: { x: "B" } }
        | { z: "T" | "U" }
        | "B"
      >
    >,
    | ( { x: "A"
        , y: { x: "B" | "Z" }
        }
      & { y:
          | ( { x: "B" | "Z" }
            & { x: "Z" | undefined }
            )
          | undefined;
        }
      & { z: undefined }
      )
    | "C"
  >>

  type Test6 = A.Test<A.AreEqual<
    Intersect<{ x: "A" } | string | number, Not<object | number>>,
    string
  >>

  type Test7 = A.Test<A.AreEqual<
    Intersect<{ a?: string }, Not<{ a: A.Falsy }>>,
    { a?: string } & { a: string }
  >>

  type IntersectWithNotBitwiseAndZero<A, B extends number> =
    A extends number
      ? N.E<`${A & number} & ${B}`> extends 0
        ? never
        : A
      : A

  type Test8 = A.Test<A.AreEqual<Intersect<0b01, Not<BitwiseAndZero<0b10>>>, never>>
  type Test9 = A.Test<A.AreEqual<Intersect<0b101, Not<BitwiseAndZero<0b110>>>, 0b101>>
  type Test10 = A.Test<A.AreEqual<Intersect<{ a: 0b01 } | "foo", Not<{ a: BitwiseAndZero<0b10> }>>, "foo">>
}

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
  S.Split<
    S.Replace<
      S.ReplaceLeading<S.ReplaceLeading<S, ".", "">, "?.", "?">,
      "?.", "."
    >,
    "."
  >

namespace L {
  export type Join<L, D> =
    L extends [] ? "" :
    L extends [infer Lh] ? A.Cast<Lh, A.Templateable> :
    L extends [infer Lh, ...infer Lt]
      ? `${A.Cast<Lh, A.Templateable>}${A.Cast<D, A.Templateable>}${L.Join<Lt, D>}` :
    never

  export type Shifted<L> =
    L extends [] ? [] :
    L extends [unknown, ...infer T] ? T :
    never

  export type Reverse<L> =
    L extends [] ? [] :
    L extends [infer H, ...infer T] ? [...Reverse<T>, H] :
    never
}

namespace S {
  export type Split<S, D> =
    S extends "" ? [] :
    S extends `${infer Sh}${A.Cast<D, A.Templateable>}${infer St}`
      ? [Sh, ...Split<St, D>] :
    [S]

  export type SplitBefore<S, D> = 
    S extends "" ? [] :
    S extends `${infer Sh}${A.Cast<D, A.Templateable>}${infer St}`
      ? S extends `${Sh}${infer Dh}${St}`
          ? [ ...(Sh extends "" ? [] : [Sh])
            , ...(
                Split<St, D> extends infer X
                  ? X extends [] ? [] :
                    X extends [infer H, ...infer T]
                      ? [`${Dh}${A.Cast<H, A.Templateable>}`, ...T]
                      : never
                  : never
              )
            ]
          : never :
    [S]

  type Test0 = A.Test<A.AreEqual<SplitBefore<"a?.b", "?.">, ["a", "?.b"]>>
  type Test1 = A.Test<A.AreEqual<SplitBefore<"?.b", "?.">, ["?.b"]>>

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
  export type _Path<T, Visited = never, T_ = T> =
    T extends unknown ?
      T extends Visited ? [] :
      T extends A.Primitive ? [] :
      keyof T extends never ? [] :
      | []
      | ( keyof T extends infer K
            ? K extends unknown
                ? _Path<T_ extends unknown ? A.Get<T_, K> : never, Visited | T> extends infer P
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

  export type PathShallow<T, Visited = never, T_ = T> =
    T extends unknown ?
      T extends Visited ? [] :
      T extends A.Primitive ? [] :
      keyof T extends never ? [] :
      | []
      | ( keyof T extends infer K
            ? K extends unknown
                ? [ K extends keyof T_ ? K :
                    [T_] extends [{}] ? K :
                    `?${A.Cast<K, A.Templateable>}`
                  ]
                : never
            : never
        )
    : never

  type Test0 = A.Test<A.AreEqual<
    A.Path<
    | { a: {}, c: { x: {}, y: {} } }
    | { a: {}, c: { x: {}, z: {} } }
    >,
    [] | ["a"] | ["c"] | ["c", "x"] | ["c", "y"] | ["c", "z"]
  >>

  type Test1 = A.Test<A.AreEqual<
    A.Path<
    | { a: {}, b: {} }
    | { a: {}, c: { x: {}, y: {} } }
    | { a: {}, c: { x: {}, z: {} } }
    >,
    [] | ["a"] | ["b"] | ["c"] | ["c", "?x"] | ["c", "?y"] | ["c", "?z"]
  >>

  type Test2 = A.Test<A.AreEqual<
    A.Path<{ a: {} } | undefined>,
    [] | ["?a"]
  >>

  type Test3 = A.Test<A.AreEqual<
    A.Path<{ a: {} } | {}>,
    [] | ["a"]
  >>

  interface Foo { foo: Foo }
  type Test4 = A.Test<A.AreEqual<
    A.Path<Foo>,
    [] | ["foo"]
  >>


  export type Pattern<P, V> =
    P extends [] ? V :
    P extends [infer Ph, ...infer Pt]
      ? Ph extends `?${infer K}`
          ? { [_ in K]: Pattern<Pt, V> } | null | undefined
          : { [_ in A.Cast<Ph, keyof any>]: Pattern<Pt, V> } :
    never

  export type Falsy = 
    false | undefined | null | 0 | 0n | ""

  export type Get<T, P> =
    B.Not<A.DoesExtend<P, unknown[]>> extends true ? Get<T, [P]> :
    P extends [] ? T :
    P extends [infer Ph] ?
      (Ph extends `?${infer X}` ? X : Ph) extends infer K
        ? K extends keyof T ? T[K] :
          T extends null ? null :
          T extends undefined ? undefined :
          undefined
        : never :
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
    | bigint

  export type Primitive =
    | string
    | number
    | boolean
    | null
    | undefined
    | bigint
    | symbol

  export type AreEqual<A, B> =
    (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
      ? true
      : false;

  export type Test<T extends true> = T
}

namespace U {
  export type Exclude<T, U> = 
    T extends U ? never : T

  export type ToIntersection<T> =
    (T extends unknown ? (_: T) => void : never) extends ((_: infer I) => void)
      ? I
      : never;

  export type Head<U> =
    ToIntersection<U extends unknown ? (x: U) => void : never> extends (_: infer H) => void
      ? H
      : never

  export type Shifted<U> =
    Exclude<U, Head<U>>

  export type IsUnit<U> =
    [Shifted<U>] extends [never] ? true : false

  export type HasConstituentsMoreThan<U, L extends number> =
    [U] extends [never] ? false :
    L extends 0 ? true :
    HasConstituentsMoreThan<Shifted<U>, NDecrement<L>>

  type Test0 = A.Test<A.AreEqual<
    HasConstituentsMoreThan<"a" | "b" | "c", 2>,
    true
  >>

  type NDecrement<N extends number> =
    [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14][N]
}

namespace B {
  export type Not<T> = 
    T extends true ? false : true
}

namespace O {
  export type Normalize<T> =
    {} extends T ? unknown :
    T[keyof T] extends never ? never :
    T
}
 