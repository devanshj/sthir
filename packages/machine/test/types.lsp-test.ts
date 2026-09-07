/* eslint-disable react-hooks/rules-of-hooks */
import { A, CreateMachine, CreateType } from "../src/types";

const createMachine = (() => []) as any as CreateMachine;
const t = (() => undefined) as unknown as CreateType

describe("Machine.Definition", () => {

  describe("Machine.Definition['initial']", () => {
    it("expects one of the child state identifiers", () => {
      createMachine({
        initial: "a",
        states: {
          a: {},
          b: {}
        }
      })

      createMachine({
        // @ts-expect-error
        initial: "",
        states: {
          a: {},
          b: {}
        }
      })
    })

    it("shows child state identifiers as completions", () => {
      createMachine({
        // @ts-expect-error
        initial: "  ",
        //         ^|
        states: {
          a: {},
          b: {}
        }
      })

      expect(query().completions).toStrictEqual(["a", "b"])
    })
  }) 

  describe("Machine.Definition['states']", () => {
    it("expects only strings as key", () => {
      createMachine({
        initial: "a",
        states: {
          a: {}
        }
      })

      createMachine({
        initial: 1,
        states: {
          // @ts-expect-error
          1: {}
        }
      })
    })
  
    it("shows custom error in case of identifiers other than string", () => {
      createMachine({
        initial: 1,
        states: {
          // @ts-expect-error
          1: {}
      //  ^?
        }
      })
      expect(query().text).toContain(`"Error: Only string identifiers allowed"`)

      createMachine({
        initial: 1,
        states: {
          // @ts-expect-error
          1: "Error: Only string identifiers allowed"
        }
      })
    })
  })

  describe("Machine.Definition['schema']", () => {
    it("is optional", () => {
      createMachine({
        initial: "a",
        states: { a: {} }
      })
    })

    describe("MachineDefinition['schema']['events']", () => {
      it("is optional", () => {
        createMachine({
          schema: {},
          initial: "a",
          states: { a: {} }
        })
      })

      it("expects event payload type be created from t", () => {
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: {}
            }
          },
          initial: "a",
          states: { a: {} }
        })
      })

      it("shows custom error when event payload type is not created from t", () => {
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: {}
          //  ^?
            }
          },
          initial: "a",
          states: { a: {} }
        })

        expect(query().text).toContain("Error: Use `t` to define payload type, eg `t<{ foo: number }>()`")

        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: "Error: Use `t` to define payload type, eg `t<{ foo: number }>()`"
            }
          },
          initial: "a",
          states: { a: {} }
        })
      })

      it("expects event payload to extend an object", () => {
        createMachine({
          schema: {
            events: {
              X: t<{ foo: number }>()
            }
          },
          initial: "a",
          states: { a: {} }
        })

        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: t<1>()
            }
          }
        })

        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: t<"FOO">()
            }
          }
        })
      })

      it("shows custom error in case of event payload not extending an object", () => {
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: t<"FOO">()
          //  ^?
            }
          }
        })
        expect(query().text).toContain("Error: An event payload should be an object, eg `t<{ foo: number }>()`")

        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: t<"Error: An event payload should be an object, eg `t<{ foo: number }>()`">()
            }
          }
        })
      })

      it("expects event payload to not have `type` property", () => {
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: t<{ type: number }>()
            }
          },
          initial: "a",
          states: { a: {} }
        })
      })

      it("shows custom error when event payload has a `type` property", () => {
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: t<{ type: number, foo: string }>()
          //  ^?
            }
          },
          initial: "a",
          states: { a: {} }
        })

        expect(query().text).toContain(
          "Error: An event payload cannot have a property `type` as it's already defined. In this case as 'X'"
        )

        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              X: t<
                "Error: An event payload cannot have a property `type` as it's already defined. In this case as 'X'"
              >()
            }
          },
          initial: "a",
          states: { a: {} }
        })
      })

      it("expects $$exhaustive to be a boolean", () => {
        createMachine({
          schema: {
            events: {
              $$exhaustive: true
            }
          },
          initial: "a",
          states: { a: {} }
        })

        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              $$exhaustive: 1
            }
          },
          initial: "a",
          states: { a: {} }
        })
      })

      it("expects $$start to not be a type", () => {
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              $$start: t<{}>()
            }
          },
          initial: "a",
          states: { a: {} }
        })
      })
      
      it("shows custom error in case of $$start as a type", () => {
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              $$start: t<{}>()
              // ^?
            }
          },
          initial: "a",
          states: { a: {} }
        })
  
        expect(query().text).toContain("Error: '$$start' is a reserved type")
  
        createMachine({
          schema: {
            events: {
              // @ts-expect-error
              $$initial: "Error: '$$start' is a reserved type"
            }
          },
          initial: "a",
          states: { a: {} }
        })
      })
    })
  })

  describe("Machine.Definition['context']", () => {
    it("doesn't infer narrowest", () => {
      let machine = createMachine({
        schema: {},
        context: { foo: "hello" },
        initial: "a",
        states: { a: {} }
      })
      A.test(A.areEqual<typeof machine.context.foo, string>())
    })
  })

  describe("Machine.Definition.On", () => {
    it("expects only strings as key", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              X: "a"
            }
          }
        },
        on: {
          Y: "a"
        }
      })

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              // @ts-expect-error
              1: "a"
            }
          }
        }
      })
    })
  
    it("shows custom error in case of identifiers other than string", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              // @ts-expect-error
              1: "a"
          //  ^?
            }
          }
        }
      })
      expect(query().text).toContain(`"Error: only string types allowed"`)

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              // @ts-expect-error
              1: "Error: only string types allowed"
            }
          }
        }
      })
    })

    it("expects $$exhaustive to not be a key", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              //@ts-expect-error
              $$exhaustive: "a"
            }
          }
        }
      })
    })
    
    it("shows custom error in case of $$exhaustive as a key", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              // @ts-expect-error
              $$exhaustive: "a"
              // ^?
            }
          }
        }
      })

      expect(query().text).toContain("Error: '$$exhaustive' is a reserved name")

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              // @ts-expect-error
              $$exhaustive: "Error: '$$exhaustive' is a reserved name"
            }
          }
        }
      })

      createMachine({
        initial: "a",
        states: {
          a: {}
        }
      })

      createMachine({
        initial: "a",
        states: {
          a: {}
        }
      })
    })

    it("honours schema.event", () => {
      createMachine({
        schema: {
          events: {
            $$exhaustive: true,
            X: t<{}>(),
            Y: t<{}>()
          }
        },
        initial: "a",
        states: {
          a: {
            on: {
              X: "a",
              Y: "a",
              // @ts-expect-error
              Z: "a"
            }
          }
        }
      })
      
      createMachine({
        schema: {
          events: {
            $$exhaustive: false,
            X: t<{}>(),
            Y: t<{}>()
          }
        },
        initial: "a",
        states: {
          a: {
            on: {
              Z: "a"
            }
          }
        },
        on: {
          Z: "a"
        }
      })

      createMachine({
        schema: {
          events: {
            X: t<{}>(),
            Y: t<{}>()
          }
        },
        initial: "a",
        states: {
          a: {
            on: {
              Z: "a"
            }
          }
        },
        on: {
          Z: "a"
        }
      })
    })

    it("shows custom error in case of violation of schema.events", () => {
      createMachine({
        schema: {
          events: {
            $$exhaustive: true,
            X: t<{}>(),
            Y: t<{}>()
          }
        },
        initial: "a",
        states: {
          a: {
            on: {
              X: "a",
              Y: "a",
              // @ts-expect-error
              Z: "a"
          //  ^?
            }
          }
        }
      })
      expect(query().text).toContain(
        "Error: Event type 'Z' is not found in schema.events which is marked as exhaustive"
      )

      createMachine({
        schema: {
          events: {
            $$exhaustive: true,
            X: t<{}>(),
            Y: t<{}>()
          }
        },
        initial: "a",
        states: {
          a: {
            on: {
              X: "a",
              Y: "a",
              // @ts-expect-error
              Z: "Error: Event type 'Z' is not found in schema.events which is marked as exhaustive"
            }
          }
        }
      })
    })
  })

  describe("Machine.Definition.Invoke", () => {
    it("(placeholder)", () => {})

    createMachine({
      initial: "a",
      states: {
        a: {
          invoke: function (invokeParameter) {

          }
        }
      },
      on: {
        X: "a"
      }
    })

    createMachine({
      schema: {
        events: {
          X: t<{ foo: number }>(),
          Y: t<{ bar?: number }>(),
          Z: t<{ baz: string }>()
        }
      },
      context: { foo: 0 },
      initial: "a",
      states: {
        a: {
          on: {
            X: "b.b1",
          }
        },
        b: {
          initial: "b1",
          states: {
            b1: {
              invoke: ({ event }) => {
                describe("Machine.EntryEventForState", () => {
                  A.test(A.areEqual<
                    typeof event,
                    | { type: "X", foo: number }
                    | { type: "Z", baz: string }
                  >())
                })
              }
            },
            b2: {
            }
          },
          on: {
            Y: "b.b2",
            Z: "b",
            W: "a"
          },
          invoke: ({ event, context }) => {
            describe("Machine.EntryEventForState", () => {
              A.test(A.areEqual<
                typeof event,
                | { type: "X", foo: number }
                | { type: "Z", baz: string }
                | { type: "Y"; bar?: number; }
              >())
            })

            A.test(A.areEqual<
              typeof context,
              { foo: number }
            >())

            return function* ({ event, context }) {
              describe("Machine.ExitEventForState", () => {
                A.test(A.areEqual<
                  typeof event,
                  | { type: "W" }
                  | { type: "$$stop" }
                >())
              })
              

              A.test(A.areEqual<
                typeof context,
                { foo: number }  
              >())
            }
          }
        },
        c: {
          on: {},
          // @ts-expect-error
          invoke: () => { return "foo" }
        }
      }
    })

    it("Machine.EntryEventForState for heirarchical states", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {
                on: {
                  X: "b.b2"
                },
                invoke: ({ event }) => {
                  A.test(A.areEqual<typeof event, { type: "Y" } | { type: "$$start" }>())
                }
              },
              a2: {}
            }
          },
          b: {
            initial: "b1",
            states: {
              b1: {
                on: {
                  Y: "a"
                }
              },
              b2: {
                invoke: ({ event }) => {
                  A.test(A.areEqual<typeof event, { type: "X" }>())
                }
              }
            },
            invoke: ({ event }) => {
              A.test(A.areEqual<typeof event, { type: "X" }>())
            }
          }
        },
        invoke: ({ event }) => {
          A.test(A.areEqual<typeof event, { type: "X" } | { type: "Y" } | { type: "$$start" }>())
        }
      })
    })
  })

  describe("Machine.Definition.Transition", () => {
    it("expects target string", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              X: "b"
            }
          },
          b: {},
          c: {}
        }
      })

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              X: ""
            }
          },
          b: {},
          c: {}
        }
      })
    })

    it("shows completions for target string", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              // @ts-expect-error
              X: "  "
              //   ^|
            }
          },
          b: {},
          c: {}
        }
      })

      expect(query().completions).toStrictEqual(["", "a", "b", "c"])
    })

    it("expects transition function", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              X: parameter => {
                return { target: "a" }
              },
              // @ts-expect-error
              Y: parameter => {
                return { target: "  " }
                //                 ^|
              }
            }
          },
          b: {},
          c: {}
        }
      })

      expect(query().completions).toStrictEqual(["", "a", "b", "c"])
    })

    it("supports hierarchical target states", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              X: "",
              Y: "b.b1",
              Z: () => ({ target: "b.b2" })
            }
          },
          b: {
            initial: "b1",
            states: {
              b1: {},
              b2: {}
            }
          }
        }
      })
    })

    it("shows completions for hierarchical target states", () => {
      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              // @ts-expect-error
              X: "  "
              //   ^|
            }
          },
          b: {
            initial: "b1",
            states: {
              b1: {},
              b2: {}
            }
          }
        }
      })

      expect(query().completions).toStrictEqual(["", "a", "b", "b.b1", "b.b2"])
    })
  })
})

