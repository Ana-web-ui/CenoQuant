const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const loadTs = require('./helpers/loadTs.cjs')
const { calcularResumoMateriais } = loadTs('src/utils/calcularResumoMateriais.ts')
const { gerarCsvMateriais } = loadTs('src/utils/gerarCsvMateriais.ts')
const { default: ResumoMateriais } = loadTs('src/components/ResumoMateriais.tsx')
const { default: RelatorioImpressao } = loadTs('src/components/RelatorioImpressao.tsx')
const base = { id: 'a', name: 'Peça', code: '', note: '', category: 'Piso', included: true,
  dimensionsM: [1, 2, 3], surfaces: [{ material: 'MDF', areaM2: 5 }, { material: 'Pintura', areaM2: 2 }] }
const ps = [base, { ...base, id: 'b', category: 'Painéis', surfaces: [{ material: 'MDF', areaM2: 3 }] },
  { ...base, id: 'c', included: false, surfaces: [{ material: 'MDF', areaM2: 100 }] }]

test('modo geral soma material entre categorias e mantém o comportamento padrão', () => {
  const geral = calcularResumoMateriais(ps)
  assert.equal(geral.length, 2)
  assert.equal(geral.find(m => m.material === 'MDF').areaM2, 8)
  assert.ok(geral.every(m => m.categoria === undefined))
})
test('modo por categoria separa os usos sem duplicar área ou incluir excluídos', () => {
  const porCategoria = calcularResumoMateriais(ps, true)
  assert.equal(porCategoria.length, 3)
  assert.equal(porCategoria.find(m => m.categoria === 'Painéis').areaM2, 3)
  assert.equal(porCategoria.reduce((s, m) => s + m.areaM2, 0), 10)
  assert.equal(calcularResumoMateriais(ps).reduce((s, m) => s + m.areaM2, 0), 10)
})
test('modo por categoria mantém materiais vazios e não modifica dados', () => {
  const antes = JSON.stringify(ps)
  calcularResumoMateriais(ps, true); assert.equal(JSON.stringify(ps), antes)
  assert.equal(calcularResumoMateriais([{ ...base, surfaces: [{ material: '', areaM2: 0 }] }], true)[0].material, 'Sem material')
  assert.deepEqual(calcularResumoMateriais([], true), [])
})
test('CSV usa coluna de categoria no modo selecionado e mantém totais e percentual', () => {
  const rows = calcularResumoMateriais(ps, true)
  const csv = gerarCsvMateriais(rows, 10, 10, true)
  assert.ok(csv.startsWith('\uFEFF"Categoria";"Material"'))
  assert.ok(csv.includes('"Painéis";"MDF";"3,000000"'))
  assert.ok(csv.includes('"";"Total de superfície";"10,000000";"10,000000";"11,000000"'))
  const geral = gerarCsvMateriais(calcularResumoMateriais(ps), 10, 10)
  assert.ok(geral.startsWith('\uFEFF"Material";'))
  const especial = gerarCsvMateriais([{ categoria: '=Categoria', material: '@MDF', areaM2: 1 }], 1, 0, true)
  assert.ok(especial.includes('"\'=Categoria"')); assert.ok(especial.includes('"\'@MDF"'))
})
test('tabela e relatório renderizam a separação por categoria com total consistente', () => {
  const rows = calcularResumoMateriais(ps, true)
  const html = renderToStaticMarkup(React.createElement(ResumoMateriais, {
    materiais: rows, superficieTotal: 10, acrescimo: 10, porCategoria: true,
    aoExportar() {}, aoAlterarAcrescimo() {}, aoAlterarAgrupamento() {},
  }))
  assert.ok(html.includes('<th scope="col">Categoria</th>'))
  assert.ok(html.includes('colSpan="2"')); assert.ok(html.includes('11,00'))
  const report = renderToStaticMarkup(React.createElement(RelatorioImpressao, {
    projeto: { nome: 'Teste', pecas: ps, arquivoOriginal: {} }, categorias: [], materiais: rows,
    porCategoria: true, totalIncluido: 2, superficie: 10, acrescimo: 10, quantidadeAvisos: 0,
  }))
  assert.ok(report.includes('categoria e material'))
  assert.ok(report.includes('<th scope="col">Categoria</th>'))
  assert.ok(report.includes('Painéis')); assert.ok(report.includes('11,00'))
})
