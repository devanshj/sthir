import * as S from "../src/index"
import { pipeWith as p } from "pipe-ts"

type Nth = 
  (n: number, t: number) => <T>($: S.Stream<T>) => S.Stream<T>

type NthImpl = 
  (n: number, t: number ) => ($: S.Stream<"T">) => S.Stream<"T">

const nthImpl: NthImpl = (n, t) => $ =>
  n === 0 ? $ :
  S.race([
    p($, S.flatMap(a =>
      p(S.time(t), S.map(() => a))
    )),
    nthImpl(n-1, t)($)
  ])

const nth = nthImpl as Nth


describe("nth", () => {

  test("doubleClick-1", async () => {
    let emits: string[] = []

    p(
      (s => {
        let x = setTimeout(() => s("a"), 100)
        let y = setTimeout(() => s("b"), 150) 
        return () => (clearTimeout(x), clearTimeout(y))
      }) as S.Stream<string>,
      nth(2, 250)
    )(a => emits.push(a))

    await new Promise(f => setTimeout(f, 500))

    expect(emits).toStrictEqual(["b"])
  })

  test("doubleClick-2", async () => {
    let emits: string[] = []

    p(
      (s => {
        let x = setTimeout(() => s("a"), 100)
        let y = setTimeout(() => s("b"), 300) 
        return () => (clearTimeout(x), clearTimeout(y))
      }) as S.Stream<string>,
      nth(2, 250)
    )(a => emits.push(a))

    await new Promise(f => setTimeout(f, 500))

    expect(emits).toStrictEqual([])
  })

  

  test("doubleClick-3", async () => {
    let emits: string[] = []

    p(
      (s => {
        let x = setTimeout(() => s("a"), 100)
        let y = setTimeout(() => s("b"), 300) 
        let z = setTimeout(() => s("c"), 400) 
        return () => (clearTimeout(x), clearTimeout(y), clearTimeout(z))
      }) as S.Stream<string>,
      nth(2, 250)
    )(a => emits.push(a))

    await new Promise(f => setTimeout(f, 500))

    expect(emits).toStrictEqual(["c"])
  })

  
  test("tripleClick-1", async () => {
    let emits: string[] = []

    p(
      (s => {
        let x = setTimeout(() => s("a"), 100)
        let y = setTimeout(() => s("b"), 150)
        let z = setTimeout(() => s("c"), 200)
        return () => (clearTimeout(x), clearTimeout(y), clearTimeout(z))
      }) as S.Stream<string>,
      nth(2, 250)
    )(a => emits.push(a))

    await new Promise(f => setTimeout(f, 700))

    expect(emits).toStrictEqual(["c"])
  })
  
})
