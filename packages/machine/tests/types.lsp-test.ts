/* eslint-disable react-hooks/rules-of-hooks */
import { machine } from "node:os";
import { A, LS, CreateMachine, CreateType } from "../src/types";

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

      expect(query().text).toContain("Error: '$$exhaustive' is a reserved name")

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

  describe("Machine.Definition.Effect", () => {
    it("(placeholder)", () => {})

    createMachine({
      initial: "a",
      states: {
        a: {
          effect: function (effectParameter) {

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
            X: "b",
          }
        },
        b: {
          on: {
            Y: "a"
          },
          effect: function (effectParameter) {

            describe("Machine.EntryEventForStateValue", () => {
              effectParameter.event?.type

              A.test(A.areEqual<
                typeof effectParameter.event,
                | { type: "X", foo: number }
              >())
            })

            A.test(A.areEqual<
              typeof effectParameter.context,
              { foo: number }
            >())

            return function* (cleanupParameter) {
              describe("Machine.ExitEventForStateValue", () => {
                A.test(A.areEqual<
                  typeof cleanupParameter.event,
                  | { type: "Y", bar?: number }
                  | { type: "$$stop" }
                >())
              })
              

              A.test(A.areEqual<
                typeof cleanupParameter.context,
                { foo: number }  
              >())
            }
          }
        },
        c: {
          on: {},
          // @ts-expect-error
          effect: () => { return "foo" }
        }
      }
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
              // @ts-expect-error
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

      expect(query().completions).toStrictEqual(["a", "b", "c"])
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

      expect(query().completions).toStrictEqual(["a", "b", "c"])
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
          ( sendable:
            | { type: "X", foo: number }
            | { type: "Y", bar?: number }
            | "Y"
            | "$$start"
            | { type: "$$start" }
            | "$$stop"
            | { type: "$$stop" }
          ) => void
      , subscribe: (f: () => void) => () => void
      }
    & ( { state: "a"
        , context: { foo: number }
        }
      | { state: "b"
        , context: { foo: number }
        }
      )
  >())
})

describe("A.Instantiated", () => {
  it("does not instantiate builtin objects", () => {
    let _x: A.Instantiated<Date> = new Date()
    _x;
//  ^?
    expect(query().text).toContain("Date")
  })

  it("does not instantiate context", () => {
    interface Something { foo: string }
    let _machine = createMachine({
    //     ^?
      context: { foo: "" } as Something,
      initial: "a",
      states: { a: {} }
    })
    _machine;

    expect(query().text).toContain("Something")
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
  createMachine({
    initial: "editing",
    context: { body: "" },
    states: {
      editing: {
        on: {
          UPDATE_BODY: ({ event }) => ({ context: { body: event.body, test: true } }),
          SUBMIT: ({ context }) => {
            if (!isNonEmptyString(context.body)) return
            return { target: "posting", context: { body: context.body } }
          }
        }
      },
      posting: {
        on: {
          POST_SUCCESS: ({ event }) => ({ target: "posted", context: { id: event.id } }),
          POST_ERROR: ({ event }) => ({ target: "editing", context: { body: "", id: undefined, error: event.error } })
        },
        effect: function ({ context, send }) {
          A.test(A.areEqual<typeof context, { body: NonEmptyString } | { body: NonEmptyString, test: boolean }>())

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

  type NonEmptyString = `${string & {}}${string}`
  const isNonEmptyString = (x: string): x is NonEmptyString => x !== ""

  const postComment = async (comment: { body: NonEmptyString }) => {
    return { id: "whatever" }
  }
})
