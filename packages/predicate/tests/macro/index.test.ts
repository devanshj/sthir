import tester from "babel-plugin-tester"
import macros from "babel-plugin-macros"

tester({
  plugin: macros,
  formatResult: undefined,
  pluginName: "@sthir/predicate/macro",
  tests: {
    "index, typeof, ===": {
      code: `
        import { p, pa } from "@sthir/predicate/macro";

        pa(x, p(".a?.b typeof ===", y));
      `,
      output: `
        (t => typeof t.a?.b === y)(x);
      `
    },
    "no operators": {
      code: `
        import { p, pa } from "@sthir/predicate/macro";

        pa(x, p("===", y));
      `,
      output: `
        (t => t === y)(x);
      ` 
    },
    "truthy": {
      code: `
        import { p, pa } from "@sthir/predicate/macro";

        pa(x, p());
      `,
      output: `
        Boolean(x);
      `
    },
    "&": {
      code: `
        import { p, pa } from "@sthir/predicate/macro";

        pa(x, p("&", y));
      `,
      output: `
        (t => t & y)(x);
      `
    }
  },
})
