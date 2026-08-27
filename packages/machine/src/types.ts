import { R } from "./extras"

export type CreateMachine =
  <D extends Machine.Definition<D>>(definition: D) =>
    Machine<D>

export type CreateMachineImpl =
  (definition: Machine.Definition.Impl) => Machine.Impl

export const $$t = Symbol("$$t")
type $$t = typeof $$t
export type CreateType = <T>() => { [$$t]: T }

export type Machine<D> =
  Machine.State<D> extends infer State
    ? & A.Instantiated<
          { send: Machine.Send<D>
          , subscribe: (f: () => void) => () => void
          }>
      & ( State extends unknown
          ? A.Instantiated<
              { state: State
              , context: A.Uninstantiated<Machine.ContextForState<D, State>>
              }>
          : never
        )
    : never

interface MachineImpl
  { state: Machine.State.Impl
  , context: Machine.Context.Impl
  , send: Machine.Send.Impl
  , subscribe: (f: () => void) => () => void
  }

export namespace Machine {
  export type Impl = MachineImpl

  export type Definition<Self> =
    // doing A.Get<Self, "states"> breaks the inference somehow hence using Self["states" & keyof Self] everywhere
    & { initial: keyof A.Get<Self, "states">
      , states:
          { [StateIdentifier in keyof Self["states" & keyof Self]]:
            StateIdentifier extends A.String
              ? Definition.StateNode<Self, ["states", StateIdentifier]>
              : A.CustomError<"Error: Only string identifiers allowed", A.Get<Self, ["states", StateIdentifier]>>
          }
      , schema?: Definition.Schema<Self, ["schema"]>
      , context?: unknown
      }

  interface DefinitionImp
    { initial: State.Impl
    , states: R.Of<State.Impl, Definition.StateNode.Impl>
    , schema?: { events?: R.Of<Event.Impl["type"], null> }
    , context?: Machine.Context.Impl
    }

  export namespace Definition {
    export type Impl = DefinitionImp

    export interface StateNode<D, P>
      { on?: On<D, L.Concat<P, ["on"]>>
      , effect?: Effect<D, L.Concat<P, ["effect"]>>
      }

    interface StateNodeImpl
      { on?: On.Impl
      , effect?: Effect.Impl
      }
    export namespace StateNode {
      export type Impl = StateNodeImpl
    }

    export type On<
      D, P, Self = A.Get<D, P>,
      EventsSchema = A.Get<D, ["schema", "events"], {}>,
      EventTypeConstraint =
        A.Get<EventsSchema, ExhaustiveIdentifier, false> extends true
          ? U.Exclude<keyof EventsSchema, ExhaustiveIdentifier>
          : A.String
    > =
      { [EventType in keyof Self]:
          A.DoesExtend<EventType, A.String> extends false
            ? A.CustomError<"Error: only string types allowed", A.Get<Self, EventType>> :
          EventType extends ExhaustiveIdentifier
            ? A.CustomError<
                `Error: '${ExhaustiveIdentifier}' is a reserved name`,
                A.Get<Self, EventType>
              > :
          EventType extends StartEventType
            ? A.CustomError<
                `Error: '${StartEventType}' is a reserved type`,
                A.Get<Self, EventType>
              > :
          A.DoesExtend<EventType, EventTypeConstraint> extends false
            ? A.CustomError<
                LS.ConcatAll<
                  [ `Error: Event type '${S.Assert<EventType>}' is not found in schema.events `
                  , "which is marked as exhaustive"
                  ]>,
                A.Get<Self, EventType>
              > :
          Transition<D, L.Concat<P, [EventType]>>
      }
    
    type OnImpl = R.Of<U.Exclude<Event.Impl["type"], Machine.Definition.StartEventType | Machine.Definition.StopEventType>, Transition.Impl>
    export namespace On {
      export type Impl = OnImpl
    }

    export type Transition<D, P,
      TargetString = Machine.State<D>,
      State = L.Pop<L.Popped<L.Popped<P>>>,
      EventType = L.Pop<P>
    > =
      | TargetString
      | ((parameter:
            { event: A.Instantiated<U.Extract<Machine.Event<D>, { type: EventType }>>
            , context: A.Instantiated<Machine.ContextForState<D, State>>
            }
            /*
            For some reason following result in circularity errors
            A.Instantiated<
              { event: A.Uninstantiated<U.Extract<Machine.Event<D>, { type: EventType }>>
              , context: A.Uninstantiated<Machine.ContextForState<D, State>>
              }
            >
            */
          ) =>
          | undefined
          | TargetString
          | { target: TargetString, context?: unknown }
          | { target?: TargetString, context: unknown }
        )

