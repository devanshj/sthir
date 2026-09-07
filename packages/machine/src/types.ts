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
          { send: Machine.UninstantiatedSend<D>
          , subscribe: (f: () => void) => () => void
          }>
      & ( State extends unknown
          ? A.Instantiated<
              { state: State
              , context: Machine.ContextForState<D, State>
              , contextR: U.Reduce<Machine.ContextForState<D, State>>
              , sendT: Machine.UninstantiatedSendForState<D, State>
              }>
          : never
        )
    : never

interface MachineImpl
  { state: Machine.State.Impl
  , context: Machine.Context.Impl
  , contextR: Machine.Context.Impl
  , send: Machine.Send.Impl
  , sendT: Machine.Send.Impl
  , subscribe: (f: () => void) => () => void
  }

export namespace Machine {
  export type Impl = MachineImpl

  export type Definition<Self> =
    & Definition.StateNode<Self, []>
    & { schema?: Definition.Schema<Self, ["schema"]>
      , context?: unknown
      }

  interface DefinitionImp extends Machine.Definition.StateNode.Impl
    { schema?: { events?: R.Of<Event.Impl["type"], null> }
    , context: Machine.Context.Impl
    }

  export namespace Definition {
    export type Impl = DefinitionImp

    export type StateNode<D, P, Self = A.Get<D, P>> =
      & { on?: On<D, L.Concat<P, ["on"]>>
        , invoke?: Invoke<D, L.Concat<P, ["invoke"]>>
        }
      & ( { initial?: never, states?: never }
        | { initial: keyof A.Get<Self, ["states"]>
          , states:
              { [StateIdentifier in keyof A.Get<Self, ["states"]>]:
                  StateIdentifier extends A.String
                    ? StateNode<D, L.Concat<P, ["states", StateIdentifier]>>
                    : A.CustomError<"Error: Only string identifiers allowed", A.Get<Self, ["states", StateIdentifier]>>
              }
          }
        )

    export type StateNodeAtTarget<D, Target> =
      A.Get<D,
        Target extends "" ? [] :
        S.Split<`states.${S.Assert<S.Replace<Target, ".", ".states.">>}`, ".">
      >

    type StateNodeImpl =
      { on?: On.Impl
      , invoke?: Invoke.Impl
      , initial?: string & A.Tag<"Machine.Definition.StateNode.Impl['initial']">
      , states?: R.Of<NonNullable<StateNodeImpl["initial"]>, StateNodeImpl>
      }
    export namespace StateNode {
      export type Impl = StateNodeImpl
    }

    export type On<
      D, P, Self = A.Get<D, P>,
      EventsSchema = A.Get<D, ["schema", "events"], {}>,
      EventTypeConstraint =
        A.Get<EventsSchema, [ExhaustiveIdentifier], false> extends true
          ? U.Exclude<keyof EventsSchema, ExhaustiveIdentifier>
          : A.String
    > =
      { [EventType in keyof Self]:
          A.DoesExtend<EventType, A.String> extends false
            ? A.CustomError<"Error: only string types allowed", A.Get<Self, [EventType]>> :
          EventType extends ExhaustiveIdentifier
            ? A.CustomError<
                `Error: '${ExhaustiveIdentifier}' is a reserved name`,
                A.Get<Self, [EventType]>
              > :
          EventType extends StartEventType
            ? A.CustomError<
                `Error: '${StartEventType}' is a reserved type`,
                A.Get<Self, [EventType]>
              > :
          A.DoesExtend<EventType, EventTypeConstraint> extends false
            ? A.CustomError<
                LS.ConcatAll<
                  [ `Error: Event type '${S.Assert<EventType>}' is not found in schema.events `
                  , "which is marked as exhaustive"
                  ]>,
                A.Get<Self, [EventType]>
              > :
          Transition<D, L.Concat<P, [EventType]>>
      }
    
    type OnImpl = R.Of<U.Exclude<Event.Impl["type"], Machine.Definition.StartEventType | Machine.Definition.StopEventType>, Transition.Impl>
    export namespace On {
      export type Impl = OnImpl
    }

