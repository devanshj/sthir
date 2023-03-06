import * as t from "../src/index"

it("works", () => {

  let tMouseEvent = t.bindLazy(() => t.name(
    "MouseEvent",
    t => { type MouseEvent = typeof t | never; return {} as MouseEvent },

    t.union([tMouseDownEvent, tMouseUpEvent])
  ))
  

  let tMouseDownEvent = t.bindLazy(() => t.name(
    "MouseDownEvent",
    t => { interface MouseDownEvent extends t.N<typeof t> {}; return {} as MouseDownEvent },

    t.object({
      type: t.value("MOUSE_DOWN"),
      x: t.then(t.number, t.intersect([tInteger, tPositive])),
      y: t.then(t.number, t.intersect([tInteger, tPositive]))
    })
  ))

  let tMouseUpEvent = t.bindLazy(() => t.name(
    "MouseUpEvent",
    t => { interface MouseUpEvent extends t.N<typeof t> {}; return {} as MouseUpEvent },

    t.object({
      type: t.value("MOUSE_UP"),
      x: t.then(t.number, t.intersect([tInteger, tPositive])),
      y: t.then(t.number, t.intersect([tInteger, tPositive]))
    })
  ))


  let tInteger = t.name("Integer", t.predicate(
    (x: number): x is number & Integer => Number.isInteger(x)
  ))
  const isInteger = Symbol("isInteger")
  interface Integer { [isInteger]: true }
  

  let tPositive = t.name("Positive", t.predicate(
    (x: number): x is number & Positive => x > 0
  ))
  const isPositive = Symbol("isPositive")
  interface Positive { [isPositive]: true }

  
  expect(errors(tMouseEvent, { x: 10.5, y: -20.5 }).map((a, i) => `${i + 1}.\n${a}`).join("\n\n")).toMatchInlineSnapshot(`
    "1.
    is not of type 'MouseEvent' as it did not match any contituents, best match was 'MouseDownEvent' but it is missing key 'type'

    2.
    is not of type 'MouseEvent' as it did not match any contituents, best match was 'MouseDownEvent' but
      it is missing key 'type'
      it's value at key 'x' is not of type 'Integer'

    3.
    is not of type 'MouseEvent' as it did not match any contituents, best match was 'MouseDownEvent' but
      it is missing key 'type'
      it's value at key
        'x' is not of type 'Integer'
        'y' is not of type 'Integer'

    4.
    is not of type 'MouseEvent' as it did not match any contituents, best match was 'MouseDownEvent' but
      it is missing key 'type'
      it's value at key
        'x' is not of type 'Integer'
        'y' is not of type
          'Integer'
          'Positive'"
  `)
})

const errors = <T extends t.UnknownParser>(p: T, a: t.Parsee<T>) =>
  [...t.accumulateErrors(p)(a as never)].flatMap(y => y && y.type === "error" ? [y.value] : [])
