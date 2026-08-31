import { R } from "./extras";
import { CreateMachine, CreateMachineImpl, CreateType, Machine } from "./types";

const createMachineImpl: CreateMachineImpl = definition => {
  let state: Machine.State.Impl | undefined = undefined
  let event: Machine.Event.Impl | undefined = undefined
  let context: Machine.Context.Impl | undefined = undefined
  const subscribers: Parameters<Machine.Impl["subscribe"]>[0][] = []

  const send: Machine.Impl["send"] = (sendable) => {
    event = typeof sendable === "string" ? { type: sendable } : sendable
    if (event.type === "$$start") {
      state = definition.initial
      context = definition.context ?? ({} as Machine.Context.Impl)
      subscribers.forEach(s => s())
      return
    }
    if (event.type === "$$stop") {
      state = undefined
      effectCleanUp?.({ event: event!, context: context!, send, sendT: send })
      subscribers.splice(0, subscribers.length)
      return
    }
    if (state === undefined) {
      return
    }
    const stateNode = R.get(definition.states, state)!
    let eventDefinition = R.get(R.fromMaybe(stateNode.on), event.type)
    if (!eventDefinition) return
    if (typeof eventDefinition === "string") {
      state = eventDefinition
      subscribers.forEach(s => s())
      return
    }
    const transition = eventDefinition({ event, context: context! })
    if (!transition) return
    if (typeof transition === "string") {
      state = transition
      subscribers.forEach(s => s())
      return
    }
    if (transition.target) {
      state = transition.target
    }
    if (transition.context) {
      context = { ...context, ...transition.context }
    }
    subscribers.forEach(s => s())
  }

  let previousState: Machine.State.Impl | undefined = undefined
  let effectCleanUp: ReturnType<Machine.Definition.Effect.Impl> | undefined = undefined
  subscribers.push(() => {
    if (state === previousState) return
    if (state === undefined) {
      previousState = state
      return
    }
    const stateNode = R.get(definition.states, state)!
    effectCleanUp?.({ event: event!, context: context!, send, sendT: send })
    if (!stateNode.effect) {
      previousState = state
      return
    }
    effectCleanUp = stateNode.effect({ event: event!, context: context!, send, sendT: send })
    previousState = state
  })

  return {
    get state() { return state ?? definition.initial },
    get context() { return context ?? ({} as Machine.Context.Impl) },
    send,
    sendT: send,
    subscribe: f => {
      subscribers.push(f)
      return () => void subscribers.splice(subscribers.indexOf(f), 1)
    }
  }
}
export const createMachine =
  createMachineImpl as CreateMachine

export const t =
 (() => {}) as CreateType



