import { e } from "../src"

describe("e", () => {
  it("uses `new Function`", () => {
    expect(e("0b01 | 0b10")).toBe(0b11)
  })

  it("uses parser in case of EvalError", () => {
    let savedFunction = global.Function;
    global.Function = function() {
      return () => {
        throw new EvalError()
      }
    } as any

    expect(() => {
      (new Function("return 0b01 | 0b10"))()
    }).toThrowError(EvalError)

    expect(e("0b01 | 0b10")).toBe(0b11)

    global.Function = savedFunction
  })

  it("doesn't compile for invalid expressions", () => {
    // @ts-expect-error
    e("0b01 | lol")
  })
})