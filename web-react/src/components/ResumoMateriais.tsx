import { aplicarAcrescimo } from '../utils/acrescimoMaterial'
import type { MaterialResumo } from '../utils/calcularResumoMateriais'

type Props = {
  materiais: MaterialResumo[]
  superficieTotal: number
  aoExportar: () => void
  acrescimo: number
  aoAlterarAcrescimo: (valor: number) => void
  porCategoria: boolean
  aoAlterarAgrupamento: (valor: boolean) => void
}
function formatarArea(valor: number) {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function ResumoMateriais({ materiais, superficieTotal, aoExportar, acrescimo,
  aoAlterarAcrescimo, porCategoria, aoAlterarAgrupamento }: Props) {
  return <section className="resumo-categorias">
    <h3>Superfície por material</h3>
    <p>Apenas objetos incluídos do projeto inteiro. Os filtros da lista não alteram este resumo.
      Materiais são agrupados pelo nome; a opção por categoria separa seu uso em cada categoria.</p>
    <div className="filtros">
      <label>Agrupar materiais
        <select value={porCategoria ? 'categoria' : 'geral'}
          onChange={(evento) => aoAlterarAgrupamento(evento.target.value === 'categoria')}>
          <option value="geral">Por material no projeto inteiro</option>
          <option value="categoria">Por categoria e material</option>
        </select>
      </label>
      <label>Acréscimo opcional de área (%)
        <input type="number" min={0} max={100} step="any" value={acrescimo}
          onChange={(evento) => {
            const valor = evento.target.valueAsNumber
            if (Number.isFinite(valor) && valor >= 0 && valor <= 100) aoAlterarAcrescimo(valor)
          }} />
      </label>
      <button type="button" onClick={aoExportar} disabled={materiais.length === 0}>Exportar materiais em CSV</button>
    </div>
    <p>O CSV e o relatório de impressão seguem o agrupamento escolhido. O percentual é definido
      por quem revisa e é apenas um multiplicador da área, sem representar recomendação de perda
      ou quantidade final para compra. A superfície medida e as quantidades de objetos permanecem iguais.</p>
    {materiais.length === 0 ? <p>Nenhuma superfície disponível nos objetos incluídos.</p> :
      <div className="tabela-container"><table>
        <caption>{porCategoria ? 'Área modelada por categoria e material' : 'Área modelada por material'}</caption>
        <thead><tr>
          {porCategoria && <th scope="col">Categoria</th>}
          <th scope="col">Material</th><th scope="col" className="medida">Superfície medida (m²)</th>
          <th scope="col" className="medida">Área com acréscimo (m²)</th>
        </tr></thead>
        <tbody>{materiais.map((item) => <tr key={JSON.stringify([item.categoria, item.material])}>
          {porCategoria && <td>{item.categoria}</td>}
          <th scope="row">{item.material}</th><td className="medida">{formatarArea(item.areaM2)}</td>
          <td className="medida">{formatarArea(aplicarAcrescimo(item.areaM2, acrescimo))}</td>
        </tr>)}</tbody>
        <tfoot><tr>
          <th scope="row" colSpan={porCategoria ? 2 : 1}>Total de superfície</th>
          <td className="medida"><strong>{formatarArea(superficieTotal)}</strong></td>
          <td className="medida"><strong>{formatarArea(aplicarAcrescimo(superficieTotal, acrescimo))}</strong></td>
        </tr></tfoot>
      </table></div>}
    <p>As áreas incluem as faces modeladas, como frente, verso e espessuras.
      Revise antes de converter esses valores em quantidades para compra.</p>
  </section>
}
export default ResumoMateriais
