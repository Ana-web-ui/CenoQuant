const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { ordenarPecas } = loadTs('src/utils/ordenarPecas.ts')
const { filtrarPecas } = loadTs('src/utils/filtrarPecas.ts')
const base = { id: 'a', name: 'Peça 10', code: '', note: '', category: 'Piso', included: true,
  dimensionsM: [1, 3, 2], surfaces: [{ material: 'MDF', areaM2: 2 }, { material: 'Pintura', areaM2: 5 }] }
const pecas = [base, { ...base, id: 'b', name: 'Peça 2', code: 'P10', category: 'Painéis',
  dimensionsM: [3, 2, 1], surfaces: [{ material: 'MDF', areaM2: 4 }] },
  { ...base, id: 'c', name: 'Peça 1', code: 'P2', dimensionsM: [2, 1, 3], surfaces: [] }]
const ids = ps => ps.map(p => p.id)

test('nomes usam ordem natural e direção selecionada', () => {
  assert.deepEqual(ids(ordenarPecas(pecas, 'nome-asc')), ['c', 'b', 'a'])
  assert.deepEqual(ids(ordenarPecas(pecas, 'nome-desc')), ['a', 'b', 'c'])
})
test('código usa ordem natural e deixa vazios ao final', () => {
  assert.deepEqual(ids(ordenarPecas(pecas, 'codigo')), ['c', 'b', 'a'])
})
test('categoria, área e dimensões usam os campos corretos', () => {
  assert.equal(ordenarPecas(pecas, 'categoria')[0].id, 'b')
  assert.deepEqual(ids(ordenarPecas(pecas, 'area-desc')), ['a', 'b', 'c'])
  assert.deepEqual(ids(ordenarPecas(pecas, 'area-asc')), ['c', 'b', 'a'])
  assert.equal(ordenarPecas(pecas, 'x-desc')[0].id, 'b')
  assert.equal(ordenarPecas(pecas, 'y-desc')[0].id, 'a')
  assert.equal(ordenarPecas(pecas, 'z-desc')[0].id, 'c')
})
test('ordenação não altera a lista original nem as medidas; empates são estáveis', () => {
  const antes = JSON.stringify(pecas)
  ordenarPecas(pecas, 'nome-asc')
  assert.equal(JSON.stringify(pecas), antes)
  assert.deepEqual(ids(ordenarPecas(pecas, 'original')), ['a', 'b', 'c'])
  assert.notEqual(ordenarPecas(pecas, 'original'), pecas)
  assert.deepEqual(ids(ordenarPecas([base, { ...base, id: 'outro' }], 'nome-asc')), ['a', 'outro'])
})
test('busca e ordenação combinam antes de paginar e aceitam lista vazia', () => {
  const lista = Array.from({ length: 45 }, (_, i) => ({ ...base, id: String(i), name: `Peça ${45-i}` }))
  const resultado = ordenarPecas(filtrarPecas(lista, 'peça', 'Piso', 'incluidos'), 'nome-asc')
  assert.equal(resultado[0].name, 'Peça 1'); assert.equal(resultado.slice(20, 40)[0].name, 'Peça 21')
  assert.equal(resultado.length, 45); assert.deepEqual(ordenarPecas([], 'area-desc'), [])
})
