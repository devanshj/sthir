import * as S from "../src/index"

describe("race", () => {
  it("works", async () => {
    const a$: S.Stream<string> = s => {
      let x = setTimeout(s, 100, "a")
      let y = setTimeout(s, 500, "c")
      return () => (clearTimeout(x), clearTimeout(y))
    }

    const b$: S.Stream<string> = s => {
      let x = setTimeout(s, 200, "b0")
      let y = setTimeout(s, 300, "b1")
      return () => (clearTimeout(x), clearTimeout(y))
    }

    let emits: string[] = []
    S.race([a$, b$])(a => {
      emits.push(a)
    })
    await new Promise(f => setTimeout(f, 1000))

    expect(emits).toStrictEqual(["a", "c"])
  })
})