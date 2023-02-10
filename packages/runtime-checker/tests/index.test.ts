import * as t from "../src/index"

it("works", () => {
  let tEvent = t.nameInference(
    t.bindLazy(() => t.name("Event", t.union([
      t.name("MouseDownEvent",
        t.object({
          type: t.value("MOUSE_DOWN"),
          x: t.then(t.number, t.intersect([tInteger, tPositive])),
          y: t.then(t.number, t.intersect([tInteger, tPositive]))
        })
      ),
      t.name("MouseUpEvent",
        t.object({
          type: t.value("MOUSE_UP"),
          x: t.then(t.number, t.intersect([tInteger, tPositive])),
          y: t.then(t.number, t.intersect([tInteger, tPositive]))
        })
      )
    ]))), t => {

    type Event = MouseDownEvent | MouseUpEvent
    interface MouseDownEvent extends Extract<t.Parsed<typeof t>, { type: "MOUSE_DOWN" }> {}
    interface MouseUpEvent extends Extract<t.Parsed<typeof t>, { type: "MOUSE_UP" }> {}
    return {} as t.Parser<Event>
  })

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

  expect(errors(tEvent, { x: 10.5, y: -20.5 }).map((a, i) => `${i + 1}.\n${a}`).join("\n\n")).toMatchInlineSnapshot(`
    "1.
    is not of type 'Event' as it did not match any contituents, best match was 'MouseDownEvent' but it is missing key 'type'

    2.
    is not of type 'Event' as it did not match any contituents, best match was 'MouseDownEvent' but
      it is missing key 'type'
      it's value at key 'x' is not of type 'Integer'

    3.
    is not of type 'Event' as it did not match any contituents, best match was 'MouseDownEvent' but
      it is missing key 'type'
      it's value at key
        'x' is not of type 'Integer'
        'y' is not of type 'Integer'

    4.
    is not of type 'Event' as it did not match any contituents, best match was 'MouseDownEvent' but
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
