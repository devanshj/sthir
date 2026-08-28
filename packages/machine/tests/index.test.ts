import { createMachine } from "../src";

it("smoke", () => {
  const log: string[] = [];
  const machine = createMachine({
    initial: "a",
    context: { count: 0 },
    states: {
      a: {
        effect: ({ event }) => {
          log.push(`enter a via ${event.type}`);
          return ({ event }) => {
            log.push(`exit a via ${event.type}`);
          };
        },
        on: {
          NEXT: "b",
        },
      },
      b: {
        effect: ({ event }) => {
          log.push(`enter b via ${event.type}`);
          return ({ event }) => {
            log.push(`exit b via ${event.type}`);
          };
        },
        on: {
          INCREMENT: ({ context }) => ({ context: { count: context.count + 1 } }),
          BACK: "a",
        },
      },
    },
  });

  expect(machine.state).toBe("a");
  expect(log).toEqual([]);

  machine.send("NEXT");
  expect(machine.state).toBe("a");
  expect(log).toEqual([]);

  machine.send("$$start");
  expect(machine.state).toBe("a");
  expect(machine.context).toEqual({ count: 0 });
  expect(log).toEqual(["enter a via $$start"]);

  machine.send("NEXT");
  expect(machine.state).toBe("b");
  expect(machine.context).toEqual({ count: 0 });
  expect(log).toEqual([
    "enter a via $$start",
    "exit a via NEXT",
    "enter b via NEXT",
  ]);

  machine.send("INCREMENT");
  expect(machine.state).toBe("b");
  expect(machine.context).toEqual({ count: 1 });
  expect(log).toEqual([
    "enter a via $$start",
    "exit a via NEXT",
    "enter b via NEXT",
  ]);

  machine.send("BACK");
  expect(machine.state).toBe("a");
  expect(machine.context).toEqual({ count: 1 });
  expect(log).toEqual([
    "enter a via $$start",
    "exit a via NEXT",
    "enter b via NEXT",
    "exit b via BACK",
    "enter a via BACK",
  ]);

  machine.send("$$stop");
  expect(log).toEqual([
    "enter a via $$start",
    "exit a via NEXT",
    "enter b via NEXT",
    "exit b via BACK",
    "enter a via BACK",
    "exit a via $$stop",
  ]);
});
