import { p, pa } from "../src"

test("implementation", () => {
  expect(pa(
    { a: 1 } as { a: { b: number } | number } | number,
    p(".a", "?.b", "typeof", "===", "undefined")
  )).toBe(true)
})