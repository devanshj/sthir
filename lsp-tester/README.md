# lsp-tester

Codegen tool for TypeScript IntelliSense tests using **TypeScript 7's native language server** (`tsc --lsp --stdio`).

## Usage

```sh
node lsp-tester/generate.js path/to/types.lsp-test.ts
```

Writes `types.test.ts` next to the source file (strips `lsp-` from the basename). Each `query().completions` / `query().text` reference in the source is replaced with the LSP result inline, so tests don't depend on execution order.

## Markers

- `// ^|` on the line below code — completions at the column of `^` on the line above
- `// ^?` on the line below code — hover/quickinfo at the column of `^` on the line above

`query()` is declared globally in `lsp-test-globals.d.ts` (like Jest's `test` / `expect`) so `*.lsp-test.ts` files typecheck in the editor without imports.

Completion results are filtered by the string-literal prefix at each `^|` marker, matching what editors show in the completion menu.

## Requirements

- TypeScript 7 (`@typescript/native` provides `tsc --lsp --stdio`)
- Test file imports must resolve from disk (temp file is written alongside the test)

The generator prepends `declare const global/expect/test` shims (same as twoslash) so Jest globals don't pollute completions.

## TypeScript versions

- **LSP queries** use TypeScript 7 via `@typescript/native`
- **Jest/ts-jest** use `@typescript/typescript6` (the `typescript` package alias) since TS 7 has no compiler API yet
