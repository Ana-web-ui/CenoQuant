const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { filtrarPecas } = loadTs('src/utils/filtrarPecas.ts')
const { listarMateriais } = loadTs('src/utils/listarMateriais.ts')
const base = { id: 'a', name: 'Painel', code: 'P01', note: '', category: 'Painéis', included: true,
  dimensionsM: [1, 2, 3], surfaces: [{ material: 'MDF', areaM2: 5 }, { material: 'Pintura', areaM2: 2 }] }
const ps = [base, { ...base, id: 'b', included: false, surfaces: [{ material: 'MDF', areaM2: 0 }] },
  { ...base, id: 'c', surfaces: [] }, { ...base, id: 'd', surfaces: [{ material: '', areaM2: 1 }] }]

test('filtro encontra material em qualquer registro e inclui áreas zero', () => {
  assert.deepEqual(filtrarPecas(ps, '', '', 'todos', 'todas', 'MDF').map(p => p.id), ['a', 'b'])
  assert.deepEqual(filtrarPecas(ps, '', '', 'todos', 'todas', 'Pintura').map(p => p.id), ['a'])
})
test('material combina com busca, categoria, inclusão e conferência', () => {
  assert.deepEqual(filtrarPecas(ps, 'p01', 'Painéis', 'incluidos', 'todas', 'MDF').map(p => p.id), ['a'])
  assert.equal(filtrarPecas(ps, '', '', 'excluidos', 'todas', 'MDF')[0].id, 'b')
  assert.equal(filtrarPecas(ps, '', '', 'incluidos', 'sem-codigo', 'MDF').length, 0)
})
test('material sem nome não se confunde com todos nem com objeto sem superfícies', () => {
  assert.deepEqual(filtrarPecas(ps, '', '', 'todos', 'todas', '').map(p => p.id), ['d'])
  assert.equal(filtrarPecas(ps, '', '', 'todos', 'todas', null).length, 4)
  assert.equal(filtrarPecas(ps, '', '', 'todos', 'todas', 'inexistente').length, 0)
})
test('lista preserva nomes exatos sem consolidar diferenças de caixa ou espaços', () => {
  const extra = { ...base, id: 'extra', surfaces: [{ material: 'mdf', areaM2: 1 }, { material: ' MDF ', areaM2: 1 }] }
  const nomes = listarMateriais([...ps, extra])
  for (const nome of ['MDF', 'Pintura', '', 'mdf', ' MDF ']) assert.ok(nomes.includes(nome))
  assert.equal(nomes.filter(n => n === 'MDF').length, 1)
  assert.equal(filtrarPecas([...ps, extra], '', '', 'todos', 'todas', 'mdf')[0].id, 'extra')
})
test('filtrar e listar não alteram dados e aceitam lista vazia', () => {
  const antes = JSON.stringify(ps)
  listarMateriais(ps); filtrarPecas(ps, '', '', 'todos', 'todas', 'MDF')
  assert.equal(JSON.stringify(ps), antes)
  assert.deepEqual(listarMateriais([]), [])
  assert.deepEqual(filtrarPecas([], '', '', 'todos', 'todas', 'MDF'), [])
})
