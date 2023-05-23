export {
  Stream,
  of,
  map,
  flatMap,
  combine,
  merge,
  race,
  time
}

interface Stream<T>
  { (s: (t: T) => void): () => void
  }


const of: <A>(a: A) => Stream<A> =
  a => s => (s(a), () => {})



const map: <T, U>(f: (t: T) => U) => ($: Stream<T>) => Stream<U> =
  f => t$ => sU => t$(t => sU(f(t)))



const flatMap: <T, U>(f: (t: T) => Stream<U>) => ($: Stream<T>) => Stream<U> =
  f => t$ => sU => {
    let dU  = () => {}
    let dT = t$(t => {
      dU()
      dU = f(t)(sU)
    })
    return () => (dT(), dU())
  }



type Combine = 
  <Ts extends Stream<unknown>[]>($s: Ts) =>
    Stream<{ [I in keyof Ts]: Ts[I] extends Stream<infer T> ? T : never }>

type CombineImpl = 
  ($s: Stream<"T">[]) => Stream<"T"[]>

const combineImpl: CombineImpl = $s => s => {
  let as: (Nothing | "T")[] = $s.map(() => nothing)
  let ds: (() => void)[] = []

  const on = () => {
    if (as.some(a => a === nothing)) return
    s(as as "T"[]) // assertion: control flow incompleteness
  }
  for (let [i, $] of $s.entries()) {
    ds.push($(a => as[i] = a))
    on()
  }

  return () => ds.forEach(d => d())
}

const combine = combineImpl as Combine



type Merge = 
  <Ts extends Stream<unknown>[]>($s: [...Ts]) =>
    Stream<{ [I in keyof Ts]: Ts[I] extends Stream<infer T> ? T : never }[number]>

type MergeImpl = 
  ($s: Stream<"T">[]) => Stream<"T">

const mergeImpl: MergeImpl = $s => s => {
  let ds: (() => void)[] = []
  for (let $ of $s) ds.push($(s))

  return () => ds.forEach(d => d())
}

const merge = mergeImpl as Merge



type Race = 
  <Ts extends Stream<unknown>[]>($s: [...Ts]) =>
    Stream<{ [I in keyof Ts]: Ts[I] extends Stream<infer T> ? T : never }[number]>

type RaceImpl = 
  ($s: Stream<"T">[]) => Stream<"T">

const raceImpl: RaceImpl = $s => s => {
  let d: (() => void) | undefined

  for (let $ of $s) {
    d?.()
    d = $(a => {
      s(a)
    })
    break
  }

  return () => d?.()
}

const race = raceImpl as Race



const time: (t: number) => Stream<undefined> =
  t => s => {
    let i = setTimeout(s, t)
    return () => clearTimeout(i)
  }




type Nothing =
  typeof nothing

const nothing =
  Symbol("nothing")
