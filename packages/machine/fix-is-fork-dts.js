// @ts-check

const fs = require("fs")
const path = require("path")

const declarationsSrc = path.join(__dirname, "dist", "declarations", "src")

fs.rmSync(path.join(declarationsSrc, "is-fork.d.ts"), { force: true })
fs.copyFileSync(
  path.join(__dirname, "src", "is-fork.ts"),
  path.join(declarationsSrc, "is-fork.ts")
)
