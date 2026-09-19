# lsp-tester

Codegen tool for TypeScript IntelliSense tests using TypeScript 7's native LSP server.

## Usage

```sh
node lsp-tester/generate.js path/to/types.lsp-test.ts
```

Writes `types.test.ts` next to the source file (strips `lsp-` from the basename). Each `query().completions` / `query().text` reference in the source is replaced with the LSP result inline, so tests don't depend on execution order.

To select a compiler and avoid output collisions in a compiler matrix:

```sh
node lsp-tester/generate.js path/to/types.lsp-test.ts \
  --compiler path/to/compiler \
  --out path/to/types.test.ts
```

## Markers

- `// ^|` on the line below code — completions at the column of `^` on the line above
- `// ^?` on the line below code — hover/quickinfo at the column of `^` on the line above

`query()` is declared globally in `lsp-test-globals.d.ts` (like Vitest's `test` / `expect`) so `*.lsp-test.ts` files typecheck in the editor without imports.

Completion results are filtered by the string-literal prefix at each `^|` marker, matching what editors show in the completion menu.

## Requirements

- TypeScript 7 or another compiler with native LSP support
- Test file imports must resolve from disk (the generator opens the real `*.lsp-test.ts` path via LSP, not a temp copy)

The generator prepends `declare const global/expect/test` shims (same as twoslash) so Vitest globals don't pollute completions.

## TypeScript versions

- Stock queries use TypeScript 7; fork queries use `@sthir/typescript`
