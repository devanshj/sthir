import * as t from "../src"

it("works", () => {
  let tEvent = t.bindLazy(() => t.name("Event", t.union([
    t.name("MouseDownEvent",
      t.object({
        type: t.value("MOUSEDOWN"),
        x: t.intersect([tInteger, tPositive]),
        y: t.intersect([tInteger, tPositive])
      })
    ),
    t.name("MouseUpEvent",
      t.object({
        type: t.value("MOUSEUP"),
        x: t.intersect([tInteger, tPositive]),
        y: t.intersect([tInteger, tPositive])
      })
    )
  ])))

  let tInteger = t.name("Integer",
    t.then(
      t.number,
      t.predicate((x: number): x is number & { [isInteger]: true } => Number.isInteger(x))
    )
  )
  const isInteger = Symbol("isInteger")

  let tPositive = t.name("Positive",
    t.then(
      t.number,
      t.predicate((x: number): x is number & { [isPositive]: true } => x > 0)
    )
  )
  const isPositive = Symbol("isPositive")

  expect(errors(tEvent, { x: 10.5, y: -20.5 }).map((a, i) => `${i + 1}.\n${a}`).join("\n\n")).toMatchInlineSnapshot(`
    "1.
    is not of type 'Event', as it did not match any contituents, best match was 'MouseDownEvent', but it is not of type 'MouseDownEvent' as it is missing key 'type'

    2.
    is not of type 'Event', as it did not match any contituents, best match was 'MouseDownEvent', but it is not of type 'MouseDownEvent' as
      it is missing key 'type'
      it's value at key 'x' is not of type 'Integer'

    3.
    is not of type 'Event', as it did not match any contituents, best match was 'MouseDownEvent', but it is not of type 'MouseDownEvent' as
      it is missing key 'type'
      it's value at key
        'x' is not of type 'Integer'
        'y' is not of type 'Integer'

    4.
    is not of type 'Event', as it did not match any contituents, best match was 'MouseDownEvent', but it is not of type 'MouseDownEvent' as
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