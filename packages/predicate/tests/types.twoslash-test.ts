import { p, pa } from "../src"
import * as N from "@sthir/number"
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

test("Issue #1", () => {
  let x = {} as { a: string } | undefined

  if (pa(x, p("?.a"))) {
    expectAreTypesEqual<typeof x.a, string>().toBe(true)
  }
})

test("Issue #2", () => {
  let x = {} as { a: { b: string } | undefined }

  if (pa(x, p(".a?.b"))) {
    expectAreTypesEqual<typeof x.a.b, string>().toBe(true)
  }
})

test("&", () => {
  let x = {} as
    | { flags: 0b101, foo: string }
    | { flags: 0b110, foo: number }
    | { flags: 0b010, foo: boolean }

  if (pa(x, p(".flags &", 0b100))) {
    expectAreTypesEqual<typeof x.foo, string | number>().toBe(true)
  }
})

test("& for Jason's tweet 1471212197183651841", () => {
  // https://twitter.com/_developit/status/1471212197183651841

  const Flag = {
    Text: N.e("1 << 0"),
    Element: N.e("1 << 1"),
    Component: N.e("1 << 2"),
    A: N.e("1 << 3"),
    B: N.e("1 << 4"),
    C: N.e("1 << 5"),
  }
  type Flag = typeof Flag
  type NonNodeFlag = Flag["A"] | Flag["B"] | Flag["C"];

  type PreactNode =
    TextNode | ElementNode | ComponentNode;
  
  interface TextNode
    { flags: N.E<`${Flag["Text"]} | ${NonNodeFlag}`>
    , text: string
    }

  interface ElementNode
    { flags: N.E<`${Flag["Element"]} | ${NonNodeFlag}`>
    , element: unknown
    }

  interface ComponentNode
    { flags: N.E<`${Flag["Component"]} | ${NonNodeFlag}`>
    , component: unknown
    }

  const render = (node: PreactNode) => {
    if (node.flags & Flag.Text) {
      // @ts-expect-error
      node.text
    }

    if (pa(node, p(".flags &", Flag.Text))) {
      expectAreTypesEqual<typeof node.text, string>().toBe(true)
    }
  }
})

test("Issue #8: index recursive", () => {
  interface Foo { foo: Foo }
  let x = {} as Foo

  pa(x, p())

  pa(x, p(".foo"))

  pa(x, p(".foo .foo"))
})

test("Issue #6: Huge predicant", () => {
  pa({} as Element, p())

  pa({} as Element, p(".parentElement"))
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
