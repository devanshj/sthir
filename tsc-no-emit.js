// @ts-check

let ts = require("typescript")
let fs = require("fs")

let options = { noEmit: true, lib: ts.ScriptTarget.ES2015 }
let host = ts.createCompilerHost(options)
let files = new Map()
host.writeFile = (f, c) => files.set(f, c)

let program = ts.createProgram([process.argv[2]], options, host)
let emitResult = program.emit()

ts
.getPreEmitDiagnostics(program)
.concat(emitResult.diagnostics)
.map(diagnostic => {
  if (diagnostic.file) {
    let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start)
    let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
    return `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
  }
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
})
.forEach(x => console.log(x))
