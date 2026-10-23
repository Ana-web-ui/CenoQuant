const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { validarProjeto, recuperarRevisao } = loadTs('src/utils/validarProjeto.ts')
const piece = () => ({ id: 'p1', name: 'Painel', category: 'Painéis', code: 'P01', note: 'Revisar',
  dimensionsM: [3, 0.1, 2], included: true, surfaces: [{ material: 'Pintura', areaM2: 13 }] })
const payload = () => ({ schema: 'ceno-quant/1', project: { name: 'Teste', source: 'blender',
  extractedAt: '2026-10-23T10:00:00-03:00' }, pieces: [piece()], warnings: [], lossPercent: 0 })

test('importação válida preserva dados adicionais, medidas e materiais', () => {
  const data = { ...payload(), customCategories: ['Especial'], extra: { futuro: true } }
  const result = validarProjeto(data)
  assert.equal(result.arquivoOriginal, data)
  assert.equal(result.pecas[0].surfaces[0].areaM2, 13)
  assert.equal(validarProjeto({ ...data, project: { ...data.project, source: '3dsmax' } }).pecas.length, 1)
})
test('schema, origem, nome e data inválidos são rejeitados', () => {
  for (const data of [null, [], { ...payload(), schema: 'outro' },
    ...[{ source: 'outro' }, { name: '' }, { name: 'x'.repeat(2001) }, { extractedAt: 'inválida' }]
      .map((patch) => ({ ...payload(), project: { ...payload().project, ...patch } }))]) {
    assert.throws(() => validarProjeto(data))
  }
})
test('IDs vazios e duplicados são rejeitados', () => {
  assert.throws(() => validarProjeto({ ...payload(), pieces: [{ ...piece(), id: ' ' }] }))
  assert.throws(() => validarProjeto({ ...payload(), pieces: [piece(), piece()] }))
})
test('inclusão deve ser booleana; ausente continua incluído', () => {
  assert.throws(() => validarProjeto({ ...payload(), pieces: [{ ...piece(), included: 'false' }] }))
  const p = piece(); delete p.included
  assert.equal(validarProjeto({ ...payload(), pieces: [p] }).pecas[0].included, true)
})
test('limites numéricos e de textos são respeitados', () => {
  for (const patch of [{ dimensionsM: [-1, 1, 1] }, { dimensionsM: [1e8, 1, 1] },
    { surfaces: [{ material: 'M', areaM2: Infinity }] }, { surfaces: [{ material: 'M', areaM2: 1e13 }] },
    { name: 'x'.repeat(2001) }, { code: 123 }, { category: null }, { note: 'x'.repeat(2001) }]) {
    assert.throws(() => validarProjeto({ ...payload(), pieces: [{ ...piece(), ...patch }] }))
  }
})
test('limites de objetos, superfícies por objeto e total são respeitados', () => {
  assert.throws(() => validarProjeto({ ...payload(), pieces: Array(10001).fill(piece()) }))
  assert.throws(() => validarProjeto({ ...payload(), pieces: [{ ...piece(), surfaces: Array(501).fill({ material: 'M', areaM2: 1 }) }] }))
  const pieces = Array.from({ length: 201 }, (_, i) => ({ ...piece(), id: String(i), surfaces: Array(500).fill({ material: 'M', areaM2: 1 }) }))
  assert.throws(() => validarProjeto({ ...payload(), pieces }), /100.000/)
})
test('avisos, categorias personalizadas e percentual inválidos são rejeitados', () => {
  for (const patch of [{ warnings: [{ object: 'a', message: 123 }] }, { customCategories: [''] }, { lossPercent: 101 }]) {
    assert.throws(() => validarProjeto({ ...payload(), ...patch }))
  }
})
test('recuperação mantém revisão e recupera código/nota de versões antigas', () => {
  const p = piece(); delete p.code; delete p.note; p.included = false
  const result = recuperarRevisao({ nome: 'Revisão', pecas: [p], arquivoOriginal: payload() })
  assert.equal(result.pecas[0].code, 'P01'); assert.equal(result.pecas[0].note, 'Revisar')
  assert.equal(result.pecas[0].included, false)
  const saved = JSON.parse(JSON.stringify(result))
  assert.deepEqual(recuperarRevisao(saved), result)
})
test('recuperação preserva texto apagado e rejeita listas incompletas ou estranhas', () => {
  const data = { nome: 'Revisão', pecas: [{ ...piece(), code: '', note: '' }], arquivoOriginal: payload() }
  assert.equal(recuperarRevisao(data).pecas[0].code, '')
  assert.throws(() => recuperarRevisao({ ...data, pecas: [] }))
  assert.throws(() => recuperarRevisao({ ...data, pecas: [{ ...piece(), id: 'outro' }] }))
})
test('projeto vazio válido é aceito', () => {
  assert.deepEqual(validarProjeto({ ...payload(), pieces: [] }).pecas, [])
})
