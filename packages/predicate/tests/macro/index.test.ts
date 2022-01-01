import tester from "babel-plugin-tester"
import macros from "babel-plugin-macros"

tester({
  plugin: macros,
  formatResult: undefined,
  pluginName: "@sthir/predicate/macro",
  tests: {
    "index, typeof, ===": {
      code: `
        import { p, ps, pa } from "@sthir/predicate/macro";

        pa(x, p(".a?.b", "typeof", "===", y));
        
        pa(x, ps(".a?.b typeof ===", y));
      `,
      output: `
        (t => typeof t.a?.b === y)(x);

        (t => typeof t.a?.b === y)(x);
      `
    },
    "no operators": {
      code: `
        import { p, ps, pa } from "@sthir/predicate/macro";

        pa(x, p("===", y));
        
        pa(x, ps("===", y));
      `,
      output: `
        (t => t === y)(x);

        (t => t === y)(x);
      ` 
    },
    "truthy": {
      code: `
        import { p, ps, pa } from "@sthir/predicate/macro";

        pa(x, p());
        
        pa(x, ps());
      `,
      output: `
        (t => Boolean(t))(x);

        (t => Boolean(t))(x);
      `
    }
  },
})
