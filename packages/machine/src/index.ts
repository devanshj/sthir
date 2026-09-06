import { R } from "./extras";
import { CreateMachine, CreateMachineImpl, CreateType, Machine } from "./types";

const createMachineImpl: CreateMachineImpl = definition => {
  let state: Machine.State.Impl | undefined = undefined
  let event: Machine.Event.Impl | undefined = undefined
  let context: Machine.Context.Impl = definition.context
  const subscribers: Parameters<Machine.Impl["subscribe"]>[0][] = []

  const send: Machine.Impl["send"] = (newEvent) => {
    event = newEvent
    if (event.type === "$$start") {
      state = definition.initial === undefined ? "" as Machine.State.Impl : resolveTarget(definition, definition.initial as string as Machine.Target.Impl)
      context = definition.context
      subscribers.forEach(s => s())
      return
    }
    if (event.type === "$$stop") {
      state = undefined
      subscribers.forEach(s => s())
      subscribers.splice(0, subscribers.length)
      return
    }
    if (state === undefined) {
      return
    }
    let cursor: Machine.Target.Impl = state
    let eventDefinition
    while (true) {
      eventDefinition = R.get(R.fromMaybe(stateNodeAtTarget(definition, cursor).on), event.type)
      if (cursor === "") break;
      if (eventDefinition) break;
      cursor = parentTarget(cursor)
    }
    if (!eventDefinition) return
    if (typeof eventDefinition === "string") {
      state = resolveTarget(definition, eventDefinition)
      subscribers.forEach(s => s())
      return
    }
    const transition = eventDefinition({ event, context, contextR: context })
    if (!transition) return
    if (typeof transition === "string") {
      state = resolveTarget(definition, transition)
      subscribers.forEach(s => s())
      return
    }
    if (transition.target) {
      state = resolveTarget(definition, transition.target)
    }
    if (transition.context) {
      context = transition.context
    }
    subscribers.forEach(s => s())
  }

  let previousState: Machine.State.Impl | undefined = undefined
  let invocationCleanups = {} as R.Of<Machine.Target.Impl, ReturnType<Machine.Definition.Invoke.Impl>>
  subscribers.push(() => {
    // $$start
    if (previousState === undefined) {
      let cursor = "" as Machine.Target.Impl
      while (true) {
        const stateNodeAtCursor = stateNodeAtTarget(definition, cursor)
        invocationCleanups = R.set(
          invocationCleanups,
          cursor,
          stateNodeAtCursor.invoke?.({ event: event!, context, contextR: context, send, sendT: send })
        )
        if (stateNodeAtCursor.initial === undefined) break;
        cursor = (cursor === "" ? stateNodeAtCursor.initial : `${cursor}.${stateNodeAtCursor.initial}`) as Machine.Target.Impl
      }
      previousState = state
      return
    }

    // $$stop
    if (state === undefined) {
      let cursor: Machine.Target.Impl = previousState
      while (true) {
        R.get(invocationCleanups, cursor)?.({ event: event!, context, contextR: context, send, sendT: send })
        if (cursor === "") break;
        cursor = parentTarget(cursor)
      }
      previousState = state
      return
    }
    
    let cursor: Machine.Target.Impl = previousState
    while (true) {
      if (isAncestorTarget(cursor, state)) break;
      R.get(invocationCleanups, cursor)?.({ event: event!, context, contextR: context, send, sendT: send })
      cursor = parentTarget(cursor)
    }
    while (true) {
      if (cursor === state) break;
      cursor = childTarget(cursor, state)
      invocationCleanups = R.set(
        invocationCleanups,
        cursor,
        stateNodeAtTarget(definition, cursor).invoke?.({ event: event!, context, contextR: context, send, sendT: send })
      )
    }
    previousState = state
  })

  return {
    get state() {
      if (state !== undefined) return state
      return definition.initial === undefined ? "" as Machine.State.Impl : resolveTarget(definition, definition.initial as string as Machine.Target.Impl)
    },
    get context() { return context },
    get contextR() { return context },
    send,
    sendT: send,
    subscribe: f => {
      subscribers.push(f)
      return () => void subscribers.splice(subscribers.indexOf(f), 1)
    }
  }
}
export const createMachine =
  createMachineImpl as unknown as CreateMachine

const resolveTarget = (definition: Machine.Definition.Impl, target: Machine.Target.Impl) =>
  resolveTargetFromStateNode(
    get(
      definition,
      target === ""
        ? []
        : `states.${target.replaceAll(".", ".states.")}`.split(".")
    ) as Machine.Definition.StateNode.Impl,
    target
  )

const parentTarget = (target: Machine.Target.Impl) =>
  (
    !target.includes(".") ? "" :
    target.split(".").slice(0, -1).join(".")
  ) as Machine.Target.Impl

const childTarget = (parent: Machine.Target.Impl, descendant: Machine.State.Impl) =>
  (
    parent === ""
      ? descendant.split(".")[0]
      : `${parent}.${descendant.slice(parent.length + 1).split(".")[0]}`
  ) as Machine.Target.Impl

const isAncestorTarget = (ancestor: Machine.Target.Impl, descendant: Machine.State.Impl) =>
  ancestor === "" ||
  ancestor === descendant ||
  descendant.startsWith(`${ancestor}.`)

const resolveTargetFromStateNode = (stateNode: Machine.Definition.StateNode.Impl, target: Machine.Target.Impl): Machine.State.Impl =>
  stateNode.initial === undefined
    ? target as string as Machine.State.Impl
    : resolveTargetFromStateNode(
        R.get(stateNode.states!, stateNode.initial)!,
        (target ===  ""
          ? stateNode.initial
          : `${target}.${stateNode.initial}`) as Machine.Target.Impl
      )

export const stateNodeAtTarget = (definition: Machine.Definition.Impl, target: Machine.Target.Impl | Machine.State.Impl) =>
  get(
    definition,
    target === "" ? [] :
    `states.${target.replaceAll(".", ".states.")}`.split(".")
  ) as Machine.Definition.StateNode.Impl

const get = (t: {} | undefined, p: string[], f = undefined): {} | undefined =>
  t === undefined ? f :
  p.length === 0 ? t === undefined ? f : t :
  (([k1, ...kr]) => get(t[k1! as never], kr, f))(p)

export const t =
 (() => {}) as CreateType



