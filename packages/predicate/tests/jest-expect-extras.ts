expect.extend({
  toSetEqual(received, expected) {
    if (!(
      Array.isArray(received) &&
      received.every(t => typeof t === "string" || typeof t === "number")
    )) {
      return { pass: false, message: () => `expected an array of strings or numbers only` }
    }
    
    if (!this.equals(received.slice().sort(), expected.slice().sort())) {
      return {
        pass: false,
        message:
          () => `expected both sets to be equal\n\nExpected: ${JSON.stringify(expected)}\nReceived: ${JSON.stringify(received)}`
      }
    }

    return { pass: true, message: () => "" }
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