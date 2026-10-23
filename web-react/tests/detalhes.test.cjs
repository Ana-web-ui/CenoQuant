const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const loadTs = require('./helpers/loadTs.cjs')
const { default: DetalhesPeca } = loadTs('src/components/DetalhesPeca.tsx')
const base = { id: 'a', name: 'Painel', category: 'Painéis', code: 'P01', note: 'Rever acabamento',
  included: true, dimensionsM: [3, 0.1, 2], surfaces: [{ material: 'MDF', areaM2: 5 }, { material: 'Pintura', areaM2: 8 }] }
const render = peca => renderToStaticMarkup(React.createElement(DetalhesPeca, { peca, aoFechar() {} }))

test('detalhes mostram identificação, estado, medidas e área distribuída por material', () => {
  const html = render(base)
  for (const text of ['P01', 'Painéis', 'Incluído', '3,000 / 0,100 / 2,000', '13,000000', '5,000000', '8,000000', 'Rever acabamento']) {
    assert.ok(html.includes(text), text)
  }
  assert.equal((html.match(/scope="row"/g) || []).length, 2)
})
test('sem superfícies é diferente de área medida igual a zero', () => {
  assert.ok(render({ ...base, surfaces: [] }).includes('Nenhuma superfície registrada'))
  const zero = render({ ...base, surfaces: [{ material: 'MDF', areaM2: 0 }] })
  assert.ok(zero.includes('0,000000')); assert.ok(!zero.includes('Nenhuma superfície registrada'))
})
test('excluídos e textos vazios são identificados; conteúdo HTML é escapado', () => {
  const html = render({ ...base, included: false, code: '', note: '<script>teste</script>' })
  assert.ok(html.includes('Excluído')); assert.ok(html.includes('Sem código'))
  assert.ok(html.includes('&lt;script&gt;')); assert.ok(!html.includes('<script>'))
})
test('nenhum objeto selecionado não renderiza diálogo', () => {
  assert.equal(render(null), '')
})
