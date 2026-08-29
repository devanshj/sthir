# `@sthir/machine`

This is a work in progress. Uses a fork of TypeScript with [PR #64092](https://github.com/microsoft/TypeScript/pull/64092). To try it update your `package.json` to include the following and run `npm install`...

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

Here's an example usage...

```ts
import { createMachine, t } from "@sthir/machine"

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
      effect: ({ context, send }) => {
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
```