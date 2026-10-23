const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { renomearProjeto } = loadTs('src/utils/renomearProjeto.ts')
const { validarProjeto, recuperarRevisao } = loadTs('src/utils/validarProjeto.ts')
const arquivo = () => ({ schema: 'ceno-quant/1', project: { name: 'Original', source: 'blender',
  extractedAt: '2026-10-23T10:00:00-03:00', scene: 'Cena', scope: 'Selecionados' },
  pieces: [{ id: 'a', name: 'Painel', category: 'Painéis', code: '', note: '',
    dimensionsM: [1, 2, 3], included: true, surfaces: [{ material: 'MDF', areaM2: 5 }] }],
  warnings: [], lossPercent: 10, customCategories: ['Especial'] })

test('renomear atualiza nome e metadado sem alterar origem ou geometria', () => {
  const original = validarProjeto(arquivo()), antes = JSON.stringify(original)
  const novo = renomearProjeto(original, '  Stand TV1 — revisão 2  ')
  assert.equal(novo.nome, 'Stand TV1 — revisão 2')
  assert.equal(novo.arquivoOriginal.project.name, novo.nome)
  assert.equal(novo.pecas, original.pecas)
  assert.equal(novo.arquivoOriginal.pieces, original.arquivoOriginal.pieces)
  assert.equal(novo.arquivoOriginal.project.scene, 'Cena')
  assert.equal(novo.arquivoOriginal.lossPercent, 10)
  assert.equal(JSON.stringify(original), antes)
})
test('nome atualizado é recuperado e reimportado pelo JSON', () => {
  const novo = renomearProjeto(validarProjeto(arquivo()), 'Projeto revisado')
  assert.equal(recuperarRevisao(JSON.parse(JSON.stringify(novo))).nome, 'Projeto revisado')
  assert.equal(validarProjeto(JSON.parse(JSON.stringify(novo.arquivoOriginal))).nome, 'Projeto revisado')
})
test('nome vazio, tipo incorreto ou acima do limite é rejeitado', () => {
  for (const nome of ['', '   ', 123, 'a'.repeat(2001)]) {
    assert.throws(() => renomearProjeto(validarProjeto(arquivo()), nome))
  }
})
test('mesmo nome não cria alteração e estado anterior continua disponível para desfazer', () => {
  const original = validarProjeto(arquivo())
  assert.equal(renomearProjeto(original, ' Original '), original)
  const novo = renomearProjeto(original, 'Novo')
  assert.notEqual(novo, original)
  assert.equal(original.nome, 'Original')
  assert.equal(original.arquivoOriginal.project.name, 'Original')
})
