
// of :: <A>(a: A) => Event<A>
export const of = a => s => (s(a), () => {})

// map :: <T, U>(f: (t: T) => U) => ($: Event<T>) => Event<U>
export const map = f => $ => s => $(a => s(f(a)))

// flatMap :: <T, U>(f: (t: T) => Event<U>) => ($: Event<T>) => Event<U>
export const flatMap = f => $ => s => {
  let dU = () => {}
  let dT = $(t => {
    dU()
    dU = f(t)(s)
  })
  return () => (dT(), dU())
}

// merge :: <T>($s: Event<T>[]) => Event<T>
export const merge = ($s) => s => {
  let ds = $s.map($ => $(s))
  return ds.forEach(d => d())
}