describe("Machine", () => {
  it("(placeholder)", () => {})

  let machine = createMachine({
    schema: {
      events: {
        X: t<{ foo: number }>(),
        Y: t<{ bar?: number }>()
      }
    },
    context: { foo: 0 },
    initial: "a",
    states: {
      a: {
        on: {
          X: "b",
        }
      },
      b: {
        on: {
          Y: "a"
        }
      }
    }
  })

  A.test(A.areEqual<
    typeof machine,
    & { send:
          ( event:
            | { type: "X", foo: number }
            | { type: "Y", bar?: number }
            | { type: "$$start" }
            | { type: "$$stop" }
          ) => void
      , subscribe: (f: () => void) => () => void
      }
    & ( { state: "a"
        , context: { foo: number }
        , contextR: { foo: number }
        , sendT: (event: { type: "X", foo: number }) => void
        }
      | { state: "b"
        , context: { foo: number }
        , contextR: { foo: number }
        , sendT: (event: { type: "Y", bar?: number }) => void
        }
      )
  >())

  describe("Machine.State", () => {
    it("works", () => {
      let machine = createMachine({
        initial: "a",
        states: {
          a: {},
          b: {
            initial: "b1",
            states: {
              b1: {},
              b2: {}
            }
          }
        }
      })
      A.test(A.areEqual<typeof machine.state, "a" | "b.b1" | "b.b2">())
    })
  })
})

