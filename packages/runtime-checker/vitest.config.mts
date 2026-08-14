import { defineProject } from "vitest/config"

export default defineProject({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    experimental: {
      viteModuleRunner: false, // workaround because we're exporting "then" https://github.com/vitest-dev/vitest/issues/9951#issuecomment-4108719636
    },
  },
})
