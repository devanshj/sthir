export {}

declare global {
  function query(): { completions: string[], text: string }
}