    export type Transition<D, P,
      State = StateForTarget<D, TargetFromStateNodePath<L.Popped<L.Popped<P>>>>,
      EventType = L.Pop<P>
    > =
      | Machine.Target<D>
      | ((parameter:
            { event: A.Instantiated<U.Extract<Machine.Event<D>, { type: EventType }>>
            , context: A.MapNeverToAny<A.Instantiated<Machine.ContextForState<D, State>>>
            // TODO: we want to preserve true nevers which occur when the node is a dead node
            , contextR: A.Instantiated<U.Reduce<Machine.ContextForState<D, State>>>
            }
            /*
            For some reason following result in circularity errors
            A.Instantiated<
              { event: A.Uninstantiated<U.Extract<Machine.Event<D>, { type: EventType }>>
              , context: A.Uninstantiated<Machine.ContextForTarget<D, State>>
              }
            >
            */
          ) =>
          | undefined
          | Machine.Target<D>
          | { target: Machine.Target<D>, context?: unknown }
          | { target?: Machine.Target<D>, context: unknown }
        )

    type TransitionImpl =
        | Machine.Target.Impl
        | (
            (parameter: { event: Machine.Event.Impl, context: Machine.Context.Impl, contextR: Machine.Context.Impl }) =>
              | undefined
              | Machine.Target.Impl
              | { target?: Machine.Target.Impl, context?: Machine.Context.Impl }
          )

    export namespace Transition {
      export type Impl = TransitionImpl
    }

    export type ResolveTransition<D, Transition> =
      Transition extends (...a: never) => infer R ? ResolveTransition<D, R> :
      Transition extends A.String ? { target: ResolveTarget<D, Transition> } :
      Transition extends A.Object
        ? A.Get<Transition, ["target"]> extends undefined ? Transition :
          O.Spread<Transition, { target: ResolveTarget<D, A.Get<Transition, ["target"]>> }> :
      never

    export type ResolveTarget<D, Target> =
      ResolveTargetFromStateNode<
        A.Get<
          D,
          Target extends ""
            ? []
            : S.Split<
                `states.${S.Assert<S.Replace<Target, ".", ".states.">>}`,
                "."
              >
        >,
        Target
      >

    type ResolveTargetFromStateNode<StateNode, Target> =
      A.Get<StateNode, ["initial"]> extends undefined
        ? Target
        : ResolveTargetFromStateNode<
            A.Get<StateNode, ["states", A.Get<StateNode, ["initial"]>]>,
            Target extends ""
              ? A.Get<StateNode, ["initial"]>
              : `${S.Assert<Target>}.${S.Assert<A.Get<StateNode, ["initial"]>>}`
          >

    export type Invoke<D, P, State = Machine.StateForTarget<D, Machine.TargetFromStateNodePath<L.Popped<P>>>> = 
      ( parameter:
          A.Instantiated<
            { event: A.Uninstantiated<Machine.EntryEventForTarget<D, State>>
            , context: A.MapNeverToAny<Machine.ContextForState<D, State>>
            , contextR: U.Reduce<Machine.ContextForState<D, State>>
            , send: Machine.UninstantiatedSend<D>
            , sendT: Machine.UninstantiatedSendForState<D, State>
            }
          >
      ) =>
          | void 
          | (
              ( cleanupParameter:
                  A.Instantiated<
                    { event: A.Uninstantiated<Machine.ExitEventForTarget<D, State>>
                    , context: A.MapNeverToAny<Machine.ContextForState<D, State>>
                    , contextR: U.Reduce<Machine.ContextForState<D, State>>
                    , send: A.Uninstantiated<Machine.Send<D>>
                    , sendT: A.Uninstantiated<Machine.SendForState<D, State>>
                    }
                  >
              ) =>
                void
            )

    type InvokeImpl =
      ( parameter:
          { event: Machine.Event.Impl
          , context: Machine.Context.Impl
          , contextR: Machine.Context.Impl
          , send: Machine.Send.Impl
          , sendT: Machine.Send.Impl
          }
      ) =>
        | void
        | (
            ( cleanupParameter: 
                { event: Machine.Event.Impl
                , context: Machine.Context.Impl
                , contextR: Machine.Context.Impl
                , send: Machine.Send.Impl
                , sendT: Machine.Send.Impl
                }
            ) =>
              void
          )

