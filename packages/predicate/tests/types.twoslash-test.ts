import { p, ps, pa } from "../src"
import "./jest-expect-extras"

const query = () => 
  ((global as any).twoSlashQueries.shift()) as { completions: string[], text: string }

test("index index typeof === value", () => {
  let x = {} as { a: { b: number }, z: string } | { c: string } | string

  pa(x, p())

  // @ts-expect-error
  pa(x, p("  "))
  //        ^|
  expect(query().completions).toSetEqual([".a", ".a?.b", ".c", ".z", "typeof"])

  pa(x, p(".a"))

  // @ts-expect-error
  pa(x, p(".a", "  "))
  //              ^|
  expect(query().completions).toSetEqual(["===", "!==", "?.b", "typeof"])

  pa(x, p(".a", "?.b"))


  // @ts-expect-error
  pa(x, p(".a", "?.b", "  "))
  //                     ^|
  expect(query().completions).toSetEqual(["===", "!==", "typeof"])

  pa(x, p(".a", "?.b", "typeof"))

  // @ts-expect-error
  pa(x, p(".a", "?.b", "typeof", "  "))
  //                               ^|
  expect(query().completions).toSetEqual(["===", "!==", "typeof"])

  // @ts-expect-error
  pa(x, p(".a", "?.b", "typeof", "==="))

  // @ts-expect-error
  pa(x, p(".a", "?.b", "typeof", "===", "!==", "  "))
  //                                      ^|
  expect(query().completions).toSetEqual(["number", "undefined"])

  // @ts-expect-error
  x.z

  if (pa(x, p(".a", "?.b", "typeof", "===", "number"))) {
    let _: string = x.z
  }
})

test("typeof typeof ===", () => {
  let x = { lol: 0 }
  
  if (pa(x, p("typeof", "typeof", "===", "string"))) {
    let _: { lol: number } = x;
  }
})


test("index typeof !==", () => {
  let x = {} as { a: string | number | undefined } | { b: string }

  if (pa(x, p(".a", "typeof", "!==", "undefined"))) {
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/47283
    let _: string | number = x.a
  }
})

test("truthy", () => {
  let x = {} as { a: string } | number | undefined

  if (pa(x, p())) {
    let _: { a: string } | number = x
  }

  if (pa(x, ps())) {
    let _: { a: string } | number = x
  }
})

test("index, truthy", () => {
  let x = {} as { a?: string }

  if (pa(x, p(".a"))) {
    let _: { a: string } = x
  }

  if (pa(x, ps(".a"))) {
    let _: { a: string } = x
  }
})

test("no operators", () => {
  ;[1, 2, null].filter(p())

  // @ts-expect-error
  ;[1, 2, null].filter(p("  "))
  //                      ^|
  expect(query().completions).toSetEqual(["===", "!==", "typeof"])

  // @ts-expect-error
  ;[1, 2, null].filter(p("!=="))

  let _: number[] = [1, 2, null].filter(p("!==", null));


  
  ;[1, 2, null].filter(ps());

  // @ts-expect-error
  ;[1, 2, null].filter(ps("  "))
  //                        ^|
  expect(query().completions).toSetEqual(["===", "!==", "typeof"])

  // @ts-expect-error
  ;[1, 2, null].filter(ps("!=="))

  let __: number[] = [1, 2, null].filter(ps("!==", null))
})