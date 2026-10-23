const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const cache = new Map()
function loadTs(file) {
  file = path.resolve(file)
  if (cache.has(file)) return cache.get(file)
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const exports = {}
  cache.set(file, exports)
  new Function('require', 'exports', output)((name) => {
    if (!name.startsWith('.')) return require(name)
    const base = path.resolve(path.dirname(file), name)
    return loadTs(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx')
  }, exports)
  return exports
}

module.exports = loadTs
