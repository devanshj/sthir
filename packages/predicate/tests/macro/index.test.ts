import tester from "babel-plugin-tester"
import macros from "babel-plugin-macros"

tester({
  plugin: macros,
  formatResult: undefined,
  pluginName: "@sthir/predicate/macro",
  tests: {
    "works": {
      code: `
        import { p, ps, pa } from "@sthir/predicate/macro";

        pa(x, p(".a?.b", "typeof", "===", y));
        
        pa(x, ps(".a?.b typeof ===", y));
      `,
      output: `
        (t => typeof t.a?.b === y)(x);

        (t => typeof t.a?.b === y)(x);
      `
    }
  },
})
