import { defineProject } from "vitest/config"

export default defineProject({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
