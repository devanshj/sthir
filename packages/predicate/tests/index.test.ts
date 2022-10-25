import { p, pa, pt } from "../src"

test("implementation", () => {
  expect(pa(
    { a: 1 } as { a: { b: number } | number } | number,
    p(".a ?.b typeof ===", "undefined")
  )).toBe(true)

  expect(pa(
    0b11 as number,
    p(`&${0b10}`)
  )).toBe(0b11 & 0b10)

  expect(pa(
    "test" as string | number,
    pt(x => typeof x === "string" ? [x] : [])
  )).toBe(true)
})