
export { UnknownNumber, Infinity, Integer, LowerBound, UpperBound };

type UnknownNumber = number

type Infinity = UnknownNumber & { [__isInfinity]: true }
declare const __isInfinity: unique symbol;
type __isInfinity = typeof __isInfinity

type Integer = { [__isInteger]: true }
declare const __isInteger: unique symbol;
type __isInteger = typeof __isInteger

type LowerBound<N extends UnknownNumber> = { [__lowerBound]: (v: N) => void }
declare const __lowerBound: unique symbol;
type __lowerBound = typeof __lowerBound

export type GetLowerBound<N extends UnknownNumber> =
  UnknownNumber extends N ? Infinity :
  N extends { [__lowerBound]: { (v: infer L0): void, (v: infer L1): void } }
    ? L0 | L1 :
  N extends { [__lowerBound]: { (v: infer L0): void } }
    ? L0 :
  never

type UpperBound<N extends UnknownNumber> = { [__upperBound]: (v: N) => void }
declare const __upperBound: unique symbol;
type __upperBound = typeof __upperBound

export type GetUpperBound<N extends UnknownNumber> =
  N extends UpperBound<infer L>
    ? UnknownNumber extends L ? Infinity : L
    : never

namespace LiteralStringified {
  export namespace Natural {
    export namespace ParsedDigit {
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

    export namespace Digit {
      export type Increment<T> =
        `${ParsedDigit.Increment<ParsedDigit.FromString<T>>}`

      export type Decrement<T> =
        `${ParsedDigit.Decrement<ParsedDigit.FromString<T>>}`

      export type Add<A, B> =
        A extends "0" ? B :
        B extends "0" ? A :
        Add<Increment<A>, Decrement<B>>
    }

    export namespace Digits {
      export type FromNumber<T> =
        FromNumberStringified<`${T & number}`>

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
          ? FromNumberStringified<Digit.Add<A0, B0>> :
        [A, B] extends [[...infer Ars, infer A0], [...infer Brs, infer B0]]
          ? FromNumberStringified<Digit.Add<Digit.Add<A0, B0>, Carry>> extends infer A0B0CarryDs
            ? A0B0CarryDs extends [infer D0] ? [...Add<Ars, Brs>, D0] :
              A0B0CarryDs extends [infer D1, infer D0] ? [...Add<Ars, Brs, D1>, D0] :
              never
            : never
          : never
    }

    export type Add<A, B> =
      Digits.ToNumberStringified<
        Digits.Add<
          Digits.FromNumber<A>,
          Digits.FromNumber<B>
        >
      >
  }

  export type Parse<T> =
    T extends keyof _Parse ? _Parse[T] : never

  export interface _Parse
    { "0": 0
    , "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10
    , "11": 11, "12": 12, "13": 13, "14": 14, "15": 15, "16": 16, "17": 17, "18": 18, "19": 19, "20": 20
    , "21": 21, "22": 22, "23": 23, "24": 24, "25": 25, "26": 26, "27": 27, "28": 28, "29": 29, "30": 30
    , "31": 31, "32": 32, "33": 33, "34": 34, "35": 35, "36": 36, "37": 37, "38": 38, "39": 39, "40": 40
    , "41": 41, "42": 42, "43": 43, "44": 44, "45": 45, "46": 46, "47": 47, "48": 48, "49": 49, "50": 50
    , "51": 51, "52": 52, "53": 53, "54": 54, "55": 55, "56": 56, "57": 57, "58": 58, "59": 59, "60": 60
    , "61": 61, "62": 62, "63": 63, "64": 64, "65": 65, "66": 66, "67": 67, "68": 68, "69": 69, "70": 70
    , "71": 71, "72": 72, "73": 73, "74": 74, "75": 75, "76": 76, "77": 77, "78": 78, "79": 79, "80": 80
    , "81": 81, "82": 82, "83": 83, "84": 84, "85": 85, "86": 86, "87": 87, "88": 88, "89": 89, "90": 90
    , "91": 91, "92": 92, "93": 93, "94": 94, "95": 95, "96": 96, "97": 97, "98": 98, "99": 99, "100": 100
    , "-1": -1, "-2": -2, "-3": -3, "-4": -4, "-5": -5, "-6": -6, "-7": -7, "-8": -8, "-9": -9, "-10": -10
    , "-11": -11, "-12": -12, "-13": -13, "-14": -14, "-15": -15, "-16": -16, "-17": -17, "-18": -18, "-19": -19, "-20": -20
    , "-21": -21, "-22": -22, "-23": -23, "-24": -24, "-25": -25, "-26": -26, "-27": -27, "-28": -28, "-29": -29, "-30": -30
    , "-31": -31, "-32": -32, "-33": -33, "-34": -34, "-35": -35, "-36": -36, "-37": -37, "-38": -38, "-39": -39, "-40": -40
    , "-41": -41, "-42": -42, "-43": -43, "-44": -44, "-45": -45, "-46": -46, "-47": -47, "-48": -48, "-49": -49, "-50": -50
    , "-51": -51, "-52": -52, "-53": -53, "-54": -54, "-55": -55, "-56": -56, "-57": -57, "-58": -58, "-59": -59, "-60": -60
    , "-61": -61, "-62": -62, "-63": -63, "-64": -64, "-65": -65, "-66": -66, "-67": -67, "-68": -68, "-69": -69, "-70": -70
    , "-71": -71, "-72": -72, "-73": -73, "-74": -74, "-75": -75, "-76": -76, "-77": -77, "-78": -78, "-79": -79, "-80": -80
    , "-81": -81, "-82": -82, "-83": -83, "-84": -84, "-85": -85, "-86": -86, "-87": -87, "-88": -88, "-89": -89, "-90": -90
    , "-91": -91, "-92": -92, "-93": -93, "-94": -94, "-95": -95, "-96": -96, "-97": -97, "-98": -98, "-99": -99, "-100": -100
    }
}