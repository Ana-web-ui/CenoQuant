import type { MaterialResumo } from '../utils/calcularResumoMateriais'
import type { Projeto } from '../types/cenoquant'
import { aplicarAcrescimo } from '../utils/acrescimoMaterial'

type Props = {
  projeto: Projeto
  categorias: { categoria: string; quantidade: number }[]
  materiais: MaterialResumo[]
  porCategoria?: boolean
  totalIncluido: number
  superficie: number
  acrescimo: number
  quantidadeAvisos: number
}

function texto(valor: unknown): string {
  return typeof valor === 'string' && valor.trim() ? valor : 'Não informado'
}

function RelatorioImpressao({
  projeto, categorias, materiais, porCategoria = false, totalIncluido, superficie, acrescimo, quantidadeAvisos,
}: Props) {
  const original = projeto.arquivoOriginal.project
  const metadados = original && typeof original === 'object'
    ? original as Record<string, unknown> : {}
  const data = typeof metadados.extractedAt === 'string' ? new Date(metadados.extractedAt) : null
  const dataExtracao = data && Number.isFinite(data.getTime())
    ? data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' (Brasília)'
    : 'Não informada'
  const area = (valor: number) => valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })
  const inteiro = (valor: number) => valor.toLocaleString('pt-BR')

  return (
    <article className="relatorio-impressao" aria-label="Relatório de revisão para impressão">
      <header>
        <p>TV1 · Ceno Quant</p>
        <h1>Relatório de revisão</h1>
        <h2>{projeto.nome}</h2>
      </header>
      <dl>
        <dt>Aplicativo de origem</dt><dd>{texto(metadados.application)}</dd>
        <dt>Fonte</dt><dd>{texto(metadados.source)}</dd>
        <dt>Cena</dt><dd>{texto(metadados.scene)}</dd>
        <dt>Extraído em</dt><dd>{dataExtracao}</dd>
        <dt>Escopo da extração</dt><dd>{texto(metadados.scope)}</dd>
      </dl>
      <p>
        {inteiro(projeto.pecas.length)} objetos no arquivo · {inteiro(totalIncluido)} incluídos
        {' · '}{inteiro(projeto.pecas.length - totalIncluido)} excluídos.
      </p>
      <p><strong>Superfície medida dos incluídos: {area(superficie)} m².</strong></p>
      <p>
        Este relatório considera o projeto inteiro na revisão atual, independentemente
        dos filtros da tela. Cada objeto representa uma unidade ou conjunto do modelo.
        As áreas somam faces modeladas, incluindo frente, verso e espessuras;
        não são diretamente área de piso ou quantidade para compra. Dimensões e
        agrupamentos exigem revisão de fabricação. Não é orçamento ou plano de corte.
      </p>
      <h2>Quantidades por categoria</h2>
      {categorias.length === 0 ? <p>Nenhum objeto incluído.</p> : <table>
        <thead><tr><th scope="col">Categoria</th><th scope="col">Objetos incluídos</th></tr></thead>
        <tbody>{categorias.map((c) => <tr key={c.categoria}>
          <th scope="row">{c.categoria}</th><td>{inteiro(c.quantidade)}</td>
        </tr>)}</tbody>
      </table>}
      <p><strong>Total incluído: {inteiro(totalIncluido)}</strong></p>
      <h2>Superfície por material</h2>
      <p>
        Acréscimo opcional: {area(acrescimo)}%. Percentual definido por quem revisa;
        não é recomendação de perda. Agrupamento: {porCategoria ? 'categoria e material' : 'material no projeto inteiro'}.
      </p>
      {materiais.length === 0 ? <p>Nenhuma superfície disponível nos objetos incluídos.</p> : <table>
        <thead><tr>
          {porCategoria && <th scope="col">Categoria</th>}
          <th scope="col">Material</th><th scope="col">Medida (m²)</th>
          <th scope="col">Com acréscimo (m²)</th>
        </tr></thead>
        <tbody>{materiais.map((m) => <tr key={JSON.stringify([m.categoria, m.material])}>
          {porCategoria && <td>{m.categoria}</td>}
          <th scope="row">{m.material}</th><td>{area(m.areaM2)}</td>
          <td>{area(aplicarAcrescimo(m.areaM2, acrescimo))}</td>
        </tr>)}</tbody>
      </table>}
      <p>
        <strong>Total medido: {area(superficie)} m² · Com acréscimo: {area(aplicarAcrescimo(superficie, acrescimo))} m².</strong>
        {' '}Os totais usam os valores completos; linhas exibidas com duas casas podem apresentar diferença de arredondamento.
      </p>
      <h2>Avisos da extração</h2>
      <p>
        {inteiro(quantidadeAvisos)} avisos registrados. Os avisos não são recalculados
        após a revisão. Consulte a lista completa no painel ou no CSV de avisos.
        A ausência de avisos não garante que a cena esteja livre de problemas.
      </p>
      <p>Use o JSON revisado para guardar e retomar a revisão. Os CSVs contêm os relatórios detalhados.</p>
    </article>
  )
}
export default RelatorioImpressao