    export namespace Invoke {
      export type Impl = InvokeImpl  
    }


    export type Schema<D, P, Self = A.Get<D, P>,
      EventsSchema = A.Get<Self, ["events"]>
    > =
      { events?:
          { [Type in keyof EventsSchema]:
              Type extends Definition.ExhaustiveIdentifier
                ? boolean :
              Type extends Definition.StartEventType
                ? A.CustomError<
                    `Error: '${Definition.StartEventType}' is a reserved type`,
                    A.Get<EventsSchema, [Type]>
                  > :
              A.DoesExtend<Type, A.String> extends false
                ? A.CustomError<
                    "Error: Only string types allowed",
                    A.Get<EventsSchema, [Type]>
                  > :
              A.Get<EventsSchema, [Type]> extends infer PayloadWrapped
                ? A.DoesExtend<PayloadWrapped, { [$$t]: unknown }> extends false
                    ? A.CustomError<
                        "Error: Use `t` to define payload type, eg `t<{ foo: number }>()`",
                        A.Get<EventsSchema, [Type]>
                      > :
                  A.Get<PayloadWrapped, [$$t]> extends infer Payload
                    ? A.IsPlainObject<Payload> extends false
                        ? A.CustomError<
                            "Error: An event payload should be an object, eg `t<{ foo: number }>()`",
                            A.Get<EventsSchema, [Type]>
                          > :
                      "type" extends keyof Payload
                        ? A.CustomError<
                            LS.ConcatAll<
                              [ "Error: An event payload cannot have a property `type` as it's already defined. "
                              , `In this case as '${S.Assert<Type>}'`
                              ]>,
                            A.Get<EventsSchema, [Type]>
                          > :
                        A.Get<EventsSchema, [Type]>
                    : never
                : never
          }
      , context?: 
          { [S in Machine.State<D>]?:
              { [$$t]: (_: Machine.InferContextForState<D, S>) => void }
              // TODO: some basic custom errors to guide user to use t and also in a contravariant way 
          }
      }

    export type ExhaustiveIdentifier = "$$exhaustive" & unknown
    export type StartEventType = "$$start"
    export type StopEventType = "$$stop"
  }

  export type State<D> =
    ComputeStateOrTarget<D, "", "State">

  type ComputeStateOrTarget<StateNode, ParentState, Flags extends "Target" | "State"> =
    | ("Target" extends Flags ? ParentState : never)
    | ( [keyof A.Get<StateNode, ["states"]>] extends [never]
          ? ParentState
          : O.Value<{
              [S in keyof A.Get<StateNode, ["states"]>]:
                ComputeStateOrTarget<A.Get<StateNode, ["states", S]>, ParentState extends "" ? S : `${S.Assert<ParentState>}.${S.Assert<S>}`, Flags>
            }>
      )
  export type InitialState<D> =
    ComputeInitialState<D, "">

  type ComputeInitialState<StateNode, ParentState> =
    A.Get<StateNode, ["initial"]> extends undefined
      ? ParentState
      : ComputeInitialState<
          A.Get<StateNode, ["states", A.Get<StateNode, ["initial"]>]>,
          ParentState extends "" ? A.Get<StateNode, ["initial"]> : `${S.Assert<ParentState>}.${S.Assert<A.Get<StateNode, ["initial"]>>}`
        >

  export type TargetFromStateNodePath<P> =
    P extends [] ? "" :
    P extends ["states", ...infer X] ? S.Replace<LS.Join<X, ".">, ".states.", "."> :
    never

  export type StateForTarget<D, T> =
    U.Extract<Machine.State<D>, `${S.Assert<T>}${string}`>

  type StateImpl = Machine.Target.Impl & A.Tag<"Machine.State">
  export namespace State {
    export type Impl = StateImpl
  }

