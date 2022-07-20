
export type ERuntime =
  < T extends [e: R extends `Error: ${string}` ? R : T[0]]
  , R = E<T[0] & string>
  >
    (...e: T extends [string] ? T : [e: string]) =>
      R extends `Error: ${string}`
        ? number
        : R

export type E<T extends string> =
  string extends T ? number :
  T extends `${infer X}(${infer Y})${infer Z}`
    ? E<Y> extends infer Ey
        ? Ey extends `Error: ${string}` ? Ey : E<`${X}${Ey & number}${Z}`>
        : never :
  T extends `${infer X} & ${infer Y}`
    ? [E<X>, E<Y>] extends [infer Ex, infer Ey]
        ? Ex extends `Error: ${string}` ? Ex :
          Ey extends `Error: ${string}` ? Ey :
          N._And<Ex, Ey> 
        : never :
  T extends `${infer X} | ${infer Y}`
    ? [E<X>, E<Y>] extends [infer Ex, infer Ey]
        ? Ex extends `Error: ${string}` ? Ex :
          Ey extends `Error: ${string}` ? Ey :
          N._Or<Ex, Ey> 
      : never :
  T extends `${infer X} << ${infer Y}`
    ? [E<X>, E<Y>] extends [infer Ex, infer Ey]
        ? Ex extends `Error: ${string}` ? Ex :
          Ey extends `Error: ${string}` ? Ey :
          N._LeftShift<Ex, Ey> 
      : never :
  T extends `0b${infer X}` ? Nb.ToNumber<A.Cast<S.Split<X, "">, Nb.Unknown>> :
  T extends `${infer X extends number}` ? X :
  `Error: Cannot parse expression '${T}'`

type Test0 = A.Test<A.AreEqual<E<"5">, 5>>
type Test1 = A.Test<A.AreEqual<E<"0b10">, 2>>
type Test2 = A.Test<A.AreEqual<E<"0b10 & 0b11">, 0b10>>
type Test3 = A.Test<A.AreEqual<E<`${0b10} & ${0b11}`>, 0b10>>
type Test4 = A.Test<A.AreEqual<E<"0b10 | 0b01">, 0b11>>
type Test5 = A.Test<A.AreEqual<E<`${0b10} | ${0b11}`>, 0b11>>
type Test6 = A.Test<A.AreEqual<E<"0b101 << 0b10">, 0b10100>>
type Test7 = A.Test<A.AreEqual<E<`${0b101} << ${0b10}`>, 0b10100>>
type Test8 = A.Test<A.AreEqual<E<"0b10 | 0b101 << 0b10">, 0b10110>>
type Test9 = A.Test<A.AreEqual<E<"(0b10 | 0b101) << 0b10">, 0b11100>>
type Test10 = A.Test<A.AreEqual<E<`${0b100} | ${0b001 | 0b010}`>, 0b101 | 0b110>>

namespace N {
  export type _And<A, B> =
    Nb._ToNumber<Nb._And<Nb._FromNumber<A>, Nb._FromNumber<B>>>

  export type _Or<A, B> =
    Nb._ToNumber<Nb._Or<Nb._FromNumber<A>, Nb._FromNumber<B>>>

  export type _LeftShift<A, B> =
    Nb._ToNumber<Nb._LeftShift<Nb._FromNumber<A>, Nb._FromNumber<B>>>
}

namespace Nd {
  export type Unknown = ("0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9")[]
  type Digit = Unknown[number]
  type EvenDigit = "0" | "2" | "4" | "6" | "8"
  type OddDigit = U.Exclude<Digit, EvenDigit>
  
  // https://en.wikipedia.org/wiki/Division_by_two#Decimal
  export type DivideByTwoFloor<Dividend extends Unknown, IsFirstCheck = true> =
    IsFirstCheck extends true
      ? DivideByTwoFloor<["0", ...Dividend], false> extends infer R
          ? R extends ["0"] ? R : 
            R extends ["0", ...infer X] ? X :
            R
          : never :
    Dividend extends [] ? [] : 
    [ ...(
        Dividend extends [EvenDigit, "0" | "1", ...Digit[]] ? ["0"] :
        Dividend extends [EvenDigit, "2" | "3", ...Digit[]] ? ["1"] :
        Dividend extends [EvenDigit, "4" | "5", ...Digit[]] ? ["2"] :
        Dividend extends [EvenDigit, "6" | "7", ...Digit[]] ? ["3"] :
        Dividend extends [EvenDigit, "8" | "9", ...Digit[]] ? ["4"] :
        Dividend extends [OddDigit, "0" | "1", ...Digit[]] ? ["5"] :
        Dividend extends [OddDigit, "2" | "3", ...Digit[]] ? ["6"] :
        Dividend extends [OddDigit, "4" | "5", ...Digit[]] ? ["7"] :
        Dividend extends [OddDigit, "6" | "7", ...Digit[]] ? ["8"] :
        Dividend extends [OddDigit, "8" | "9", ...Digit[]] ? ["9"] :
        []
      )
    , ...DivideByTwoFloor<A.Cast<L.Shifted<Dividend>, Unknown>, false>
    ]

