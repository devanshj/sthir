let t0: Literal.Natural.Add<12345, 6789> = "?"

namespace Literal {
  export namespace Natural {
    export namespace Digit {
      type Values =
        [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
        , 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
        , 21, 22, 23, 24, 25, 26, 27
        ]

      export type FromString<T, Vs extends Values = Values> =
        { [I in keyof Vs]:
            T extends I ? Vs[I] : never
        }[number]

      export type Increment<T> = 
        Values extends [0, ...infer X] ? X[T & number] : never

      export type Decrement<T> =
        [-1, ...Values][T & number]
    }

    export namespace DigitStringified {
      export type Increment<T> =
        `${Digit.Increment<Digit.FromString<T>>}`

      export type Decrement<T> =
        `${Digit.Decrement<Digit.FromString<T>>}`

      export type Add<A, B> =
        A extends "0" ? B :
        B extends "0" ? A :
        Add<Increment<A>, Decrement<B>>
    }

    export namespace DigitsStringified {
      export type FromNumber<T> =
        FromNumberStringified<`${T & number}`>

      export type ToNumber<T> =
        ToNumberStringified<T> extends `${infer X extends number}` ? X : never

      export type FromNumberStringified<T> = 
        T extends `${infer H}${infer T}`
          ? [...(H extends "-" ? [] : [H]), ...FromNumberStringified<T>]
          : []

      export type ToNumberStringified<T> =
        T extends [] ? "" :
        T extends [infer H, ...infer T] ? `${H & string}${ToNumberStringified<T>}` :
        never

      export type Add<A, B, Carry = "0"> =
        A extends [] ? Carry extends "0" ? B : Add<B, [Carry]> :
        B extends [] ? Carry extends "0" ? A : Add<A, [Carry]> :
        [A, B] extends [[infer A0], [infer B0]]
          ? FromNumberStringified<DigitStringified.Add<A0, B0>> :
        [A, B] extends [[...infer Ars, infer A0], [...infer Brs, infer B0]]
          ? FromNumberStringified<DigitStringified.Add<DigitStringified.Add<A0, B0>, Carry>> extends infer A0B0CarryDs
            ? A0B0CarryDs extends [infer D0] ? [...Add<Ars, Brs>, D0] :
              A0B0CarryDs extends [infer D1, infer D0] ? [...Add<Ars, Brs, D1>, D0] :
              never
            : never
          : never
    }

    export type Add<A, B> =
      DigitsStringified.ToNumber<
        DigitsStringified.Add<
          DigitsStringified.FromNumber<A>,
          DigitsStringified.FromNumber<B>
        >
      >
  }
}
export {}