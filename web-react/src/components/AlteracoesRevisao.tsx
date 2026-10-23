import { useState } from 'react'
import type { AlteracaoRevisao } from '../utils/compararRevisao'
import Paginacao from './Paginacao'

type Props = { alteracoes: AlteracaoRevisao[]; erro: string; aoExportar: () => void }

function AlteracoesRevisao({ alteracoes, erro, aoExportar }: Props) {
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(alteracoes.length / 20))
  const atual = Math.min(pagina, totalPaginas)
  const visiveis = alteracoes.slice((atual - 1) * 20, atual * 20)
  const objetos = new Set(alteracoes.map((a) => a.id)).size
  return <section className="resumo-categorias">
    <h3>Alterações da revisão</h3>
    <p>
      Compara categoria, inclusão, código e observação com o último JSON importado,
      em todo o projeto, inclusive objetos excluídos. Não é um histórico de ações;
      voltar ao valor do arquivo remove a diferença. Não compara geometria, percentual
      ou a lista de categorias. Reimportar um JSON revisado cria uma nova referência.
    </p>
    {erro ? <p role="alert">{erro}</p> : <>
      <p role="status">{objetos.toLocaleString('pt-BR')} objetos com diferenças
        {' · '}{alteracoes.length.toLocaleString('pt-BR')} campos alterados.</p>
      <button type="button" disabled={alteracoes.length === 0} onClick={aoExportar}>
        Exportar alterações em CSV
      </button>
      {alteracoes.length === 0 ? <p>Nenhuma diferença nos campos comparados.</p> : <details>
        <summary>Ver alterações</summary>
        <div className="tabela-container"><table>
          <caption>Diferenças em relação ao JSON importado</caption>
          <thead><tr><th scope="col">Objeto</th><th scope="col">Campo</th>
            <th scope="col">No JSON importado</th><th scope="col">Na revisão atual</th></tr></thead>
          <tbody>{visiveis.map((a) => <tr key={JSON.stringify([a.id, a.campo])}>
            <th scope="row">{a.nome}</th><td>{a.campo}</td>
            <td style={{ whiteSpace: 'pre-wrap' }}>{a.antes || '(vazio)'}</td>
            <td style={{ whiteSpace: 'pre-wrap' }}>{a.depois || '(vazio)'}</td>
          </tr>)}</tbody>
        </table></div>
        <Paginacao pagina={atual} totalPaginas={totalPaginas} aoAlterarPagina={setPagina} />
      </details>}
    </>}
  </section>
}
export default AlteracoesRevisao