    type TransitionImpl =
        | Machine.State.Impl
        | (
            (parameter: { event: Machine.Event.Impl, context: Machine.Context.Impl }) =>
              | undefined
              | Machine.State.Impl
              | { target?: Machine.State.Impl, context?: Machine.Context.Impl }
          )

    export namespace Transition {
      export type Impl = TransitionImpl
    }

    export type DesugarTransition<T> =
      T extends A.String ? () => { target: T } :
      T extends (...a: infer A) => A.String ? (...a: A) => { target: T } :
      T
        

    export type Effect<D, P, State = L.Pop<L.Popped<P>>> = 
      ( parameter:
          A.Instantiated<
            { event: A.Uninstantiated<Machine.EntryEventForState<D, State>>
            , context: A.Uninstantiated<Machine.ContextForState<D, State>>
            , send: A.Uninstantiated<Machine.Send<D>>
            }
          >
      ) =>
          | void 
          | (
              ( cleanupParameter:
                  A.Instantiated<
                    { event: A.Uninstantiated<Machine.ExitEventForState<D, State>>
                    , context: A.Uninstantiated<Machine.ContextForState<D, State>>
                    , send: A.Uninstantiated<Machine.Send<D>>
                    }
                  >
              ) =>
                void
            )

    type EffectImpl =
      (parameter: { event: Machine.Event.Impl, context: Machine.Context.Impl, send: Machine.Send.Impl }) =>
        | void
        | (
            (cleanupParameter: { event: Machine.Event.Impl, context: Machine.Context.Impl, send: Machine.Send.Impl }) =>
              void
          )

    export namespace Effect {
      export type Impl = EffectImpl  
    }


    export type Schema<D, P, Self = A.Get<D, P>,
      EventsSchema = A.Get<Self, "events">
    > =
      { events?:
          { [Type in keyof EventsSchema]:
              Type extends Definition.ExhaustiveIdentifier
                ? boolean :
              Type extends Definition.StartEventType
                ? A.CustomError<
                    `Error: '${Definition.StartEventType}' is a reserved type`,
                    A.Get<EventsSchema, Type>
                  > :
              A.DoesExtend<Type, A.String> extends false
                ? A.CustomError<
                    "Error: Only string types allowed",
                    A.Get<EventsSchema, Type>
                  > :
              A.Get<EventsSchema, Type> extends infer PayloadWrapped
                ? A.DoesExtend<PayloadWrapped, { [$$t]: unknown }> extends false
                    ? A.CustomError<
                        "Error: Use `t` to define payload type, eg `t<{ foo: number }>()`",
                        A.Get<EventsSchema, Type>
                      > :
                  A.Get<PayloadWrapped, $$t> extends infer Payload
                    ? A.IsPlainObject<Payload> extends false
                        ? A.CustomError<
                            "Error: An event payload should be an object, eg `t<{ foo: number }>()`",
                            A.Get<EventsSchema, Type>
                          > :
                      "type" extends keyof Payload
                        ? A.CustomError<
                            LS.ConcatAll<
                              [ "Error: An event payload cannot have a property `type` as it's already defined. "
                              , `In this case as '${S.Assert<Type>}'`
                              ]>,
                            A.Get<EventsSchema, Type>
                          > :
                        A.Get<EventsSchema, Type>
                    : never
                : never
          }
      }

    export type ExhaustiveIdentifier = "$$exhaustive" & unknown
    export type StartEventType = "$$start"
    export type StopEventType = "$$stop"
  }

  export type State<D> =
    keyof A.Get<D, "states">

  export type InitialState<D> =
    A.Get<D, "initial">

  type StateImpl = string & A.Tag<"Machine.State">
  export namespace State {
    export type Impl = StateImpl
  }
  
