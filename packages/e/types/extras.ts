export namespace Result {
  export type Ok<T> = { type: "Ok", value: T }
  export type Error<T> = { type: "Error", error: T }

  export type Combine<Rs> =
    T.Get<Rs, number> extends Ok<unknown>
      ? Ok<{ [I in keyof Rs]: Rs[I] extends Ok<infer X> ? X : never }> 
      : Error<T.Get<{ [I in keyof Rs]: Rs[I] extends Error<infer X> ? X : never }, number>>
}

export namespace S {
  export type Assert<T> = T.Cast<T, string>

  export type Split<S, D> =
    S extends "" ? [""] :
    S extends `${infer Sh}${S.Assert<D>}${infer St}`
      ? [Sh, ...Split<St, D>] :
    [S]

  export type SplitBefore<S, D> = 
    S extends "" ? [""] :
    S extends `${infer Sh}${S.Assert<D>}${infer St}`
      ? S extends `${Sh}${infer Dh}${St}`
          ? [ ...(Sh extends "" ? [] : [Sh])
            , ...(
                Split<St, D> extends infer X
                  ? X extends [] ? [] :
                    X extends [infer H, ...infer T]
                      ? [`${Dh}${S.Assert<H>}`, ...T]
                      : never
                  : never
              )
            ]
          : never :
    [S]

  export type GetIndent<T> =
    T extends `${infer I extends " " | "\t"}${infer X}`
      ? X extends `${" " | "\t"}${string}`
          ? `${I}${GetIndent<X>}`
          : I
      : ``

  export type Join<T, D> =
    T extends [] ? "" :
    T extends [infer H] ? H :
    T extends [infer H, ...infer T]
      ? `${S.Assert<H>}${S.Assert<D>}${S.Assert<Join<T, D>>}` :
    never
}

export namespace T {
  export type Cast<T, U> =
    T extends U ? T : U

  export type Test<A extends true> =
    A
  
  export type Get<T, P> =
    B.Not<T.DoesExtend<P, unknown[]>> extends true ? Get<T, [P]> :
    P extends [] ? T :
    P extends [infer Ph] ?
      (Ph extends `?${infer X}` ? X : Ph) extends infer K
      ? K extends keyof T ? T[K] :
          T extends null ? null :
          T extends undefined ? undefined :
          undefined
        : never :
    P extends [infer Ph, ...infer Pr] ? Get<Get<T, [Ph]>, Pr> :
    never

  export type DoesExtend<A, B> =
    A extends B ? true : false

  export type AreEqual<A, B> =
    (<T>() => T extends B ? 1 : 0) extends (<T>() => T extends A ? 1 : 0)
      ? true
      : false
}

export namespace Never {
  export type Let = never
  export type Exhaustive = never
}

export namespace B {
  export type Not<T> = 
    T extends true ? false : true
}