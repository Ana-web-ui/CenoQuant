const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { renomearCategoria } = loadTs('src/utils/renomearCategoria.ts')
const { validarProjeto, recuperarRevisao } = loadTs('src/utils/validarProjeto.ts')
const peca = { id: 'a', name: 'Peça', category: 'Antiga', code: 'P01', note: 'Nota', included: true,
  dimensionsM: [1, 2, 3], surfaces: [{ material: 'MDF', areaM2: 5 }] }
const criar = () => validarProjeto({ schema: 'ceno-quant/1', project: { name: 'Teste', source: 'blender',
  extractedAt: '2026-10-23T10:00:00-03:00' }, customCategories: ['Antiga', 'Outra'],
  pieces: [peca, { ...peca, id: 'b', included: false }, { ...peca, id: 'c', category: 'Outra' }] })

test('renomeação afeta incluídos e excluídos e preserva outras categorias e medidas', () => {
  const p = criar(), antes = JSON.stringify(p)
  const novo = renomearCategoria(p, 'Antiga', ' Nova ', ['Antiga', 'Outra'])
  assert.deepEqual(novo.pecas.map(p => p.category), ['Nova', 'Nova', 'Outra'])
  assert.equal(novo.pecas[1].included, false); assert.equal(novo.pecas[2], p.pecas[2])
  assert.equal(novo.pecas[0].dimensionsM, p.pecas[0].dimensionsM)
  assert.deepEqual(novo.arquivoOriginal.customCategories, ['Outra', 'Nova'])
  assert.equal(novo.arquivoOriginal.pieces, p.arquivoOriginal.pieces)
  assert.equal(JSON.stringify(p), antes)
})
test('nomes existentes, vazios, longos e origem desconhecida são rejeitados', () => {
  for (const [origem, destino] of [['Antiga', 'Outra'], ['Antiga', ' '], ['Antiga', 'a'.repeat(2001)], ['Ausente', 'Nova']]) {
    assert.throws(() => renomearCategoria(criar(), origem, destino, ['Antiga', 'Outra']))
  }
})
test('mesmo nome é operação sem alteração', () => {
  const p = criar(); assert.equal(renomearCategoria(p, 'Antiga', ' Antiga ', ['Antiga']), p)
})
test('categoria personalizada sem objetos pode ser renomeada', () => {
  const p = criar(); p.arquivoOriginal.customCategories.push('Vazia')
  const novo = renomearCategoria(p, 'Vazia', 'Reserva', ['Antiga', 'Outra', 'Vazia'])
  assert.ok(novo.arquivoOriginal.customCategories.includes('Reserva'))
  assert.ok(!novo.arquivoOriginal.customCategories.includes('Vazia'))
  assert.deepEqual(novo.pecas, p.pecas)
})
test('revisão salva e JSON exportado preservam nova categoria', () => {
  const novo = renomearCategoria(criar(), 'Antiga', 'Nova', ['Antiga', 'Outra'])
  assert.equal(recuperarRevisao(JSON.parse(JSON.stringify(novo))).pecas[0].category, 'Nova')
  const byId = new Map(novo.pecas.map(p => [p.id, p]))
  const exported = { ...novo.arquivoOriginal, pieces: novo.arquivoOriginal.pieces.map(p => ({ ...p, category: byId.get(p.id).category })) }
  assert.equal(validarProjeto(exported).pecas[1].category, 'Nova')
})
