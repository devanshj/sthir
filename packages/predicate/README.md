# `@sthir/predicate`

[![npm](https://img.shields.io/npm/v/@sthir/predicate?labelColor=000000&color=cb3837)](https://npm.im/@sthir/predicate) [![Babel Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg)](https://github.com/kentcdodds/babel-plugin-macros)

An eDSL to write typed predicates

```ts
import { p } from "@sthir/predicate"

declare let xs:
  (undefined | { a: string | number } | { b: string })[]


// Without @sthir/predicate ...

xs
.filter(x => typeof x?.a === "string") 
//                     ~
// Property 'a' does not exist on type '{ a: string | number; } | { b: string; }'.
//    Property 'a' does not exist on type '{ b: string; }'
.map(x => x.a.toUpperCase())
//        ~
// Object is possibly 'undefined'
//          ~
// Property 'a' does not exist on type '{ a: string | number; } | { b: string; }'.
//    Property 'a' does not exist on type '{ b: string; }'



// With @sthir/predicate ...

xs
.filter(ps("?.a typeof ===", "string"))
.map(x => x.a.toUpperCase())
```

```ts
import { pa, p } from "@sthir/predicate"

declare let foo:
  | { bar: { type: "x" }
    , x: number
    }
  | { bar: { type: "y" }
    , y: number
    }

// Without @sthir/predicate ...

if (foo.bar.type === "x") {
  foo.x
//    ~
// Property 'x' does not exist on type '{ bar: { type: "x"; }; x: number; } | { bar: { type: "y"; }; y: number; }'.
//   Property 'x' does not exist on type '{ bar: { type: "y"; }; y: number; }'
}

// With @sthir/predicate ...

if (pa(foo, p(".bar.type ===", "x"))) {
  foo.x
}
```

## Macro

You can use the macro version with [`babel-plugin-macros`](https://github.com/kentcdodds/babel-plugin-macros)

```ts
import { p, ps, pa } from "@sthir/predicate/macro";

pa(x, p(".a?.b", "typeof", "===", y));
```

Gets transformed in build-time to

```ts
(t => typeof t.a?.b === y)(x);
```

## API

```ts
// `p` is short for `predicate`
// (this is a pseudo type)
export const p:
  < T
  , OsCor extends Join<[...Operator[], Comparator], " ">
  , Cnd extends (HasComparator<OsCor> extends true ? [Comparand] : [])
  >
    ( operatorsMaybeComparator?: OsCor
    , ...comparand: Cnd
    ) =>
      (operand: T) =>
        operand is Narrow<T, OsCor, Cnd>

// `pa` is short for `predicateApply`
export const pa:
  <T, U extends T>
    (operand: T, predicate: (t: T) => t is U) =>
      operand is U
```

### Supported operators

- Index (`.a`, `?.a`, `.a.b`, `.a?.b`, etc)
- `typeof` (postfix)

### Supported comparators

- `===`
- `!==`

### Future

- `&` comparator. For use cases like [this](https://twitter.com/_developit/status/1471212197183651841)
- Numeric operators (`>`, `<=`, etc). This would actually come after we have `@sthir/number`. One of the major use cases would be doing a `pa(xs, p(".length >=", 1))` would narrow `xs` from `T[]` to `[T, ...T[]]`.
- Call operator `(...)`.
  ```ts
  declare const a:
    | { isFoo: (x: number) => true, foo: string } 
    | { isFoo: (x: number) => false, foo: undefined } 

  if (pa(a, p(".isFoo (", 10, ")")) {
    a.foo.toUpperCase();
  }
  ```
- Maybe more

### Versioning notes

Note that the current version has a zero major, which means there can be breaking changes without a major bump.

> Major version zero (0.y.z) is for initial development. Anything MAY change at any time. The public API SHOULD NOT be considered stable.
>
> — [_semver.org_](https://semver.org/#spec-item-4)

You can still use it of course, just be careful before bumping to a newer version.