  export type Target<D> = 
    ComputeStateOrTarget<D, "", "Target">

  type TargetImpl = string & A.Tag<"Machine.Target">
  export namespace Target {
    export type Impl = TargetImpl
  }

  export type ContextForState<D, S> =
    S extends unknown
      ? ( A.Get<D, ["schema", "context", S, $$t]> extends undefined
            ? (_: InferContextForState<D, S>) => void 
            : A.Get<D, ["schema", "context", S, $$t]>
        ) extends (_: infer X) => unknown
          ? X
          : never
      : never

  export type InferContextForState<D, S, VisitedNode = never> =
    U.RemoveDuplicate<
      | ( Machine.Target<D> extends infer T
            ? T extends unknown
              ? Machine.Definition.StateNodeAtTarget<D, T> extends infer StateNode
                  ? keyof A.Get<StateNode, ["on"], {}> extends infer E
                      ? E extends unknown
                          ? `${S.Assert<T>}-${S.Assert<E>}` extends VisitedNode ? never :
                            Machine.Definition.ResolveTransition<D, A.Get<StateNode, ["on", E]>> extends infer Transition
                              ? Transition extends unknown
                                  ? S extends `${S.Assert<A.Get<Transition, ["target"], Machine.Definition.ResolveTarget<D, T>>>}${string}`
                                    // TODO: fallbacking to Machine.Definition.ResolveTarget<D, T> is not "correct" but that's the best we can do
                                      ? A.Get<Transition, ["context"]> extends infer C
                                          ? ( C extends undefined
                                                ? InferContextForState<D, StateForTarget<D, T>, VisitedNode | `${S.Assert<T>}-${S.Assert<E>}`>
                                                : C
                                            ) extends infer C
                                              ? A.IsAny<C> extends true ? never : C
                                              : never
                                          : never
                                      : never
                                  : never
                              : never
                          : never
                      : never
                  : never
              : never
            : never
        )
      | (Machine.InitialState<D> extends S ? A.Get<D, ["context"]> : never)
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
    | ( A.Get<EventsSchema, [Definition.ExhaustiveIdentifier], false> extends true ? never :
        ( O.Value<
            { [S in Machine.Target<D>]:
                keyof A.Get<Machine.Definition.StateNodeAtTarget<D, S>, ["on"], {}>
            }
          > extends infer EventType
            ? EventType extends unknown ? { type: EventType } : never
            : never
        ) extends infer InferredEvent
          ? InferredEvent extends unknown
              ? A.Get<InferredEvent, ["type"]> extends keyof EventsSchema ? never :
                A.Get<InferredEvent, ["type"]> extends Definition.ExhaustiveIdentifier ? never :
                A.Get<InferredEvent, ["type"]> extends Definition.StartEventType ? never :
                A.Get<InferredEvent, ["type"]> extends Definition.StopEventType ? never :
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

  export type EntryEventForTarget<D, Target> =
    | ( InitialState<D> extends `${S.Assert<Target>}${string}`
          ? { type: Definition.StartEventType }
          : never
      )
    | U.Extract<
        Event<D>,
        { type:
            O.Value<{
              [T in Machine.Target<D>]:
                Machine.Definition.StateNodeAtTarget<D, T> extends infer StateNode
                  ? O.Value<{
                      [E in keyof A.Get<StateNode, ["on"]>]:
                        Machine.Definition.ResolveTransition<D, A.Get<StateNode, ["on", E]>> extends infer Transition
                          ? Transition extends unknown
                              ? A.Get<Transition, ["target"]> extends `${S.Assert<Target>}${string}`
                                  ? E
                                  : never
                              : never
                          : never
                    }>
                  : never
            }>
        }
      >

  export type ExitEventForTarget<D, Target> =
    | { type: Definition.StopEventType }
    | U.Extract<
      Event<D>,
      { type:
        O.Value<{
          [T in Machine.Target<D>]:
            Machine.Definition.StateNodeAtTarget<D, T> extends infer StateNode
              ? O.Value<{
                  [E in keyof A.Get<StateNode, ["on"]>]:
                    Machine.Definition.ResolveTransition<D, A.Get<StateNode, ["on", E]>> extends infer Transition
                      ? Transition extends unknown
                          ? A.Get<Transition, ["target"]> extends `${S.Assert<Target>}${string}` | undefined
                              ? never
                              : E
                          : never
                      : never
                }>
              : never
        }>
      }
    >
  
  export type AcceptableEventForState<D, State> =
    U.Extract<
      Event<D>,
      { type:
        O.Value<{
          [T in Machine.Target<D>]:
            State extends `${S.Assert<T>}${string}`
              ? keyof A.Get<Machine.Definition.StateNodeAtTarget<D, T>, ["on"], {}>
              : never
        }>
      }
    >

  export type Send<D> =
    (event: Event<D>) => void

  export type UninstantiatedSend<D> =
    (event: A.Uninstantiated<Event<D>>) => void

  export type SendForState<D, State> = 
    (event: AcceptableEventForState<D, State>) => void

  export type UninstantiatedSendForState<D, State> = 
    (event: A.Uninstantiated<AcceptableEventForState<D, State>>) => void

  type SendImpl = (event: Machine.Event.Impl) => void
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

  export type Join<L, D> =
    L extends [] ? "" :
    L extends [infer H, ...infer T]
      ? T extends [] ? H : `${S.Assert<H>}${S.Assert<D>}${Join<T, D>}` :
    never;
}

export namespace S {
  export type Assert<T> = A.Cast<T, A.String>
  