describe("A.Instantiated", () => {
  it("does not instantiate builtin objects", () => {
    let _x: A.Instantiated<Date> = new Date()
    _x;
//  ^?
    expect(query().text).toContain("Date")
  })


  it("does not instantiate event payloads deeply", () => {
    interface Something { foo: string }
    let _machine = createMachine({
    //     ^?
      schema: {
        events: { A: t<{ bar: Something }>() }
      },
      initial: "a",
      states: { a: { on: { A: "a" } } }
    })
    _machine;

    expect(query().text).toContain("Something")
  })
})


test("comment machine", () => {
  const machine = createMachine({
    initial: "editing",
    context: { body: "" },
    states: {
      editing: {
        on: {
          UPDATE_BODY: ({ event, context }) => ({ context: { ...context, body: event.body, test: true } }),
          SUBMIT: ({ context }) => {
            if (!isNonEmptyString(context.body)) return
            return { target: "posting", context: { ...context, body: context.body } }
          }
        }
      },
      posting: {
        on: {
          POST_SUCCESS: ({ event, context }) => ({ target: "posted", context: { ...context, id: event.id } }),
          POST_ERROR: ({ event }) => ({ target: "editing", context: { body: "", error: event.error } }) // TODO can't spread context here
        },
        invoke: ({ context, contextR, send }) => {
          A.test(A.areEqual<
            typeof context,
            | { body: `${string & {}}${string}` }
            | { test: boolean, body: `${string & {}}${string}` }
            | { test: boolean
              , body: `${string & {}}${string}`
              , error: string
              }
            | { body: `${string & {}}${string}`
              , error: string
              }
          >())
          A.test(A.areEqual<typeof contextR, { body: NonEmptyString }>())

          postComment({ body: context.body })
          .then(({ id }) => {
            send({ type: "POST_SUCCESS", id })
          })
          .catch(error => {
            send({ type: "POST_ERROR", error: error instanceof Error ? error.message : "Something went wrong" })
          })
        }
      },
      posted: {}
    },
    schema: {
      events: {
        UPDATE_BODY: t<{ body: string }>(),
        POST_SUCCESS: t<{ id: string }>(),
        POST_ERROR: t<{ error: string }>()
      }
    },
  })

  switch (machine.state) {
    case "editing": {
      A.test(A.areEqual<
        typeof machine.context,
        | { body: string }
        | { body: string, test: boolean }
        | { body: string, test: boolean, error: string }
        | { body: string, error: string }
      >())
      A.test(A.areEqual<typeof machine.contextR, { body: string }>())
      break
    }
    case "posting": {
      A.test(A.areEqual<
        typeof machine.context,
        | { body: `${string & {}}${string}` }
        | { test: boolean, body: `${string & {}}${string}` }
        | { test: boolean
          , body: `${string & {}}${string}`
          , error: string
          }
        | { body: `${string & {}}${string}`
          , error: string
          }
      >())
      A.test(A.areEqual<typeof machine.contextR, { body: NonEmptyString }>())
      break
    }
    case "posted": {
      A.test(A.areEqual<
        typeof machine.context,
        | { body: `${string & {}}${string}`, id: string }
        | { test: boolean, body: `${string & {}}${string}`, id: string }
        | { test: boolean
          , body: `${string & {}}${string}`
          , id: string
          , error: string
          }
        | { body: `${string & {}}${string}`
          , id: string
          , error: string
          }
      >())
      A.test(A.areEqual<typeof machine.contextR, { body: NonEmptyString, id: string }>())
      break
    }
  }

  type NonEmptyString = `${string & {}}${string}`
  const isNonEmptyString = (x: string): x is NonEmptyString => x !== ""

  const postComment = async (comment: { body: NonEmptyString }) => {
    return { id: "whatever" }
  }
})