  export type DivideByTwo<Dividend extends Unknown> = 
    { quotient: DivideByTwoFloor<Dividend>
    , remainder: Dividend extends [...Digit[], OddDigit] ? ["1"] : ["0"]
    }

  type Test0 = A.Test<A.AreEqual<
    DivideByTwo<["1", "7", "3", "9"]>,
    { quotient: ["8", "6", "9"], remainder: ["1"] }
  >>

  export type MultiplyByTwo<T extends Unknown, AddOne extends boolean = false> =
    T extends [Digit]
      ? T extends ["0"] ? AddOne extends false ? ["0"] : ["1"] :
        T extends ["1"] ? AddOne extends false ? ["2"] : ["3"] :
        T extends ["2"] ? AddOne extends false ? ["4"] : ["5"] :
        T extends ["3"] ? AddOne extends false ? ["6"] : ["7"] :
        T extends ["4"] ? AddOne extends false ? ["8"] : ["9"] :
        T extends ["5"] ? AddOne extends false ? ["1", "0"] : ["1", "1"] :
        T extends ["6"] ? AddOne extends false ? ["1", "2"] : ["1", "3"] :
        T extends ["7"] ? AddOne extends false ? ["1", "4"] : ["1", "5"] :
        T extends ["8"] ? AddOne extends false ? ["1", "6"] : ["1", "7"] :
        T extends ["9"] ? AddOne extends false ? ["1", "8"] : ["1", "9"] :
        never
      : T extends [...infer H extends Digit[], infer T extends Digit]
          ? MultiplyByTwo<[T], AddOne> extends infer R
            ? R extends [infer X] ? [...MultiplyByTwo<H>, X] :
              R extends ["1", infer X] ? [...MultiplyByTwo<H, true>, X] :
              never
            : never
          : never

  export type AddOne<T extends Unknown> =
    T extends [Digit]
      ? T extends ["0"] ? ["1"] :
        T extends ["1"] ? ["2"] :
        T extends ["2"] ? ["3"] :
        T extends ["3"] ? ["4"] :
        T extends ["4"] ? ["5"] :
        T extends ["5"] ? ["6"] :
        T extends ["6"] ? ["7"] :
        T extends ["7"] ? ["8"] :
        T extends ["8"] ? ["9"] :
        T extends ["9"] ? ["1", "0"] :
        never
      : T extends [...infer H extends Digit[], infer T extends Digit]
          ? AddOne<[T]> extends infer R
            ? R extends [infer X] ? [...H, X] :
              R extends ["1", infer X] ? [...AddOne<H>, X] :
              never
            : never
          : never
}

export namespace Nb {
  export type Unknown = ("0" | "1")[]
  type Digit = Unknown[number]

  export type And<A extends Unknown, B extends Unknown> =
    keyof A extends keyof B
      ? _TrimLeadingZeros<AndPadded<PadZerosSameAs<A, B>, B>>
      : And<B, A>

  export type _And<A, B> =
    And<A.Cast<A, Unknown>, A.Cast<B, Unknown>>

  export type AndPadded<A extends Unknown, B extends Unknown> =
    [...A, ...B] extends ["0", "0"] ? ["0"] :
    [...A, ...B] extends ["0", "1"] ? ["0"] :
    [...A, ...B] extends ["1", "0"] ? ["0"] :
    [...A, ...B] extends ["1", "1"] ? ["1"] :
    { [I in keyof B]:
      AndPadded<[A.Cast<B[I], Digit>], [A.Cast<A.Get<A, I>, Digit>]>[0]
    }

  type Test0 = A.Test<A.AreEqual<Nb.And<Nb.FromNumber<0b01>, Nb.FromNumber<0b10>>, ["0"]>>
  type Test1 = A.Test<A.AreEqual<Nb.And<Nb.FromNumber<0b010>, Nb.FromNumber<0b100>>, ["0"]>>
  type Test2 = A.Test<A.AreEqual<Nb.And<Nb.FromNumber<0b101>, Nb.FromNumber<0b110>>, ["1", "0", "0"]>>

  
  export type Or<A extends Unknown, B extends Unknown> =
    keyof A extends keyof B
      ? _TrimLeadingZeros<OrPadded<PadZerosSameAs<A, B>, B>>
      : Or<B, A>

  export type _Or<A, B> =
    Or<A.Cast<A, Unknown>, A.Cast<B, Unknown>>

  export type OrPadded<A extends Unknown, B extends Unknown> =
    [...A, ...B] extends ["0", "0"] ? ["0"] :
    [...A, ...B] extends ["0", "1"] ? ["1"] :
    [...A, ...B] extends ["1", "0"] ? ["1"] :
    [...A, ...B] extends ["1", "1"] ? ["1"] :
    { [I in keyof B]:
      OrPadded<[A.Cast<B[I], Digit>], [A.Cast<A.Get<A, I>, Digit>]>[0]
    }

  type Test3 = A.Test<A.AreEqual<Nb.Or<Nb.FromNumber<0b10>, Nb.FromNumber<0b01>>, ["1", "1"]>>


