expect.extend({
  toSetEqual(received, expected) {
    if (!(
      Array.isArray(received) &&
      received.every(t => typeof t === "string" || typeof t === "number")
    )) {
      return { pass: false, message: () => `expected an array of strings or numbers only` }
    }
    this.equals(received.sort(), expected.sort())
    return { pass: true, message: () => "expected both sets to be equal" }
  }
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toSetEqual(b: string[]): R;
    }
  }
}

export {}