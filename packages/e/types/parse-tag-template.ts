export {
  ParseTagTemplate as Default
}

import { S, T, Never, Result } from "./extras"

type ParseTagTemplate<T> =
  S.Split<T, "\n"> extends infer Lines extends string[]
    ? Lines extends ["", ...infer Lines extends string[]]
        ? Lines extends [] ? Result.Ok<``> :
          S.GetIndent<Lines[0]> extends infer BaseIndent extends string
            ? Result.Combine<{ [I in keyof Lines]:
                  Lines[I] extends `${BaseIndent}${infer X}`
                    ? Result.Ok<X>
                    : Result.Error<IndentationMismatch<{
                        expected: BaseIndent,
                        actual: S.GetIndent<Lines[I]>,
                        at: `${I}:0`
                      }>>
              }> extends infer X
                ? X extends Result.Ok<infer X> ? Result.Ok<S.Join<X, "\n">> : X
                : Never.Let
            : Never.Let
        : Result.Error<NoEmptyLineAtStart<{ actual: Lines[0] }>>
    : Never.Let

type IndentationMismatch<T> =
  S.Join<
  [ `Indentation mismatch, `
  , `expected '${S.Assert<T.Get<T, "expected">>}' `
  , `got '${S.Assert<T.Get<T, "actual">>}', `
  , `at ${S.Assert<T.Get<T, "at">>}`
  ], "">

type NoEmptyLineAtStart<T> =
  `Expected '' got '${S.Assert<T.Get<T, "actual">>}', at 0:0`





type Test0 =
  T.Test<T.AreEqual<
    ParseTagTemplate<``>,
    Result.Ok<``>
  >>

type Test1 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\n`>,
    Result.Ok<``>
  >>

type Test2 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`lol`>,
    Result.Error<NoEmptyLineAtStart<{ actual: `lol` }>>
  >>

type Test3 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\nfoo\nbar`>,
    Result.Ok<`foo\nbar`>
  >>

type Test4 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\n    foo\n    bar`>,
    Result.Ok<`foo\nbar`>
  >>

type Test5 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\n\tfoo\n\tbar`>,
    Result.Ok<`foo\nbar`>
  >>
  
type Test6 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\n    foo\n      bar`>,
    Result.Ok<`foo\n  bar`>
  >>

type Test7 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\n\tfoo\n\t\tbar`>,
    Result.Ok<`foo\n\tbar`>
  >>

type Test8 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\n    foo\n  bar`>,
    Result.Error<IndentationMismatch<{ expected: `    `, actual: `  `, at: `1:0` }>>
  >>
  
type Test9 =
  T.Test<T.AreEqual<
    ParseTagTemplate<`\n\t\tfoo\n\tbar`>,
    Result.Error<IndentationMismatch<{ expected: `\t\t`, actual: `\t`, at: `1:0` }>>
  >>
