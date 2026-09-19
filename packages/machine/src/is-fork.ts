export type IsFork = typeof isFork extends true ? true : false
const isFork = ((() => {}) as unknown as <T extends (t: ReturnType<T>) => unknown>(t: T) => ReturnType<T>)(_ => true as const)
