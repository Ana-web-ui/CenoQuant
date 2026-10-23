const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { gerarCsvSelecao } = loadTs('src/utils/gerarCsvSelecao.ts')
const { gerarCsvPecas } = loadTs('src/utils/gerarCsvPecas.ts')
const base = { id: 'a', name: 'Painel', code: 'P01', note: 'Nota', category: 'Painéis', included: true,
  dimensionsM: [1, 2, 3], surfaces: [{ material: 'MDF', areaM2: 5 }, { material: 'Pintura', areaM2: 2 }] }
const pecas = [base, { ...base, id: 'b', name: 'Excluído selecionado', included: false },
  { ...base, id: 'c', name: 'Não selecionado' }]

test('CSV da seleção contém incluídos e excluídos selecionados com estado explícito', () => {
  const csv = gerarCsvSelecao(pecas, new Set(['a', 'b']))
  assert.ok(csv.startsWith('\uFEFF')); assert.equal(csv.split('\r\n').length, 3)
  assert.ok(csv.includes('Inclusão no quantitativo')); assert.ok(csv.includes('"Incluído"'))
  assert.ok(csv.includes('"Excluído"')); assert.ok(!csv.includes('Não selecionado'))
  assert.ok(csv.includes('7,000000'))
})
test('exportação global existente continua apenas com incluídos e colunas originais', () => {
  const csv = gerarCsvPecas(pecas)
  assert.equal(csv.split('\r\n').length, 3)
  assert.ok(!csv.includes('Excluído selecionado')); assert.ok(!csv.includes('Inclusão no quantitativo'))
  assert.ok(csv.includes('Não selecionado'))
})
test('seleção vazia produz cabeçalho; seleção não depende da página e não modifica dados', () => {
  assert.equal(gerarCsvSelecao(pecas, new Set()).split('\r\n').length, 1)
  const lista = Array.from({ length: 45 }, (_, i) => ({ ...base, id: String(i) }))
  const antes = JSON.stringify(lista), ids = new Set(lista.map(p => p.id))
  assert.equal(gerarCsvSelecao(lista, ids).split('\r\n').length, 46)
  assert.equal(ids.size, 45); assert.equal(JSON.stringify(lista), antes)
})
test('código, observação e nomes especiais são protegidos para Excel', () => {
  const csv = gerarCsvSelecao([{ ...base, name: '@Painel', code: '=P01', note: 'Rever "peça";\nacabamento' }], new Set(['a']))
  assert.ok(csv.includes('"\'@Painel"')); assert.ok(csv.includes('"\'=P01"'))
  assert.ok(csv.includes('Rever ""peça"";\nacabamento'))
})
