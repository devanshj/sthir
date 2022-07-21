import type { E, ERuntime } from "./types"

export { E }

export const e = (x => {
  try { return (new Function(`return ${x}`))() }
  catch (error) {
    if (!(error instanceof EvalError)) throw error
    return _e(x)
  }
}) as ERuntime

const _e = (x: string): number => {
  let r = ([
    [/(.*)\((.*)\)(.*)/, m => _e(`${m[1]}${_e(m[2]!)}${m[3]}`)],
    [/(.*) \& (.*)/, m => _e(m[1]!) & _e(m[2]!)],
    [/(.*) \| (.*)/, m => _e(m[1]!) | _e(m[2]!)],
    [/(.*) \<\< (.*)/, m => _e(m[1]!) << _e(m[2]!)],
    [/0b(.*)/, m => parseInt(m[1]!, 2)],
    [/(.*)/, m => parseInt(m[1]!, 10)],
  ] as [RegExp, (x: RegExpMatchArray) => number][])
  .flatMap(([p, f]) => {
    let m = x.match(p)
    if (m) return f(m)
    return []
  })[0]

  if (!r) throw new Error(`Could not parse ${x}`)
  return r
}
