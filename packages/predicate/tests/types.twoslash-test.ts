import { p, pa } from "../src"
import "./jest-expect-extras"

const query = () => 
  ((global as any).twoSlashQueries.shift()) as { completions: string[], text: string }

test("types", () => {
  let x = {} as { a: { b: number }, z: string } | { c: string } | string

  // @ts-expect-error
  pa(x, p())

  // @ts-expect-error
  pa(x, p("  "))
  //        ^|
  expect(query().completions).toSetEqual([".a", ".a?.b", ".c", ".z", "typeof"])

  // @ts-expect-error
  pa(x, p(".a"))

  // @ts-expect-error
  pa(x, p(".a", "  "))
  //              ^|
  expect(query().completions).toSetEqual(["===", "?.b", "typeof"])

  // @ts-expect-error
  pa(x, p(".a", "?.b"))


  // @ts-expect-error
  pa(x, p(".a", "?.b", "  "))
  //                     ^|
  expect(query().completions).toSetEqual(["===", "typeof"])

  // @ts-expect-error
  pa(x, p(".a", "?.b", "typeof"))

  // @ts-expect-error
  pa(x, p(".a", "?.b", "typeof", "  "))
  //                               ^|
  expect(query().completions).toSetEqual(["===", "typeof"])

  // @ts-expect-error
  pa(x, p(".a", "?.b", "typeof", "==="))

  // @ts-expect-error
  pa(x, p(".a", "?.b", "typeof", "===", "  "))
  //                                      ^|
  expect(query().completions).toSetEqual(["number", "undefined"])

  // @ts-expect-error
  x.z

  if (pa(x, p(".a", "?.b", "typeof", "===", "number"))) {
    let _: string = x.z
  }
})