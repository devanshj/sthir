import { CreateMachineEffect, CreateType } from "../../src/types";
import { Effect, Schedule, Stream, Console, Context, Data } from "effect";

const createMachine = (() => {}) as unknown as CreateMachineEffect
const t = (() => {}) as unknown as CreateType

test("smoke", () => {
  const machine = createMachine({
    initial: "counting",
    context: { count: 0 },
    states: {
      counting: {
        on: {
          INCREMENT: ({ context }) => ({ context: { ...context, count: context.count + 1 } }),
          TIMEUP: () => ({ target: "grading" }),
        },
        invoke: () => Stream.make({ _tag: "TIMEUP" }).pipe(Stream.schedule(Schedule.fixed("1 second")))
      },
      grading: {
        on: {
          SET_GRADE: ({ event, context }) => ({ target: "graded", context: { ...context, grade: event.grade } }),
        },
        invoke: ({ context }) => Stream.fromEffect(
          Effect.gen(function* () {
            const user = yield* CurrentUser
            yield* Console.log(`${user.nickname} counted till ${context.count}!`)
            const grade = yield* calculateGrade(context.count)
            return { _tag: "SET_GRADE", grade: grade }
          })
        )
      },
      graded: {}
    },
    schema: {
      events: {
        SET_GRADE: t<{  grade: string }>()
      }
    }
  })

  class CurrentUser extends Context.Service<CurrentUser, { nickname: string }>()("User") {}
  class ErrorBotDetected extends Data.TaggedError("ErrorBotDetected") {}
  const calculateGrade = (count: number) =>
    count > 20 ? Effect.fail(new ErrorBotDetected()) :
    Effect.succeed(count > 10 ? "Amazing" : count > 5 ? "Good" : "Needs improvement")

  const runMachine = Effect.gen(function*() {
    yield* machine.send({ _tag: "$$start" })
    yield* machine.send({ _tag: "INCREMENT" })
    yield* machine.send({ _tag: "INCREMENT" })
    yield* Effect.sleep("1 second")
    yield* machine.send({ _tag: "INCREMENT" }); // no effect because of timeup

    const finalState = (yield* machine.state.pipe(
      Stream.filter(state => state._tag === "graded"),
      Stream.take(1),
      Stream.runCollect
    ))[0]!

    const grade = finalState.context.grade
    yield* Console.log(`Grade: ${grade}`)
    return grade
  })

})