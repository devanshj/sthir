# `@sthir/predicate`

[![npm](https://img.shields.io/npm/v/@sthir/predicate?labelColor=000000&color=cb3837)](https://npm.im/@sthir/predicate) [![Babel Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg)](https://github.com/kentcdodds/babel-plugin-macros)

An eDSL to write typed predicates

```ts
import { ps } from "@sthir/predicate"

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
import { pa, ps } from "@sthir/predicate"

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

if (pa(foo, ps(".bar.type ===", "x"))) {
  foo.x
}
```

## Macro

You can use the macro version with [`babel-plugin-macros`](https://github.com/kentcdodds/babel-plugin-macros)

```ts
import { p, ps, pa } from "@sthir/predicate/macro";

pa(x, p(".a?.b", "typeof", "===", y));

pa(x, ps(".a?.b typeof ===", y));
```

Gets transformed to

```ts
(t => typeof t.a?.b === y)(x);

(t => typeof t.a?.b === y)(x);
```

## API

```ts
// `p` is short for `predicate`
export const p:
  <T, Os, Cor, Cnd>
    (...a:
      | []
      | [...operators: Os[]
        , comparator: Cor
        , comparand: Cnd
        ]
    ) =>
      (operand: T) =>
        operand is Narrow<T, Os, Cor, Cnd>

// `ps` is short for `predicateStringified`
export const ps:
  <T, OsCor, Cnd>
    (...a:
      | []
      | [operatorsComparator: OsCor
        , comparand: Cnd
        ]
    ) =>
      (operand: T) =>
        operand is Narrow<T, OsCor, Cnd>

// `pa` is should for `predicateApply`
export const pa:
  <T, U extends T>
    ( operand: T
    , predicate: (t: T) => t is U
    ) =>
      operand is U
```

Supported operators

- Index (`.a`, `?.a`, `.a.b`, `.a?.b`, etc)
- `typeof` (postfix)
- (In future) `!` (postfix)

Supported comparators

- `===`
- `!==` (in [some cases does not work](https://github.com/devanshj/sthir/blob/7435b8076cf43009ec53033e13f87e80a2adc190/packages/predicate/tests/types.twoslash-test.ts#L64-L71) because of [#47283](https://github.com/microsoft/TypeScript/issues/47283))
- (In future) `&`