  export type ContextForState<D, State, VisitedNode = never> =
    U.RemoveDuplicated<
      | O.Value<{
          [S in keyof A.Get<D, ["states"]>]: 
            | O.Value<{
                [E in keyof A.Get<D, ["states", S, "on"], {}>]:
                  `${S & string}.${E & string}` extends VisitedNode ? never :
                  Machine.Definition.DesugarTransition<A.Get<D, ["states", S, "on", E]>> extends (...a: never) => infer T
                    ? T extends unknown
                        ? T extends { target: State, context: infer C } ? O.Spread<A.Instantiated<Machine.ContextForState<D, S, VisitedNode | `${S & string}.${E & string}`>>, C> :
                          T extends { target?: never, context: infer C }
                            ? S extends State
                                ? O.Spread<Machine.ContextForState<D, S, VisitedNode | `${S & string}.${E & string}`>, C>
                                : never :
                          T extends { target: State } ? Machine.ContextForState<D, S, VisitedNode | `${S & string}.${E & string}`> :
                          never
                        : never
                    : never
              }>
        }>
      | (A.Get<D, "initial"> extends State ? A.Get<D, "context", {}> : never)
    >

  type ContextImpl = ({} & A.Tag<"Machine.Context">)
  export namespace Context {
    export type Impl = ContextImpl
  }

  export type Event<D, EventsSchema = A.Get<D, ["schema", "events"], {}>> = 
    | O.Value<{ [T in U.Exclude<keyof EventsSchema, Definition.ExhaustiveIdentifier>]:
        A.Get<EventsSchema, [T, $$t]> extends infer P
          ? P extends unknown ? O.ShallowClean<{ type: T } & P> : never
          : never
      }>
    | ( A.Get<EventsSchema, Definition.ExhaustiveIdentifier, false> extends true ? never :
        ( ( O.Value<
            { [S in keyof A.Get<D, "states">]:
                keyof A.Get<D, ["states", S, "on"]>
            }> extends infer EventType
              ? EventType extends unknown ? { type: EventType } : never
            : never
          )
        | ( keyof A.Get<D, "on"> extends infer EventType
              ? EventType extends unknown ? { type: EventType } : never
              : never
          )
        ) extends infer InferredEvent
          ? InferredEvent extends unknown
              ? A.Get<InferredEvent, "type"> extends keyof EventsSchema ? never :
                A.Get<InferredEvent, "type"> extends Definition.ExhaustiveIdentifier ? never :
                A.Get<InferredEvent, "type"> extends Definition.StartEventType ? never :
                A.Get<InferredEvent, "type"> extends Definition.StopEventType ? never :
                InferredEvent
              : never
          : never
      )
    | { type: Definition.StartEventType }
    | { type: Definition.StopEventType }
    
  type EventImpl = { type: (string & A.Tag<"Machine.Event['type']">) | "$$start" | "$$stop" }
  export namespace Event {
    export type Impl = EventImpl
  }

  export type EntryEventForState<D, State> =
    | ( State extends InitialState<D>
          ? { type: Definition.StartEventType }
          : never
      )
    | U.Extract<
        Event<D>,
        { type:
            | O.Value<{ [S in keyof A.Get<D, "states">]:
                O.Value<{ [E in keyof A.Get<D, ["states", S, "on"]>]:
                  Machine.Definition.DesugarTransition<A.Get<D, ["states", S, "on", E]>> extends (...a: never) => infer T
                    ? T extends unknown
                        ? A.Get<T, "target"> extends State
                            ? E
                            : never
                        : never
                    : never
                }>
              }>
        }
      >

  export type ExitEventForState<D, State> =
    U.Extract<
      Event<D>,
      { type:
          | keyof A.Get<D, ["states", State, "on"], {}>
          | Definition.StopEventType
      }
    >

  export type Sendable<D, E = Event<D>> =
    | ( E extends unknown
          ? { type: A.Get<E, "type"> } extends E
              ? A.Get<E, "type">
              : never
          : never
      )
    | E
  type SendableImpl = 
    | Event.Impl["type"]
    | Event.Impl
  export namespace Sendable {
    export type Impl = SendableImpl  
  }

  export type Send<D> =
    (sendable: Sendable<D>) => void

  type SendImpl = (send: Sendable.Impl) => void
  export namespace Send {
    export type Impl = SendImpl
  }
}

