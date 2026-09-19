# `@sthir/machine`

## Example usage

```ts
import { createMachine, t } from "@sthir/machine"

const machine = createMachine({
  initial: "editing",
  context: { body: "" },
  states: {
    editing: {
      on: {
        UPDATE_BODY: ({ event, context }) => ({ context: { ...context, body: event.body } }),
        SUBMIT: ({ context }) => {
          if (!isNonEmptyString(context.body)) return
          return { target: "posting", context: { ...context, body: context.body } }
        },
        _: undefined // stupid workaround for typescript#64251
      }
    },
    posting: {
      on: {
        POST_SUCCESS: ({ event, context }) => ({ target: "posted", context: { ...context, id: event.id } }),
        POST_ERROR: ({ event, context }) => ({ target: "editing", context: { ...context, body: "", error: event.error } }),
        _: undefined
      },
      invoke: ({ context, send }) => {
        A.test(A.areEqual<typeof context, { body: NonEmptyString }>())

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
    },
    context: {
      editing: t<(_: { body: string, error?: boolean }) => void>(),
      posting: t<(_: { body: NonEmptyString }) => void>(),
      posted: t<(_: { body: NonEmptyString, id: string }) => void>(),
    }
  },
})

type NonEmptyString = `${string & {}}${string}`
const isNonEmptyString = (x: string): x is NonEmptyString => x !== ""

const postComment = async (comment: { body: NonEmptyString }) => {
  return { id: "whatever" }
}
```

## Optional: Use TypeScript Fork

For advanced features and more inference less explicit typing you can try the typescript fork... update your `package.json` to include the following and run `npm install`...

```json
{
  "dependencies": {
    "@sthir/machine": "latest"
  },
  "devDependencies": {
    "typescript": "npm:@sthir/typescript@7.1.0-dev.20260829.1"
  },
  "optionalDependencies": {
    "@typescript/typescript-darwin-arm64": "npm:@sthir/typescript-darwin-arm64@7.1.0-dev.20260829.1",
    "@typescript/typescript-darwin-x64": "npm:@sthir/typescript-darwin-x64@7.1.0-dev.20260829.1",
    "@typescript/typescript-linux-arm": "npm:@sthir/typescript-linux-arm@7.1.0-dev.20260829.1",
    "@typescript/typescript-linux-arm64": "npm:@sthir/typescript-linux-arm64@7.1.0-dev.20260829.1",
    "@typescript/typescript-linux-x64": "npm:@sthir/typescript-linux-x64@7.1.0-dev.20260829.1",
    "@typescript/typescript-win32-arm64": "npm:@sthir/typescript-win32-arm64@7.1.0-dev.20260829.1",
    "@typescript/typescript-win32-x64": "npm:@sthir/typescript-win32-x64@7.1.0-dev.20260829.1"
  }
}
```

And also update your `.vscode/settings.json` to include the following...

```json
{
  "js/ts.experimental.useTsgo": true,
  "js/ts.tsdk.path": "./node_modules/typescript"
}
```

And then (you may have to reload the window first) click "Allow" on the "This workspace has a TypeScript 7 tsdk configured (7.1.0-dev.20260829.1). Would you like to use it?" prompt
