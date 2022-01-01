// @ts-check

const fs = require("fs")
const path = require("path")

fs.writeFileSync(
  path.join(__dirname, "dist", "declarations", "src", "macro", "index.d.ts"),
  fs.readFileSync(path.join(__dirname, "dist", "declarations", "src", "index.d.ts"), "utf-8")
    .replace("./types", "../types"),
  "utf-8"
)