export namespace L {
  export type Assert<T> = A.Cast<T, A.Tuple>
  export type Concat<A, B> = [...L.Assert<A>, ...L.Assert<B>]
  export type Popped<A> = A extends [] ? [] : A extends [...infer X, any] ? X : never
  export type Pop<A> = A extends [] ? undefined : A extends [...any[], infer X] ? X : never 
}
export namespace LS {
  export type ConcatAll<L> =
    L extends [] ? [] :
    L extends [infer H] ? H :
    L extends [infer H, ...infer T] ? `${S.Assert<H>}${S.Assert<ConcatAll<T>>}` :
    never
}

export namespace S {
  export type Assert<T> = A.Cast<T, A.String>
  export type IsLiteral<T> =
    T extends A.String
      ? A.String extends T
          ? false
          : true
      : false
}

export namespace U {
  export type Extract<T, U> = T extends U ? T : never
  export type Exclude<T, U> = T extends U ? never : T

  export type ToIntersection<U> =
    (U extends unknown ? (u: U) => void : never) extends (i: infer I) => void
      ? I
      : never

  export type Pop<U> =
    U.ToIntersection<U extends unknown ? () => U : never> extends () => infer U
      ? U
      : never

  export type RemoveDuplicated<U, UPop = U.Pop<U>> = 
    [U] extends [never] ? never :
    | RemoveDuplicated<
        U extends unknown 
          ? A.AreEqual<U, UPop> extends true ? never : U
          : never
      >
    | UPop
    
}

export namespace O {
  export type Value<T> = T[keyof T]
  export type ShallowClean<T> = { [K in keyof T]: T[K] } & unknown
  export type OmitKey<T, K extends keyof T> = { [P in U.Exclude<keyof T, K>]: T[P] }
  export type Spread<T, U> = T extends unknown ? O.ShallowClean<O.OmitKey<T, U.Extract<keyof U, keyof T>> & U> : never;
}

export namespace A {
  export type Cast<T, U> = T extends U ? T : U
  export type Tuple<T = unknown> = T[] | [T]
  export type Object = object
  export type String = string
  export type Function = (...args: never) => unknown

  export type InferNarrowest<T> =
    T extends any // T extends unknown doesnt work
      ? ( T extends A.Function ? T :
          T extends A.Object ? InferNarrowestObject<T> :
          T
        )
      : never
  
  export type InferNarrowestObject<T> =
    { readonly [K in keyof T]: InferNarrowest<T[K]> }

  export type AreEqual<A, B> =
    (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
      ? true
      : false

  export type DoesExtend<A, B> =
    A extends B ? true : false

  export type IsUnknown<T> =
    [T] extends [never]
      ? false
      : T extends unknown ? unknown extends T
          ? true
          : false : false

  export type IsPlainObject<T> =
    T extends A.Object
      ? T extends A.Function ? false :
        T extends A.Tuple ? false :
        true
      : false

  export type Get<T, P, F = undefined> =
    P extends keyof any
      ? Get<T, [P], F> :
    P extends [] ?
      T extends undefined ? F : T :
    P extends [infer K1, ...infer Kr] ?
      K1 extends keyof T ?
        Get<T[K1], Kr, F> :
      F :
    never

  export type CustomError<Error, Place> =
    Place extends (S.IsLiteral<Place> extends true ? Error : A.String)
      ? Place extends `${S.Assert<Error>} `
          ? Error
          : `${S.Assert<Error>} `
      : Error

  export type Instantiated<T> =
    T extends Uninstantiated<infer U> ? U : 
    T extends Builtin ? T :
    T extends unknown
      ? T extends A.Function
          ? T extends (...a: infer A1) => infer R1
              ? (...a1: Instantiated<A1>) => Instantiated<R1> :
            never :
        T extends A.Object
          ? { [K in keyof T]: Instantiated<T[K]> } :
        T
      : never

  type Builtin =
    | { [Symbol.toStringTag]: string }
    | Error
    | Date
    | RegExp
    | Generator

  export type Uninstantiated<T> = T & { [$$uninstantiated]: true }
  declare const $$uninstantiated: unique symbol

  export type Tag<N extends A.String> =
    { [_ in N]: void }

  export type SyncOrAsycnGenerator<T, R, N> =
    | Generator<T, R, N>
    | AsyncGenerator<T, R, N>

  export const test = (_o: true) => {}
  export const areEqual = <A, B>(_debug?: (value: A) => void) => undefined as any as A.AreEqual<A, B>
}
