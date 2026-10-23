const { test } = require('node:test')
const assert = require('node:assert/strict')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const loadTs = require('./helpers/loadTs.cjs')
const { filtrarAvisos } = loadTs('src/utils/filtrarAvisos.ts')
const { default: PainelAvisos } = loadTs('src/components/PainelAvisos.tsx')
const avisos = [
  { object: 'Iluminação 01', message: 'Sem categoria.' },
  { object: 'Painel', message: 'Textura ausente: revisar aplicação.' },
  { object: 'Luz', message: 'Sem categoria.' },
]

test('busca de avisos procura objeto e mensagem sem acentos ou distinção de caixa', () => {
  assert.equal(filtrarAvisos(avisos, ' ILUMINACAO ')[0].object, 'Iluminação 01')
  assert.equal(filtrarAvisos(avisos, 'APLICACAO')[0].object, 'Painel')
  assert.equal(filtrarAvisos(avisos, 'categoria').length, 2)
})
test('busca vazia preserva todos, duplicatas e ordem sem alterar os avisos', () => {
  const lista = [...avisos, avisos[0]], antes = JSON.stringify(lista)
  assert.deepEqual(filtrarAvisos(lista, ''), lista)
  assert.notEqual(filtrarAvisos(lista, ''), lista)
  assert.equal(JSON.stringify(lista), antes)
})
test('ausência de resultados e lista vazia são válidas', () => {
  assert.deepEqual(filtrarAvisos(avisos, 'inexistente'), [])
  assert.deepEqual(filtrarAvisos([], ''), [])
})
test('painel limita a tabela a 20 linhas e mostra o total e a paginação', () => {
  const lista = Array.from({ length: 45 }, (_, i) => ({ object: `Objeto ${i}`, message: 'Revisar' }))
  const html = renderToStaticMarkup(React.createElement(PainelAvisos, { avisos: lista, aoExportar() {} }))
  assert.equal((html.match(/scope="row"/g) || []).length, 20)
  assert.ok(html.includes('Página 1 de 3'))
  assert.ok(html.includes('Paginação dos avisos'))
  assert.ok(html.includes('45'))
  assert.ok(!html.includes('Objeto 20</th>'))
})
test('painel sem avisos não mostra paginação e desabilita exportação', () => {
  const html = renderToStaticMarkup(React.createElement(PainelAvisos, { avisos: [], aoExportar() {} }))
  assert.ok(html.includes('Nenhum aviso registrado'))
  assert.ok(!html.includes('<nav'))
  assert.ok(html.includes('disabled=""'))
})