test("flight booking machine", () => {
  const machine = createMachine({
    initial: "scheduling",
    context: {
      departDate: getToday(),
      returnDate: getTomorrow(),
    },
    states: {
      scheduling: {
        initial: "oneway",
        on: {
          UPDATE_DEPART_DATE: ({ event, context }) => ({ context: { ...context, departDate: event.value } }),
          UPDATE_RETURN_DATE: ({ event, context }) => ({ context: { ...context, returnDate: event.value } }),
        },
        states: {
          oneway: {
            on: {
              TOGGLE_TRIP_TYPE: "scheduling.roundtrip",
              BOOK: ({ context }) => {
                if (!isDepartDate(context.departDate)) return
                return {
                  target: "booking",
                  context: {
                    ...context,
                    tripType: "oneway" as const,
                    departDate: context.departDate
                  }
                }
              }
            }
          },
          roundtrip: {
            on: {
              TOGGLE_TRIP_TYPE: "scheduling.oneway",
              BOOK: ({ context }) => {
                if (!isDepartDate(context.departDate)) return
                if (!isReturnDate(context.departDate, context.returnDate)) return
                return {
                  target: "booking",
                  context: {
                    ...context,
                    tripType: "roundtrip" as const,
                    departDate: context.departDate,
                    returnDate: context.returnDate,
                  }
                }
              }
            }
          }
        }
      },
      booking: {
        invoke: ({ context, send }) => {
          book(context)
          .then(({ ticketNumber }) => send({ type: "BOOK_SUCCESS", ticketNumber }))
          .catch(() => send({ type: "BOOK_ERROR", error: "Something went wrong" }))
        },
        on: {
          BOOK_SUCCESS: ({ event, context }) => ({ target: "booked", context: { ...context, ticketNumber: event.ticketNumber } }),
          BOOK_ERROR: ({ event, context: { tripType, ...context } }) => ({ target: "scheduling", context: { ...context, error: event.error } })
        }
      },
      booked: {}
    },
    schema: {
      events: {
        UPDATE_DEPART_DATE: t<{ value: Date }>(),
        UPDATE_RETURN_DATE: t<{ value: Date }>(),
        BOOK_SUCCESS: t<{ ticketNumber: string }>(),
        BOOK_ERROR: t<{ error: string }>()
      },
      context: {
        booking: t<(_:
          | { tripType: "oneway", departDate: DepartDate, returnDate: Date }
          | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate }
        ) => void>(),
      }
    }
  })

  switch (machine.state) {
    case "scheduling.oneway": {
      A.test(A.areEqual<
        typeof machine.context,
        | { departDate: Date, returnDate: Date }
        | { departDate: Date, returnDate: Date, error: string }
        | { departDate: Date, returnDate: ReturnDate, error: string }
        | { departDate: DepartDate, returnDate: Date, error: string }
        | { departDate: DepartDate, returnDate: ReturnDate, error: string }
      >())
      A.test(A.areEqual<typeof machine.contextR, { departDate: Date, returnDate: Date }>())
      A.test(A.areEqual<
        typeof machine.sendT,
        ( event:
            | { type: "BOOK" }
            | { type: "TOGGLE_TRIP_TYPE" }
            | { type: "UPDATE_DEPART_DATE", value: Date }
            | { type: "UPDATE_RETURN_DATE", value: Date }
        ) => void
      >())
      break
    }
    case "scheduling.roundtrip": {
      A.test(A.areEqual<
        typeof machine.context,
        | { departDate: Date, returnDate: Date }
        | { departDate: Date, returnDate: Date, error: string }
        | { departDate: Date, returnDate: ReturnDate, error: string }
        | { departDate: DepartDate, returnDate: Date, error: string }
        | { departDate: DepartDate, returnDate: ReturnDate, error: string }
      >())
      A.test(A.areEqual<typeof machine.contextR, { departDate: Date, returnDate: Date }>())
      A.test(A.areEqual<
        typeof machine.sendT,
        ( event:
            | { type: "BOOK" }
            | { type: "TOGGLE_TRIP_TYPE" }
            | { type: "UPDATE_DEPART_DATE", value: Date }
            | { type: "UPDATE_RETURN_DATE", value: Date }
        ) => void
      >())
      break
    }
    case "booking": {
      A.test(A.areEqual<
        typeof machine.context,
        | { tripType: "oneway", departDate: DepartDate, returnDate: Date }
        | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate }
      >())
      A.test(A.areEqual<
        typeof machine.contextR,
        | { tripType: "oneway", departDate: DepartDate, returnDate: Date }
        | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate }
      >())
      A.test(A.areEqual<
        typeof machine.sendT,
        ( event:
            | { type: "BOOK_ERROR", error: string }
            | { type: "BOOK_SUCCESS", ticketNumber: string }
        ) => void
      >())
      break
    }
    case "booked": {
      A.test(A.areEqual<
        typeof machine.context,
        | { tripType: "oneway", departDate: DepartDate, returnDate: Date, ticketNumber: string }
        | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate, ticketNumber: string }
      >())
      A.test(A.areEqual<
        typeof machine.contextR,
        | { tripType: "oneway", departDate: DepartDate, returnDate: Date, ticketNumber: string }
        | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate, ticketNumber: string }
      >())
      A.test(A.areEqual<typeof machine.sendT, (event: never) => void>())
      break
    }
  }

  type DepartDate = Date & { readonly DepartDate: unique symbol }
  type ReturnDate = Date & { readonly ReturnDate: unique symbol }

  const isDepartDate = (departDate: Date): departDate is DepartDate =>
    departDate.getTime() >= getToday().getTime()

  const isReturnDate = (
    departDate: DepartDate,
    returnDate: Date
  ): returnDate is ReturnDate => returnDate.getTime() > departDate.getTime()

  type Booking =
    | { tripType: "oneway", departDate: DepartDate }
    | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate }

  const book = async (booking: Booking) => {
    return { ticketNumber: "whatever" }
  }

  function getToday(){
    const x = new Date()
    x.setHours(0, 0, 0, 0)
    return x
  }

  function getTomorrow() {
    const x = new Date()
    x.setDate(x.getDate() + 1)
    return x
  }
})

