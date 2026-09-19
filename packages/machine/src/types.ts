import { R } from "./extras"
import { IsFork } from "./is-fork"

export type CreateMachine =
  <D extends Machine.Definition<D, { isFork: IsFork }>>(definition: Machine.Definition.TypeParameter.Map<D, { isFork: IsFork }>) =>
    Machine.FromDefinition<D, { isFork: IsFork }>

export type CreateMachineImpl =
  (definition: Machine.Definition.Impl) => Machine.Impl

export const $$t = Symbol("$$t")
type $$t = typeof $$t
export type CreateType = <T>() => { [$$t]: T }

export type Machine<D, F> =
  Machine.State<D, F> extends infer State
    ? & A.Instantiated<
          { send: Machine.UninstantiatedSend<D, F>
          , subscribe: (f: () => void) => () => void
          }>
      & ( State extends unknown
          ? A.Instantiated<
              { state: State
              , context: Machine.ContextForState<D, F, State>
              , contextR: U.Reduce<Machine.ContextForState<D, F, State>>
              , sendT: Machine.UninstantiatedSendForState<D, F, State>
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

  export type FromDefinition<D, F> =
    Machine<
      (
        A.Get<F, ["isFork"]> extends true ? D :
        D extends { [Machine.Definition.TypeParameter.Identifier]?: infer X } ? X : D
      ),
      F
    >

  export type Definition<Self, F> =
    & Definition.StateNode<Self, F, []>
    & { schema?: Definition.Schema<Self, F, ["schema"]>
      , context?: unknown
      , [Machine.Definition.TypeParameter.Identifier]?: Self
      }

  interface DefinitionImp extends Machine.Definition.StateNode.Impl
    { schema?: { events?: R.Of<Event.Impl["type"], null> }
    , context: Machine.Context.Impl
    }

  export namespace Definition {
    export type Impl = DefinitionImp

    export namespace TypeParameter {
      export type Map<D, F> = 
        A.Get<F, ["isFork"], false> extends true ? D : A.IdentityObject<D> 

      export const Identifier = Symbol("$$typeParameter")
    }

    export type StateNode<D, F, P, Self = A.Get<D, P>> =
      & { on?: On<D, F, L.Concat<P, ["on"]>>
        , invoke?: Invoke<D, F, L.Concat<P, ["invoke"]>>
        }
      & ( { initial?: never, states?: never }
        | { initial: keyof A.Get<Self, ["states"]>
          , states:
              A.IsUnknown<A.Get<Self, ["states"]>> extends true
                ? A.CustomError<
                    "You have met a typescript bug, add a `_` event as in `{ on: { ..., _: undefined } }`. See typescript#64251 for more.",
                    A.Get<Self, ["states"]>
                  > :
              { [StateIdentifier in keyof A.Get<Self, ["states"]>]:
                  A.IsUnknown<A.Get<Self, ["states", StateIdentifier]>> extends true
                    ? A.CustomError<
                        "You have met a typescript bug, add a `_` event as in `{ on: { ..., _: undefined } }`. See typescript#64251 for more.",
                        A.Get<Self, ["states", StateIdentifier]>
                      > :
                  StateIdentifier extends A.String
                    ?  StateNode<D, F, L.Concat<P, ["states", StateIdentifier]>>
                    : A.CustomError<"Error: Only string identifiers allowed", A.Get<Self, ["states", StateIdentifier]>>
              }
          }
        )

    export type StateNodeAtTarget<D, F, Target> =
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
      D, F, P, Self = A.Get<D, P>,
      EventsSchema = A.Get<D, ["schema", "events"], {}>,
      EventTypeConstraint =
        A.Get<EventsSchema, [ExhaustiveIdentifier], false> extends true
          ? U.Exclude<keyof EventsSchema, ExhaustiveIdentifier>
          : A.String
    > =
      { [EventType in keyof Self]:
          EventType extends "_" ? undefined : // TODO: allow _ for forked
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
          Transition<D, F, L.Concat<P, [EventType]>>
      }
    
    type OnImpl = R.Of<U.Exclude<Event.Impl["type"], Machine.Definition.StartEventType | Machine.Definition.StopEventType>, Transition.Impl>
    export namespace On {
      export type Impl = OnImpl
    }

    export type Transition<D, F, P,
      Target = TargetFromStateNodePath<L.Popped<L.Popped<P>>>,
      State = StateForTarget<D, F, Target>,
      EventType = L.Pop<P>
    > =
      
      A.Get<F, ["isFork"]> extends true
        ? | Machine.Target<D, F>
          // TODO: support { target: string }    
          | ((parameter:
                { event: A.Instantiated<U.Extract<Machine.Event<D, F>, { [_ in Definition.Discriminator<D, F>]: EventType }>>
                , context: A.MapNeverToAny<A.Instantiated<Machine.ContextForState<D, F, State>>>
                // TODO: we want to preserve true nevers which occur when the node is a dead node
                , contextR: A.Instantiated<U.Reduce<Machine.ContextForState<D, F, State>>>
                }
                /*
                For some reason following result in circularity errors
                A.Instantiated<
                  { event: A.Uninstantiated<U.Extract<Machine.Event<D, F>, { [_ in Definition.Discriminator<D, F>]: EventType }>>
                  , context: A.Uninstantiated<Machine.ContextForTarget<D, F, State>>
                  }
                >
                */
              ) =>
              | undefined
              | Machine.Target<D, F>
              | { target: Machine.Target<D, F>, context?: unknown }
              | { target?: Machine.Target<D, F>, context: unknown }
            )
        : | (
              Machine.Target<D, F> extends infer T
                ? T extends unknown
                    ? ContextForState<D, F, State> extends U.ToIntersection<[ContextForState<D, F, StateForTarget<D, F ,T>>]>[0]
                      ? T
                      : never
                    : never
                : never
            )
          | (
              ( parameter:
                  { event: A.Instantiated<U.Extract<Machine.Event<D, F>, { [_ in Definition.Discriminator<D, F>]: EventType }>>
                  , context: A.MapNeverToAny<A.Instantiated<Machine.ContextForState<D, F, State>>>
                  , contextR: A.Instantiated<U.Reduce<Machine.ContextForState<D, F, State>>>
                  }
              ) =>
                Machine.Target<D, F> extends infer T
                  ? T extends unknown
                      ? | undefined
                        | { target: T, context: U.ToIntersection<[ContextForState<D, F, StateForTarget<D, F, T>>]>[0] }
                        | (T extends Target ? { target?: never, context: U.ToIntersection<[ContextForState<D, F, StateForTarget<D, F, T>>]>[0] } : never)
                      : never
                  : never
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

    export type ResolveTransition<D, F, Transition> =
      Transition extends (...a: never) => infer R ? ResolveTransition<D, F, R> :
      Transition extends A.String ? { target: ResolveTarget<D, F, Transition> } :
      Transition extends A.Object
        ? A.Get<Transition, ["target"]> extends undefined ? Transition :
          O.Spread<Transition, { target: ResolveTarget<D, F, A.Get<Transition, ["target"]>> }> :
      never

    export type ResolveTarget<D, F, Target> =
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

    export type Invoke<D, F, P, State = Machine.StateForTarget<D, F, Machine.TargetFromStateNodePath<L.Popped<P>>>> = 
      A.Get<F, ["isEffect"], false> extends false
        ? (
            ( parameter:
                A.Instantiated<
                  { event: A.Uninstantiated<Machine.EntryEventForTarget<D, F, State>>
                  , context: A.MapNeverToAny<Machine.ContextForState<D, F, State>>
                  , contextR: U.Reduce<Machine.ContextForState<D, F, State>>
                  , send: Machine.UninstantiatedSend<D, F>
                  , sendT: Machine.UninstantiatedSendForState<D, F, State>
                  }
                >
            ) =>
                | void 
                | (
                    ( cleanupParameter:
                        A.Instantiated<
                          { event: A.Uninstantiated<Machine.ExitEventForTarget<D, F, State>>
                          , context: A.MapNeverToAny<Machine.ContextForState<D, F, State>>
                          , contextR: U.Reduce<Machine.ContextForState<D, F, State>>
                          , send: A.Uninstantiated<Machine.Send<D, F>>
                          , sendT: A.Uninstantiated<Machine.SendForState<D, F, State>>
                          }
                        >
                    ) =>
                      void
                  )
          )
        : ( parameter:
              A.Instantiated<
                { event: A.Uninstantiated<Machine.EntryEventForTarget<D, F, State>>
                , context: A.Uninstantiated<A.MapNeverToAny<O.ShallowClean<Machine.ContextForState<D, F, State>>>>
                }
              >
          ) =>
            import("effect/Stream").Stream<
              void | O.ShallowClean<Machine.AcceptableEventForState<D, F, State>>,
              A.Get<F, ["isFork"]> extends true ? unknown : MachineEffect.Error<D, F>,
              A.Get<F, ["isFork"]> extends true ? unknown : MachineEffect.Requirement<D, F>
            >

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


    export type Schema<D, F, P, Self = A.Get<D, P>,
      EventsSchema = A.Get<Self, ["events"]>
    > =
      & { events?:
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
                        Definition.Discriminator<D, F> extends keyof Payload
                          ? A.CustomError<
                              LS.ConcatAll<
                                [ `Error: An event payload cannot have a property '${S.Assert<Definition.Discriminator<D, F>>}' as it's already defined. `
                                , `In this case as '${S.Assert<Type>}'`
                                ]>,
                              A.Get<EventsSchema, [Type]>
                            > :
                          A.Get<EventsSchema, [Type]>
                      : never
                  : never
            }
        , context?: 
            { [St in Machine.State<D, F>]?:
                { [$$t]: (_: A.Get<F, ["isFork"]> extends true ? Machine.InferContextForState<D, F, St> : never) => void }
                // TODO: some basic custom errors to guide user to use t and also in a contravariant way 
            }
        }
      & ( A.Get<F, ["isEffect"], false> extends false ? unknown :
          { error?: { [$$t]: (_: A.Get<F, ["isFork"]> extends true ? MachineEffect.Error<D, F> : never) => void }
          , requirement?: { [$$t]: (_: A.Get<F, ["isFork"]> extends true ? MachineEffect.Requirement<D, F> : never) => void }
          }
        )


    export type ExhaustiveIdentifier = "$$exhaustive" & unknown
    export type StartEventType = "$$start"
    export type StopEventType = "$$stop"

    export type Discriminator<D, F> =
      A.Get<F, ["isEffect"], false> extends false ? "type" : "_tag"
  }

  export type State<D, F> =
    ComputeStateOrTarget<D, "", "State">

  type ComputeStateOrTarget<StateNode, ParentState, Mode extends "Target" | "State"> =
    | ("Target" extends Mode ? ParentState : never)
    | ( [keyof A.Get<StateNode, ["states"]>] extends [never]
          ? ParentState
          : O.Value<{
              [St in keyof A.Get<StateNode, ["states"]>]:
                ComputeStateOrTarget<A.Get<StateNode, ["states", St]>, ParentState extends "" ? St : `${S.Assert<ParentState>}.${S.Assert<St>}`, Mode>
            }>
      )
  export type InitialState<D, F> =
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

  export type StateForTarget<D, F, T> =
    U.Extract<Machine.State<D, F>, `${S.Assert<T>}${string}`>

  type StateImpl = Machine.Target.Impl & A.Tag<"Machine.State">
  export namespace State {
    export type Impl = StateImpl
  }

  export type Target<D, F> = 
    ComputeStateOrTarget<D, "", "Target">

  type TargetImpl = string & A.Tag<"Machine.Target">
  export namespace Target {
    export type Impl = TargetImpl
  }

  export type ContextForState<D, F, S> =
    S extends unknown
      ? ( A.Get<D, ["schema", "context", S, $$t]> extends undefined
            ? (_: A.Get<F, ["isFork"]> extends true ? InferContextForState<D, F, S> : A.Get<D, ["context"]>) => void 
            : A.Get<D, ["schema", "context", S, $$t]>
        ) extends (_: infer X) => unknown
          ? X
          : never
      : never

  export type InferContextForState<D, F, S, VisitedNode = never> =
    U.RemoveDuplicate<
      | ( Machine.Target<D, F> extends infer T
            ? T extends unknown
              ? Machine.Definition.StateNodeAtTarget<D, F, T> extends infer StateNode
                  ? keyof A.Get<StateNode, ["on"], {}> extends infer E
                      ? E extends unknown
                          ? `${S.Assert<T>}-${S.Assert<E>}` extends VisitedNode ? never :
                            Machine.Definition.ResolveTransition<D, F, A.Get<StateNode, ["on", E]>> extends infer Transition
                              ? Transition extends unknown
                                  ? S extends `${S.Assert<A.Get<Transition, ["target"], Machine.Definition.ResolveTarget<D, F, T>>>}${string}`
                                    // TODO: fallbacking to Machine.Definition.ResolveTarget<D, F, T> is not "correct" but that's the best we can do
                                      ? A.Get<Transition, ["context"]> extends infer C
                                          ? ( C extends undefined
                                                ? InferContextForState<D, F, StateForTarget<D, F, T>, VisitedNode | `${S.Assert<T>}-${S.Assert<E>}`>
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
      | (Machine.InitialState<D, F> extends S ? A.Get<D, ["context"]> : never)
    >

  type ContextImpl = ({} & A.Tag<"Machine.Context">)
  export namespace Context {
    export type Impl = ContextImpl
  }

  export type Event<D, F, EventsSchema = A.Get<D, ["schema", "events"], {}>> = 
    | O.Value<{ [T in U.Exclude<keyof EventsSchema, Definition.ExhaustiveIdentifier>]:
        A.Get<EventsSchema, [T, $$t]> extends infer P
          ? P extends unknown ? O.ShallowClean<{ [_ in Definition.Discriminator<D, F>]: T } & P> : never
          : never
      }>
    | ( A.Get<EventsSchema, [Definition.ExhaustiveIdentifier], false> extends true ? never :
        ( O.Value<
            { [St in Machine.Target<D, F>]:
                U.Exclude<keyof A.Get<Machine.Definition.StateNodeAtTarget<D, F, St>, ["on"], {}>, "_"> // TODO: support _ in fork
            }
          > extends infer EventType
            ? EventType extends unknown ? { [_ in Definition.Discriminator<D, F>]: EventType } : never
            : never
        ) extends infer InferredEvent
          ? InferredEvent extends unknown
              ? A.Get<InferredEvent, [Definition.Discriminator<D, F>]> extends keyof EventsSchema ? never :
                A.Get<InferredEvent, [Definition.Discriminator<D, F>]> extends Definition.ExhaustiveIdentifier ? never :
                A.Get<InferredEvent, [Definition.Discriminator<D, F>]> extends Definition.StartEventType ? never :
                A.Get<InferredEvent, [Definition.Discriminator<D, F>]> extends Definition.StopEventType ? never :
                InferredEvent
              : never
          : never
      )
    | { [_ in Definition.Discriminator<D, F>]: Definition.StartEventType }
    | { [_ in Definition.Discriminator<D, F>]: Definition.StopEventType }
    
  type EventImpl = { type: (string & A.Tag<"Machine.Event['type']">) | "$$start" | "$$stop" }
  export namespace Event {
    export type Impl = EventImpl
  }

  export type EntryEventForTarget<D, F, Target> =
    A.Get<F, ["isFork"]> extends false ? Event<D, F> :
    | ( InitialState<D, F> extends `${S.Assert<Target>}${string}`
          ? { [_ in Definition.Discriminator<D, F>]: Definition.StartEventType }
          : never
      )
    | U.Extract<
        Event<D, F>,
        { [_ in Definition.Discriminator<D, F>]:
            O.Value<{
              [T in Machine.Target<D, F>]:
                Machine.Definition.StateNodeAtTarget<D, F, T> extends infer StateNode
                  ? O.Value<{
                      [E in keyof A.Get<StateNode, ["on"]>]:
                        Machine.Definition.ResolveTransition<D, F, A.Get<StateNode, ["on", E]>> extends infer Transition
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

  export type ExitEventForTarget<D, F, Target> =
    A.Get<F, ["isFork"]> extends false ? Event<D, F> :
    | { [_ in Definition.Discriminator<D, F>]: Definition.StopEventType }
    | U.Extract<
      Event<D, F>,
      { [_ in Definition.Discriminator<D, F>]:
        O.Value<{
          [T in Machine.Target<D, F>]:
            Machine.Definition.StateNodeAtTarget<D, F, T> extends infer StateNode
              ? O.Value<{
                  [E in keyof A.Get<StateNode, ["on"]>]:
                    Machine.Definition.ResolveTransition<D, F, A.Get<StateNode, ["on", E]>> extends infer Transition
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
  
  export type AcceptableEventForState<D, F, State> =
    A.Get<F, ["isFork"]> extends false ? Event<D, F> :
    U.Extract<
      Event<D, F>,
      { [_ in Definition.Discriminator<D, F>]:
        O.Value<{
          [T in Machine.Target<D, F>]:
            State extends `${S.Assert<T>}${string}`
              ? keyof A.Get<Machine.Definition.StateNodeAtTarget<D, F, T>, ["on"], {}>
              : never
        }>
      }
    >

  export type Send<D, F> =
    (event: Event<D, F>) => void

  export type UninstantiatedSend<D, F> =
    (event: A.Uninstantiated<Event<D, F>>) => void

  export type SendForState<D, F, State> = 
    (event: AcceptableEventForState<D, F, State>) => void

  export type UninstantiatedSendForState<D, F, State> = 
    (event: A.Uninstantiated<AcceptableEventForState<D, F, State>>) => void

  type SendImpl = (event: Machine.Event.Impl) => void
  export namespace Send {
    export type Impl = SendImpl
  }
}


export type CreateMachineEffect =
  <D extends Machine.Definition<D, { isEffect: true, isFork: IsFork }>>(definition: Machine.Definition.TypeParameter.Map<D, { isEffect: true, isFork: IsFork }>) =>
    MachineEffect.FromDefinition<D, { isEffect: true, isFork: IsFork }>

export type CreateMachineEffectImpl =
  (definition: MachineEffect.Definition.Impl) => MachineEffect.Impl

export type MachineEffect<D, F> =
  import("effect/Effect").Effect<
    { state:
        import("effect/Stream").Stream<
          Machine.State<D, F> extends infer State
            ? State extends unknown
                ? A.Instantiated<
                    { _tag: State
                    , context: A.Uninstantiated<O.ShallowClean<Machine.ContextForState<D, F, State>>>
                    }
                  >
                : never
            : never
        , never
        , never
        >
    , send: MachineEffect.Send<D, F>
    }
  , MachineEffect.Error<D, F>
  , MachineEffect.Requirement<D, F>
  >

interface MachineEffectImpl
  { state: import("effect/Stream").Stream<{ _tag: MachineEffect.State.Impl, context: MachineEffect.Context.Impl }>
  , send: MachineEffect.Send.Impl
  }

namespace MachineEffect {
  export type Impl = MachineEffectImpl

  export type FromDefinition<D, F> =
    MachineEffect<
      (
        A.Get<F, ["isFork"]> extends true ? D :
        D extends { [Machine.Definition.TypeParameter.Identifier]?: infer X } ? X : D
      ),
      F
    >
  
  export namespace Definition {
    export type Impl = {} & A.Tag<"MachineEffect.Definition">
  }

  export type Event<D, F> =
    U.Exclude<
      Machine.Event<D, F>,
      { [_ in Machine.Definition.Discriminator<D, F>]: Machine.Definition.StartEventType | Machine.Definition.StopEventType }
    >
  
  type EventImpl = { _tag: (string & A.Tag<"MachineEffect.Event['_tag']">) }
  export namespace Event {
    export type Impl = EventImpl
  }

  export type Send<D, F> =
    (event: Event<D, F>) =>
      import("effect/Effect").Effect<void, MachineEffect.Error<D, F>, MachineEffect.Requirement<D, F>>

  type SendImpl =
    (event: MachineEffect.Event.Impl) =>
      import("effect/Effect").Effect<void, MachineEffect.Error.Impl, MachineEffect.Requirement.Impl>
  export namespace Send {
    export type Impl = SendImpl
  }

  export type Error<D, F> =
    A.Get<F, ["isFork"]> extends true ? ErrorFromStateNode<D> :
    ( A.Get<D, ["schema", "error", $$t], (_: never) => void> extends (x: infer X) => void
        ? X
        : never
    )
    

  type ErrorFromStateNode<StateNode> =
    | (A.Get<StateNode, ["invoke"]> extends (...a: never) => import("effect/Stream").Stream<unknown, infer E, unknown> ? E : never)
    | O.Value<{ [S in keyof A.Get<StateNode, ["states"], {}>]: ErrorFromStateNode<A.Get<StateNode, ["states", S]>> }>

  type ErrorImpl = {} & A.Tag<"MachineEffect.Error">
  export namespace Error {
    export type Impl = ErrorImpl
  }

  export type Requirement<D, F> =
    A.Get<F, ["isFork"]> extends true ? RequirementFromStateNode<D> :
    ( A.Get<D, ["schema", "requirement", $$t], (_: never) => void> extends (x: infer X) => void
        ? X
        : never
    )

  type RequirementFromStateNode<StateNode> =
    | (A.Get<StateNode, ["invoke"]> extends (...a: never) => import("effect/Stream").Stream<unknown, unknown, infer R> ? R : never)
    | O.Value<{ [S in keyof A.Get<StateNode, ["states"], {}>]: RequirementFromStateNode<A.Get<StateNode, ["states", S]>> }>

  type RequirementImpl = {} & A.Tag<"MachineEffect.Requirement">
  export namespace Requirement {
    export type Impl = RequirementImpl
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

  export type Identity<T> =
    T extends any // T extends unknown doesnt work
      ? ( T extends A.Function ? T :
          T extends A.Object ? IdentityObject<T> :
          T extends A.String ? T & string :
          T
        )
      : never
  
  export type IdentityObject<T> =
    { readonly [K in keyof T]: Identity<T[K]> }

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
