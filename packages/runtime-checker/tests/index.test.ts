import * as t from "../src/index"

test("basic", () => {
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


  expect([...tMouseEvent({ x: 10.5, y: -20.5 })]).toMatchInlineSnapshot(`
    [
      {
        "type": "error",
        "value": "is not of type 'MouseEvent' as it did not match any contituents, best match probably was 'MouseDownEvent' but it is missing key 'type'",
      },
      {
        "type": "error",
        "value": "is not of type 'MouseEvent' as it did not match any contituents, best match probably was 'MouseDownEvent' but it's value at key 'x' is not of type 'Integer'",
      },
      {
        "type": "error",
        "value": "is not of type 'MouseEvent' as it did not match any contituents, best match probably was 'MouseDownEvent' but it's value at key 'y' is not of type 'Integer'",
      },
      {
        "type": "innerOk",
      },
      {
        "type": "error",
        "value": "is not of type 'MouseEvent' as it did not match any contituents, best match probably was 'MouseDownEvent' but it's value at key 'y' is not of type 'Positive'",
      },
      undefined,
    ]
  `)
})

test("union best match", () => {
  const tEvent = t.name("Event", t.union([
    t.name("ClickEvent", t.object({
      type: t.value("click"),
      x: t.number,
      y: t.number
    })),
    t.name("KeypressEvent", t.object({
      type: t.value("keypress"),
      code: t.number
    }))
  ]))

  expect([...tEvent({ code: 13 })]).toMatchInlineSnapshot(`
    [
      {
        "type": "error",
        "value": "is not of type 'Event' as it did not match any contituents, best match probably was 'KeypressEvent' but it is missing key 'type'",
      },
      {
        "type": "innerOk",
      },
      undefined,
    ]
  `)
})