  export type IsLiteral<T> =
    T extends A.String
      ? A.String extends T
          ? false
          : true
      : false
  
  export type Split<S, D> =
    S extends `${infer H}${S.Assert<D>}${infer T}` ? [H, ...Split<T, D>] : [S]

  export type Replace<S, What, With> =
    S extends `${infer P}${S.Assert<What>}${infer S}`
      ? `${P}${S.Assert<With>}${Replace<S, What, With>}`
      : S;

  export type DoesInclude<S, X> =
    S extends `${string}${S.Assert<X>}${string}` ? true : false
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

  export type Popped<U> =
    U.Exclude<U, U.Pop<U>>

  export type RemoveDuplicate<U, UPop = U.Pop<U>> = 
    [U] extends [never] ? never :
    | RemoveDuplicate<
        U extends unknown 
          ? A.AreEqual<U, UPop> extends true ? never : U
          : never
      >
    | UPop

  export type Reduce<U, UPop = U.Pop<U>, UPopped = U.Popped<U>> = 
    [U] extends [never] ? never : 
    | Reduce<UPopped>
    | (UPop extends UPopped ? never : UPop)
    
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
          T extends A.String ? T & string :
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
    T extends undefined
      ? F :
    P extends []
      ? T extends undefined ? F : T :
    P extends [infer K1, ...infer Kr]
      ? K1 extends keyof T
          ? Get<T[K1], Kr, F>
          : F :
    never

  export type CustomError<Error, Place> =
    Place extends (S.IsLiteral<Place> extends true ? Error : A.String)
      ? Place extends `${S.Assert<Error>} `
          ? Error
          : `${S.Assert<Error>} `
      : Error

  export type Instantiated<T, Visited = never> =
    T extends Visited ? T : 
    T extends Uninstantiated<infer U> ? U : 
    T extends Builtin ? T :
    T extends unknown
      ? T extends A.Function
          ? T extends (...a: infer A1) => infer R1
              ? (...a1: Instantiated<A1, Visited | T>) => Instantiated<R1, Visited | T> :
            never :
        T extends Primitive
          ? T :
        T extends A.Object
          ? { [K in keyof T]: Instantiated<T[K], Visited | T> } :
        T
      : never

  type Primitive =
    string | number | bigint | boolean | symbol | null | undefined

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

  export type IsAny<T> =
    0 extends (1 & T) ? true : false

  export type MapNeverToAny<T> =
    [T] extends [never] ? any : T
    
  export const test = (_o: true) => {}
  export const areEqual = <A, B>(_debug?: (value: A) => void) => undefined as any as A.AreEqual<A, B>
}
