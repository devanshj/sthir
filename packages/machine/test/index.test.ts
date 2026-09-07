import { createMachine } from "../src";

it("smoke", () => {
  const log: string[] = [];
  const machine = createMachine({
    initial: "a",
    context: { count: 0 },
    states: {
      a: {
        initial: "a1",
        invoke: ({ event }) => {
          log.push(`enter a via ${event.type}`);
          return ({ event }) => {
            log.push(`exit a via ${event.type}`);
          };
        },
        on: {
          NEXT: "b",
        },
        states: {
          a1: {
            invoke: ({ event }) => {
              log.push(`enter a.a1 via ${event.type}`);
              return ({ event }) => {
                log.push(`exit a.a1 via ${event.type}`);
              };
            },
            on: {
              TOGGLE: "a.a2",
            },
          },
          a2: {
            invoke: ({ event }) => {
              log.push(`enter a.a2 via ${event.type}`);
              return ({ event }) => {
                log.push(`exit a.a2 via ${event.type}`);
              };
            },
            on: {
              TOGGLE: "a.a1",
            },
          },
        },
      },
      b: {
        initial: "b1",
        invoke: ({ event }) => {
          log.push(`enter b via ${event.type}`);
          return ({ event }) => {
            log.push(`exit b via ${event.type}`);
          };
        },
        on: {
          INCREMENT: ({ context }) => ({ context: { ...context, count: context.count + 1 } }),
          BACK: "a",
        },
        states: {
          b1: {
            invoke: ({ event }) => {
              log.push(`enter b.b1 via ${event.type}`);
              return ({ event }) => {
                log.push(`exit b.b1 via ${event.type}`);
              };
            },
            on: {
              DEEP: "b.b2",
            },
          },
          b2: {
            invoke: ({ event }) => {
              log.push(`enter b.b2 via ${event.type}`);
              return ({ event }) => {
                log.push(`exit b.b2 via ${event.type}`);
              };
            },
          },
        },
      },
    },
  });

  expect(machine.state).toBe("a.a1");
  expect(log).toEqual([]);

  machine.send({ type: "NEXT" });
  expect(machine.state).toBe("a.a1");
  expect(log).toEqual([]);

  machine.send({ type: "$$start" });
  expect(machine.state).toBe("a.a1");
  expect(machine.context).toEqual({ count: 0 });
  expect(log).toEqual([
    "enter a via $$start",
    "enter a.a1 via $$start",
  ]);

  machine.send({ type: "TOGGLE" });
  expect(machine.state).toBe("a.a2");
  expect(machine.context).toEqual({ count: 0 });
  expect(log).toEqual([
    "enter a via $$start",
    "enter a.a1 via $$start",
    "exit a.a1 via TOGGLE",
    "enter a.a2 via TOGGLE",
  ]);

  machine.send({ type: "NEXT" });
  expect(machine.state).toBe("b.b1");
  expect(machine.context).toEqual({ count: 0 });
  expect(log).toEqual([
    "enter a via $$start",
    "enter a.a1 via $$start",
    "exit a.a1 via TOGGLE",
    "enter a.a2 via TOGGLE",
    "exit a.a2 via NEXT",
    "exit a via NEXT",
    "enter b via NEXT",
    "enter b.b1 via NEXT",
  ]);

  machine.send({ type: "INCREMENT" });
  expect(machine.state).toBe("b.b1");
  expect(machine.context).toEqual({ count: 1 });
  expect(log).toEqual([
    "enter a via $$start",
    "enter a.a1 via $$start",
    "exit a.a1 via TOGGLE",
    "enter a.a2 via TOGGLE",
    "exit a.a2 via NEXT",
    "exit a via NEXT",
    "enter b via NEXT",
    "enter b.b1 via NEXT",
  ]);

  machine.send({ type: "DEEP" });
  expect(machine.state).toBe("b.b2");
  expect(machine.context).toEqual({ count: 1 });
  expect(log).toEqual([
    "enter a via $$start",
    "enter a.a1 via $$start",
    "exit a.a1 via TOGGLE",
    "enter a.a2 via TOGGLE",
    "exit a.a2 via NEXT",
    "exit a via NEXT",
    "enter b via NEXT",
    "enter b.b1 via NEXT",
    "exit b.b1 via DEEP",
    "enter b.b2 via DEEP",
  ]);

  machine.send({ type: "BACK" });
  expect(machine.state).toBe("a.a1");
  expect(machine.context).toEqual({ count: 1 });
  expect(log).toEqual([
    "enter a via $$start",
    "enter a.a1 via $$start",
    "exit a.a1 via TOGGLE",
    "enter a.a2 via TOGGLE",
    "exit a.a2 via NEXT",
    "exit a via NEXT",
    "enter b via NEXT",
    "enter b.b1 via NEXT",
    "exit b.b1 via DEEP",
    "enter b.b2 via DEEP",
    "exit b.b2 via BACK",
    "exit b via BACK",
    "enter a via BACK",
    "enter a.a1 via BACK",
  ]);

  machine.send({ type: "$$stop" });
  expect(log).toEqual([
    "enter a via $$start",
    "enter a.a1 via $$start",
    "exit a.a1 via TOGGLE",
    "enter a.a2 via TOGGLE",
    "exit a.a2 via NEXT",
    "exit a via NEXT",
    "enter b via NEXT",
    "enter b.b1 via NEXT",
    "exit b.b1 via DEEP",
    "enter b.b2 via DEEP",
    "exit b.b2 via BACK",
    "exit b via BACK",
    "enter a via BACK",
    "enter a.a1 via BACK",
    "exit a.a1 via $$stop",
    "exit a via $$stop",
  ]);
});
