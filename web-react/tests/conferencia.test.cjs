const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { conferirPecas, correspondeConferencia } = loadTs('src/utils/conferirPecas.ts')
const { filtrarPecas } = loadTs('src/utils/filtrarPecas.ts')
const base = { id: 'a', name: 'Peça', category: 'Sem categoria', code: '', note: '', included: true,
  dimensionsM: [1, 2, 3], surfaces: [] }

test('indicadores consideram apenas incluídos e permitem sobreposição', () => {
  const result = conferirPecas([base, { ...base, id: 'b', included: false }])
  assert.deepEqual(result.map(i => i.quantidade), [1, 1, 1, 0])
})
test('material sem nome conta objetos uma vez; sem superfície difere de área zero', () => {
  const p = { ...base, surfaces: [{ material: ' ', areaM2: 0 }, { material: '', areaM2: 1 }] }
  assert.equal(conferirPecas([p])[3].quantidade, 1)
  assert.equal(correspondeConferencia(p, 'sem-superficies'), false)
  assert.equal(correspondeConferencia({ ...p, surfaces: [{ material: 'MDF', areaM2: 0 }] }, 'material-sem-nome'), false)
})
test('filtro combina conferência, texto, categoria e inclusão', () => {
  const ps = [base, { ...base, id: 'b', code: 'P01' }, { ...base, id: 'c', included: false }]
  assert.deepEqual(filtrarPecas(ps, 'peça', 'Sem categoria', 'incluidos', 'sem-codigo').map(p => p.id), ['a'])
  assert.equal(filtrarPecas(ps, '', '', 'excluidos', 'sem-codigo')[0].id, 'c')
  assert.equal(filtrarPecas(ps, '', '', 'todos').length, 3)
})
test('indicadores atualizam com revisão sem modificar dados', () => {
  const antes = JSON.stringify(base)
  const p = { ...base, category: 'Piso', code: 'P01', surfaces: [{ material: 'MDF', areaM2: 1 }] }
  assert.ok(conferirPecas([p]).every(i => i.quantidade === 0))
  conferirPecas([base]); assert.equal(JSON.stringify(base), antes)
  assert.ok(conferirPecas([]).every(i => i.quantidade === 0))
})
