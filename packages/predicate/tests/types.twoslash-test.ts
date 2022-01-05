import { p, pa } from "../src"
import "./jest-expect-extras"

const query = () => 
  ((global as any).twoSlashQueries.shift()) as { completions: string[], text: string }

test("index index typeof === value", () => {
  let x = {} as { a: { b: number }, z: string } | { c: string } | string

  pa(x, p())

  // @ts-expect-error
  pa(x, p("  "))
  //        ^|
  expect(query().completions).toSetEqual(
    [".a", ".a?.b", ".c", ".z", "typeof", "===", "!=="]
  )

  pa(x, p(".a"))

  // @ts-expect-error
  pa(x, p(".a "))
  //          ^|
  expect(query().completions).toSetEqual(
    [".a ?.b", ".a typeof", ".a ===", ".a !=="]
  )

  pa(x, p(".a ?.b"))

  // @ts-expect-error
  pa(x, p(".a ?.b "))
  //              ^|
  expect(query().completions).toSetEqual(
    [".a ?.b typeof", ".a ?.b ===", ".a ?.b !=="]
  )

  pa(x, p(".a ?.b typeof"))

  // @ts-expect-error
  pa(x, p(".a ?.b typeof "))
  //                     ^|
  expect(query().completions).toSetEqual(
    [".a ?.b typeof typeof", ".a ?.b typeof ===", ".a ?.b typeof !=="]
  )

  // @ts-expect-error
  pa(x, p(".a ?.b typeof ==="))

  // @ts-expect-error
  pa(x, p(".a ?.b typeof ===", "  "))
  //                             ^|
  expect(query().completions).toSetEqual(["number", "undefined"])

  // @ts-expect-error
  x.z

  if (pa(x, p(".a ?.b typeof ===", "number"))) {
    expectAreTypesEqual<typeof x.z, string>().toBe(true)
  }
})

test("typeof typeof ===", () => {
  let x = { lol: 0 }
  
  if (pa(x, p("typeof typeof ===", "string"))) {
    expectAreTypesEqual<typeof x, { lol: number }>().toBe(true)
  }
})


test("index typeof !==", () => {
  let x = {} as { a: string | number | undefined } | { b: string }

  if (pa(x, p(".a typeof !==", "undefined"))) {
    expectAreTypesEqual<typeof x.a, string | number>().toBe(true)
  }
})

test("truthy", () => {
  let x = {} as { a: string } | number | undefined

  if (pa(x, p())) {
    expectAreTypesEqual<typeof x, { a: string } | number>().toBe(true)
  }
})

test("index, truthy", () => {
  let x = {} as { a?: string }

  if (pa(x, p(".a"))) {
    expectAreTypesEqual<typeof x.a, string>().toBe(true)
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

  let x = [1, 2, null].filter(p("!==", null));

  expectAreTypesEqual<typeof x, number[]>().toBe(true)
})

const expectAreTypesEqual =
  <A, B>() => ({
    toBe:
      ( _:
          (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
            ? true
            : false
      ) => {}
  })
