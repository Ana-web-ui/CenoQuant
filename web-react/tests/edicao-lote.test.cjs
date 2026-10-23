const { test } = require('node:test')
const assert = require('node:assert/strict')
const loadTs = require('./helpers/loadTs.cjs')
const { editarPecasEmLote, descreverAlteracaoLote } = loadTs('src/utils/editarPecasEmLote.ts')
const base = { id: 'a', name: 'Painel', code: 'Antigo', note: 'Nota original', category: 'Painéis',
  included: true, dimensionsM: [1, 2, 3], surfaces: [{ material: 'MDF', areaM2: 5 }] }

test('código em lote altera apenas selecionados e preserva observação e medidas', () => {
  const pecas = [base, { ...base, id: 'b' }]
  const result = editarPecasEmLote(pecas, new Set(['a']), { code: 'P01' })
  assert.equal(result[0].code, 'P01'); assert.equal(result[0].note, 'Nota original')
  assert.equal(result[0].surfaces, base.surfaces); assert.equal(result[0].dimensionsM, base.dimensionsM)
  assert.equal(result[1], pecas[1]); assert.equal(base.code, 'Antigo')
})
test('observação suporta aspas, separadores e múltiplas linhas sem alterar código', () => {
  const note = 'Rever "peça"; acabamento\nSegunda linha'
  const result = editarPecasEmLote([base], new Set(['a']), { note })
  assert.equal(result[0].note, note); assert.equal(result[0].code, 'Antigo')
})
test('texto vazio limpa somente o campo solicitado', () => {
  const result = editarPecasEmLote([base], new Set(['a']), { code: '' })
  assert.equal(result[0].code, ''); assert.equal(result[0].note, base.note)
  assert.equal(editarPecasEmLote([base], new Set(['a']), { note: '' })[0].note, '')
})
test('limites e tipos inválidos são rejeitados', () => {
  for (const patch of [{ note: 'a'.repeat(2001) }, { code: 123 }, { included: 'false' }]) {
    assert.throws(() => editarPecasEmLote([base], new Set(['a']), patch))
  }
})
test('seleção vazia e reinclusão preservam campos não alterados', () => {
  assert.equal(editarPecasEmLote([base], new Set(), { code: 'Novo' })[0], base)
  const result = editarPecasEmLote([{ ...base, included: false }], new Set(['a']), { included: true })
  assert.equal(result[0].included, true); assert.equal(result[0].code, base.code)
})
test('confirmação descreve aplicação e limpeza dos campos corretos', () => {
  assert.match(descreverAlteracaoLote({ code: 'P01' }), /código "P01"/)
  assert.equal(descreverAlteracaoLote({ code: '' }), 'Limpar os códigos')
  assert.equal(descreverAlteracaoLote({ note: '' }), 'Limpar as observações')
  assert.match(descreverAlteracaoLote({ note: 'Novo' }), /Substituir as observações/)
})

function montarAcao(confirmou) {
  const fs = require('node:fs'), ts = require('typescript')
  const source = fs.readFileSync('src/App.tsx', 'utf8')
  const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let trecho
  function visitar(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'aplicarEmLote') trecho = node.getText(ast)
    ts.forEachChild(node, visitar)
  }
  visitar(ast)
  const js = ts.transpileModule(trecho, {}).outputText
  return new Function('base', 'editarPecasEmLote', 'descreverAlteracaoLote', 'confirmou', `
    let projeto = { pecas: [base] }, anterior = null, selecionados = new Set(['a']);
    const pecasVisiveis = [base], window = { confirm: () => confirmou };
    const registrarAlteracao = () => anterior = projeto;
    const setProjeto = f => projeto = f(projeto), setSelecionados = v => selecionados = v;
    const setPagina = () => {}, setMensagemLote = () => {};
    ${js}
    return { aplicar: aplicarEmLote, estado: () => ({projeto, anterior, selecionados}) };
  `)(base, editarPecasEmLote, descreverAlteracaoLote, confirmou)
}

test('cancelar texto em lote preserva objeto, seleção e estado anterior', () => {
  const acao = montarAcao(false)
  acao.aplicar({ code: 'P01' })
  assert.equal(acao.estado().projeto.pecas[0], base)
  assert.equal(acao.estado().selecionados.size, 1)
  assert.equal(acao.estado().anterior, null)
})
test('confirmar limpeza mantém estado anterior para desfazer e limpa seleção', () => {
  const acao = montarAcao(true)
  acao.aplicar({ note: '' })
  assert.equal(acao.estado().projeto.pecas[0].note, '')
  assert.equal(acao.estado().anterior.pecas[0].note, 'Nota original')
  assert.equal(acao.estado().selecionados.size, 0)
})
