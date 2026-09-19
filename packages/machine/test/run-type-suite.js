// @ts-check

const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

const variant = process.argv[2]
if (variant !== "fork" && variant !== "stock") {
  throw new Error("Expected compiler variant to be 'fork' or 'stock'")
}

const machineRoot = path.resolve(__dirname, "..")
const repoRoot = path.resolve(machineRoot, "../..")
const compiler =
  variant === "fork"
    ? path.join(repoRoot, "node_modules/@typescript/fork/bin/tsc")
    : path.join(repoRoot, "node_modules/@typescript/native/bin/tsc")
const config = path.join(
  machineRoot,
  variant === "fork" ? "tsconfig.types.fork.json" : "tsconfig.types.json"
)
const fixtures =
  variant === "fork"
    ? [
        ["fork/types.lsp-test.ts", "fork/types.test.ts"],
        ["fork/effect/types.lsp-test.ts", "fork/effect/types.test.ts"],
      ]
    : [
        ["types.lsp-test.ts", "types.test.ts"],
        ["effect/types.lsp-test.ts", "effect/types.test.ts"],
      ]
const generated = fixtures.map(([, output]) => path.join(__dirname, output))
const generator = path.join(repoRoot, "lsp-tester/generate.js")
const vitest = path.join(repoRoot, "node_modules/vitest/vitest.mjs")

/** @type {number[]} */
const statuses = []

/**
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: machineRoot,
    stdio: "inherit",
  })
  statuses.push(result.status ?? 1)
}

for (const output of generated) fs.rmSync(output, { force: true })

// Run both checks even when one fails so a compiler's tsc and LSP behavior are
// always reported together.
run(compiler, ["-p", config])
for (const [source, output] of fixtures) {
  run(process.execPath, [
    generator,
    path.join(__dirname, source),
    "--compiler",
    compiler,
    "--out",
    path.join(__dirname, output),
  ])
}

if (generated.every((output) => fs.existsSync(output))) {
  run(process.execPath, [
    vitest,
    "run",
    "test/index.test.ts",
    ...generated,
  ])
}

for (const output of generated) fs.rmSync(output, { force: true })
process.exitCode = statuses.some(Boolean) ? 1 : 0
