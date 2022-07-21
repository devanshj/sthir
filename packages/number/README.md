# `@sthir/number`

[![npm](https://img.shields.io/npm/v/@sthir/number?labelColor=000000&color=cb3837)](https://npm.im/@sthir/number) [![Babel Macro](https://img.shields.io/badge/babel--macro-%F0%9F%8E%A3-f5da55.svg)](https://github.com/kentcdodds/babel-plugin-macros)

Function and types to work with numbers. Currently only includes `e` and `E` to facilitate `@sthir/predicate`'s `&` comparator usage, but will include more functions and types in future.

☝🏻 Note: It requires typescript version 4.8 and higher

## `e`

An eDSL to write numeric-expressions that evaluate compile-time to produce more complete and narrow types.

```ts
import * as N from "@sthir/number"

let a: 0b01 = 0b01
let b: 0b10 = 0b10

let c: 0b11 = a | b
// doesn't compile: Type 'number' is not assignable to type '3'.

let d: 0b11 = N.e(`${a} | ${b}`)
// compiles
```

You can also use the macro version in `@sthir/number/macro` that uses [`babel-plugin-macro`](https://github.com/kentcdodds/babel-plugin-macros) to transform `N.e(\`${a} | ${b}\`)` into `a | b` for zero runtime overhead.

Supported operators are `&`, `|`, `<<`. We can have more operators but currently only these have a compelling use-case for using bitflag predicates with `@sthir/predicate`. If you have compelling use-cases for other operators feel free to open an issue.

## `E`

Type-level version of `e`

```ts
import * as N from "@sthir/number"

type A = 0b01
type B = 0b10
type C = A | B
// C is `0b01 | 0b10` because `|` is union not bitwise or

type D = N.E<`${A} | ${B}`>
// D is `0b11`
```