test("flight booking machine with explosive LOL", () => {
  const machine = createMachine({
    initial: "scheduling",
    context: {
      departDate: getToday(),
      returnDate: getTomorrow(),
    },
    states: {
      scheduling: {
        initial: "oneway",
        on: {
          UPDATE_DEPART_DATE: ({ event, context }) => ({ context: { ...context, departDate: event.value } }),
          UPDATE_RETURN_DATE: ({ event, context }) => ({ context: { ...context, returnDate: event.value } }),
        },
        states: {
          oneway: {
            on: {
              TOGGLE_TRIP_TYPE: "scheduling.roundtrip",
              BOOK: ({ context }) => {
                if (!isDepartDate(context.departDate)) return
                return {
                  target: "booking",
                  context: {
                    ...context,
                    tripType: "oneway" as const,
                    departDate: context.departDate
                  }
                }
              }
            }
          },
          roundtrip: {
            on: {
              TOGGLE_TRIP_TYPE: "scheduling.oneway",
              BOOK: ({ context }) => {
                if (!isDepartDate(context.departDate)) return
                if (!isReturnDate(context.departDate, context.returnDate)) return
                return {
                  target: "booking",
                  context: {
                    ...context,
                    tripType: "roundtrip" as const,
                    departDate: context.departDate,
                    returnDate: context.returnDate,
                  }
                }
              }
            }
          }
        }
      },
      booking: {
        invoke: ({ context, send }) => {
          book(context)
          .then(({ ticketNumber }) => send({ type: "BOOK_SUCCESS", ticketNumber }))
          .catch(() => send({ type: "BOOK_ERROR", error: "something went wrong" }))
        },
        on: {
          BOOK_SUCCESS: ({ event, context }) => ({ target: "booked", context: { ...context, ticketNumber: event.ticketNumber } }),
          BOOK_ERROR: ({ event, context: { tripType, ...context } }) => ({ target: "scheduling", context: { ...context, error: event.error } })
        }
      },
      booked: {}
    },
    on: { 
      LOL: ({ context }) => ({ context: { ...context, lol: true } })
    },
    schema: {
      events: {
        UPDATE_DEPART_DATE: t<{ value: Date }>(),
        UPDATE_RETURN_DATE: t<{ value: Date }>(),
        BOOK_SUCCESS: t<{ ticketNumber: string }>(),
        BOOK_ERROR: t<{ error: string }>()
      },
      context: {
        "scheduling.oneway": t<(_:
          { departDate: Date, returnDate: Date, lol?: boolean, error?: string }
        ) => void>(),
        "scheduling.roundtrip": t<(_:
          { departDate: Date, returnDate: Date, lol?: boolean, error?: string }
        ) => void>(),
        booking: t<(_:
          | { tripType: "oneway", departDate: DepartDate, returnDate: Date, lol?: boolean }
          | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate, lol?: boolean  }
        ) => void>(),
        booked: t<(_:
          | { tripType: "oneway", departDate: DepartDate, returnDate: Date, ticketNumber: string, lol?: boolean }
          | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate, ticketNumber: string, lol?: boolean }
        ) => void>(),
      }
    }
  })

  type DepartDate = Date & { readonly DepartDate: unique symbol }
  type ReturnDate = Date & { readonly ReturnDate: unique symbol }

  const isDepartDate = (departDate: Date): departDate is DepartDate =>
    departDate.getTime() >= getToday().getTime()

  const isReturnDate = (
    departDate: DepartDate,
    returnDate: Date
  ): returnDate is ReturnDate => returnDate.getTime() > departDate.getTime()

  type Booking =
    | { tripType: "oneway", departDate: DepartDate }
    | { tripType: "roundtrip", departDate: DepartDate, returnDate: ReturnDate }

  const book = async (booking: Booking) => {
    return { ticketNumber: "whatever" }
  }

  function getToday(){
    const x = new Date()
    x.setHours(0, 0, 0, 0)
    return x
  }

  function getTomorrow() {
    const x = new Date()
    x.setDate(x.getDate() + 1)
    return x
  }
})
