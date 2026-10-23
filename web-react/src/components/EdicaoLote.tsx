import type { AlteracaoPecas } from '../utils/editarPecasEmLote'

type EdicaoLoteProps = {
  quantidadeSelecionada: number
  selecionadosForaDaPagina: number
  quantidadeNaPagina: number
  totalFiltrado: number
  carregando: boolean
  mensagemLote: string
  categorias: string[]
  categoriaLote: string
  codigoLote: string
  observacaoLote: string
  aoSelecionarPagina: () => void
  aoSelecionarResultados: () => void
  aoLimparSelecao: () => void
  aoExportarSelecao: () => void
  aoAlterarCategoria: (valor: string) => void
  aoAlterarCodigo: (valor: string) => void
  aoAlterarObservacao: (valor: string) => void
  aoAplicar: (alteracao: AlteracaoPecas) => void
}

function EdicaoLote({
  quantidadeSelecionada, selecionadosForaDaPagina, quantidadeNaPagina,
  totalFiltrado, carregando, mensagemLote, categorias,
  categoriaLote, codigoLote, observacaoLote,
  aoSelecionarPagina, aoSelecionarResultados, aoLimparSelecao, aoExportarSelecao,
  aoAlterarCategoria, aoAlterarCodigo, aoAlterarObservacao, aoAplicar,
}: EdicaoLoteProps) {
  return (
    <section className="edicao-lote" aria-label="Edição em lote">
      <h3>Edição em lote</h3>
      <p>
        Selecione objetos individualmente, nesta página ou em todos os resultados
        dos filtros, incluindo outras páginas. A seleção é limpa ao mudar os filtros, a ordenação
        ou a página. Selecionar não altera a inclusão no quantitativo.
      </p>
      <p role="status">
        {quantidadeSelecionada.toLocaleString('pt-BR')} objetos selecionados
        {' — '}{selecionadosForaDaPagina.toLocaleString('pt-BR')} em outras páginas.
        {' '}{mensagemLote}
      </p>
      <div className="acoes-selecao">
      <button type="button" disabled={quantidadeNaPagina === 0}
        onClick={aoSelecionarPagina}>
        Selecionar esta página
      </button>
      <button type="button" disabled={totalFiltrado === 0 || carregando}
        onClick={aoSelecionarResultados}>
        Selecionar todos os resultados filtrados ({totalFiltrado.toLocaleString('pt-BR')})
      </button>
      <button type="button" disabled={quantidadeSelecionada === 0}
        onClick={aoLimparSelecao}>
        Limpar seleção
      </button>
      <button type="button" disabled={quantidadeSelecionada === 0 || carregando}
        onClick={aoExportarSelecao}>
        Exportar selecionados em CSV
      </button>
      </div>
      <p>
        O CSV da seleção inclui todos os selecionados, inclusive de outras páginas
        e os excluídos, com a coluna de inclusão no quantitativo. Exportar não altera
        a seleção nem a revisão.
      </p>
      <div className="acoes-classificacao">
      <label>
        Categoria para os selecionados
        <select value={categoriaLote} onChange={(evento) => aoAlterarCategoria(evento.target.value)}>
          <option value="">Escolha uma categoria</option>
          {categorias.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
        </select>
      </label>
      <button type="button" disabled={quantidadeSelecionada === 0 || !categoriaLote}
        onClick={() => aoAplicar({ category: categoriaLote })}>
        Aplicar categoria
      </button>
      <button type="button" disabled={quantidadeSelecionada === 0}
        onClick={() => aoAplicar({ included: true })}>
        Incluir selecionados
      </button>
      <button type="button" disabled={quantidadeSelecionada === 0}
        onClick={() => aoAplicar({ included: false })}>
        Excluir selecionados do quantitativo
      </button>
      </div>
      <fieldset disabled={quantidadeSelecionada === 0 || carregando}>
        <legend>Código e observação dos selecionados</legend>
        <p>
          Cada botão altera apenas seu campo. O texto substitui os valores dos
          selecionados; deixar vazio permite limpar o campo. Atribuir o mesmo
          código pode reunir objetos no resumo agrupado.
        </p>
        <div className="campo-lote">
        <label>
          Código para os selecionados
          <input type="text" value={codigoLote} maxLength={2000}
            onChange={(evento) => aoAlterarCodigo(evento.target.value)} />
        </label>
        <button type="button" onClick={() => aoAplicar({ code: codigoLote })}>
          {codigoLote ? 'Aplicar código aos selecionados' : 'Limpar códigos dos selecionados'}
        </button>
        </div>
        <div className="campo-lote campo-lote-observacao">
        <label>
          Observação para os selecionados
          <textarea value={observacaoLote} rows={3} maxLength={2000}
            onChange={(evento) => aoAlterarObservacao(evento.target.value)} />
        </label>
        <button type="button" onClick={() => aoAplicar({ note: observacaoLote })}>
          {observacaoLote ? 'Aplicar observação aos selecionados' : 'Limpar observações dos selecionados'}
        </button>
        </div>
      </fieldset>
    </section>
  )
}

export default EdicaoLote