  export type LeftShift<A extends Unknown, B extends Unknown> =
    B extends ["0"]
      ? A
      : LeftShift<[...A, "0"], Decrement<B>>
  
  export type _LeftShift<A, B> =
    LeftShift<A.Cast<A, Unknown>, A.Cast<B, Unknown>>

  // https://www.geeksforgeeks.org/subtract-1-without-arithmetic-operators/
  type Decrement<A extends Unknown> =
    A extends [] ? [] :
    SplitAtRightmostOne<A> extends infer R extends [Unknown, Unknown]
      ? TrimLeadingZeros<[...R[0], "0", ...A.Cast<Not<R[1]>, Unknown>]>
      : never

  type SplitAfterRightmostOne<A extends Unknown> =
    A extends [infer X extends Digit, ...infer Y extends Unknown]
      ? "1" extends Y[number]
          ? SplitAfterRightmostOne<Y> extends infer R extends [Unknown, Unknown]
              ? [[X, ...R[0]], R[1]]
              : never
          : [[X], Y]
      : []

  type SplitAtRightmostOne<A extends Unknown> =
    SplitAfterRightmostOne<A> extends infer R extends [Unknown, Unknown]
      ? [L.Popped<R[0]>, R[1]]
      : [[], []]

  type Not<A extends Unknown> =
    { [I in keyof A]: A[I] extends "0" ? "1" : "0"
    }

  type Test4 = A.Test<A.AreEqual<Decrement<["1"]>, ["0"]>>
  type Test5 = A.Test<A.AreEqual<Decrement<["1", "0", "0", "1", "0"]>, ["1", "0", "0", "0", "1"]>>
  type Test6 = A.Test<A.AreEqual<Decrement<["0"]>, ["0"]>>
  type Test7 = A.Test<A.AreEqual<Decrement<[]>, []>>


  export type FromNumber<T extends number> =
    A.Cast<FromDecimal<A.Cast<S.Split<`${T}`, "">, Nd.Unknown>>, Nb.Unknown>

  export type _FromNumber<T> = 
    FromNumber<A.Cast<T, number>>

  type FromDecimal<T extends Nd.Unknown> =
    Nd.DivideByTwo<T> extends { quotient: infer Q, remainder: infer R }
      ? { 0: R
        , 1: [...FromDecimal<A.Cast<Q, Nd.Unknown>>, ...A.Cast<R, Nd.Unknown>]
        }[Q extends ["0"] ? 0 : 1]
      : never

  type Test8 = A.Test<A.AreEqual<FromNumber<5>, ["1", "0", "1"]>>
  type Test9 = A.Test<A.AreEqual<FromNumber<16>, ["1", "0", "0", "0", "0"]>>

  
  type TrimLeadingZeros<T extends Unknown> = 
    T extends ["0"] ? T :
    T extends ["0", ...infer X extends Unknown] ? TrimLeadingZeros<X> : 
    T
  
  type _TrimLeadingZeros<T> =
    TrimLeadingZeros<A.Cast<T, Unknown>>

  type PadZerosSameAs<A extends Unknown, B extends Unknown> =
    A["length"] extends B["length"] ? A :
    PadZerosSameAs<["0", ...A], B>
    

  type ToDecimal<T extends Unknown, P extends Nd.Unknown = ["0"]> =
    T extends [] ? P :
    T extends [infer H extends Digit, ...infer T extends Digit[]]
      ? H extends "0" ? ToDecimal<T, Nd.MultiplyByTwo<P>> :
        H extends "1" ? ToDecimal<T, Nd.AddOne<Nd.MultiplyByTwo<P>>> :
        never
      : never


  export type ToNumber<T extends Unknown> =
    L.Join<ToDecimal<T>, ""> extends `${infer X extends number}` ? X : never

  export type _ToNumber<T> =
    ToNumber<A.Cast<T, Unknown>>

  type Test10 = A.Test<A.AreEqual<ToNumber<["1", "0", "1"]>, 5>>
  type Test11 = A.Test<A.AreEqual<ToNumber<["1", "0", "0", "0", "0"]>, 16>>
  type Test12 = A.Test<A.AreEqual<ToNumber<["1", "1"]>, 3>>
}


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

  export type Popped<L> =
    L extends [] ? [] :
    L extends [...infer T, unknown] ? T :
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
}

namespace A {
  export type Get<T, P> =
    B.Not<A.DoesExtend<P, unknown[]>> extends true ? Get<T, [P]> :
    P extends [] ? T :
    P extends [infer Ph] ? Ph extends keyof T ? T[Ph] : undefined :
    P extends [infer Ph, ...infer Pr] ? Get<Get<T, [Ph]>, Pr> :
    never

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

  export type AreEqual<A, B> =
    (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
      ? true
      : false;

  export type Test<T extends true> = T
  export const areEqual =
    <A, B>(_debug?: (value: A) => void) =>
      undefined as unknown as A.AreEqual<A, B>
}

namespace U {
  export type Exclude<T, U> = 
    T extends U ? never : T
}

namespace B {
  export type Not<T> = 
    T extends true ? false : true
}
