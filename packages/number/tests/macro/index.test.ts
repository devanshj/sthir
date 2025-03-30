import tester from "babel-plugin-tester"
import macros from "babel-plugin-macros"

tester({
  plugin: macros,
  formatResult: a => a,
  pluginName: "@sthir/number/macro",
  tests: {
    "works": {
      code: `
        import { e } from "@sthir/number/macro";

        let x = e(\`\${(() => 1)()} & 2\`);
      `,
      output: `
        let x = (() => 1)() & 2;
      `
    }
  },
})
