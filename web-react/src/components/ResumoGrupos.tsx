import { useState } from 'react'
import type { GrupoPecas } from '../utils/calcularGrupos'
import Paginacao from './Paginacao'

type Props = { grupos: GrupoPecas[]; aoExportar: () => void }

function ResumoGrupos({ grupos, aoExportar }: Props) {
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(grupos.length / 20))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = grupos.slice((paginaAtual - 1) * 20, paginaAtual * 20)
  const formatar = (valor: number, casas: number) => valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas, maximumFractionDigits: casas,
  })
  return (
    <section className="resumo-categorias">
      <h3>Resumo agrupado por código</h3>
      <p>
        Apenas objetos incluídos do projeto inteiro. Agrupa categoria, código,
        dimensões nos eixos do mundo (arredondadas a seis casas) e nomes de materiais.
        Objetos sem código permanecem separados. Observações não definem grupos;
        consulte o CSV detalhado para revisar cada objeto. O agrupamento não garante
        equivalência de fabricação.
      </p>
      <button type="button" disabled={grupos.length === 0} onClick={aoExportar}>
        Exportar grupos em CSV
      </button>
      {grupos.length === 0 ? <p>Nenhum objeto incluído para agrupar.</p> : (
        <details>
          <summary>Ver grupos ({grupos.length.toLocaleString('pt-BR')})</summary>
          <div className="tabela-container">
            <table>
              <caption>Grupos de objetos incluídos</caption>
              <thead><tr>
                <th scope="col">Categoria</th><th scope="col">Código ou objeto sem código</th>
                <th scope="col">Quantidade de objetos</th><th scope="col">X / Y / Z mundo (m)</th>
                <th scope="col">Superfície total (m²)</th><th scope="col">Materiais</th>
              </tr></thead>
              <tbody>{visiveis.map((grupo) => <tr key={grupo.chave}>
                <td>{grupo.categoria}</td><th scope="row">{grupo.codigo || grupo.objeto}</th>
                <td className="medida">{grupo.quantidade.toLocaleString('pt-BR')}</td>
                <td>{grupo.dimensoes.map((d) => formatar(d, 6)).join(' / ')}</td>
                <td className="medida">{formatar(grupo.areaM2, 2)}</td>
                <td>{grupo.materiais.join(' | ') || 'Sem superfícies'}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas} aoAlterarPagina={setPagina} />
        </details>
      )}
    </section>
  )
}
export default ResumoGrupos
