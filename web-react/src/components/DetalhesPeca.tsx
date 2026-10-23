import { useEffect, useRef } from 'react'
import type { Peca } from '../types/cenoquant'

type Props = { peca: Peca | null; aoFechar: () => void }

function DetalhesPeca({ peca, aoFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (peca && dialogo.current && !dialogo.current.open) dialogo.current.showModal()
  }, [peca])
  if (!peca) return null
  const area = peca.surfaces.reduce((soma, superficie) => soma + superficie.areaM2, 0)
  const formatar = (valor: number, casas: number) => valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casas, maximumFractionDigits: casas,
  })
  return (
    <dialog ref={dialogo} className="detalhes-peca" aria-labelledby="titulo-detalhes-peca"
      onClose={aoFechar}>
      <header className="cabecalho-detalhes">
        <div><p>Detalhes do objeto</p><h2 id="titulo-detalhes-peca">{peca.name}</h2></div>
        <button type="button" onClick={() => dialogo.current?.close()}>Fechar detalhes</button>
      </header>
      <dl className="dados-peca">
        <div><dt>Identificador</dt><dd>{peca.id}</dd></div>
        <div><dt>Categoria</dt><dd>{peca.category}</dd></div>
        <div><dt>Inclusão no quantitativo</dt><dd>{peca.included ? 'Incluído' : 'Excluído'}</dd></div>
        <div><dt>Código</dt><dd>{peca.code || 'Sem código'}</dd></div>
        <div><dt>Dimensões X / Y / Z nos eixos do mundo (m)</dt>
          <dd>{peca.dimensionsM.map((d) => formatar(d, 3)).join(' / ')}</dd></div>
        <div><dt>Superfície modelada (m²)</dt>
          <dd>{peca.surfaces.length ? formatar(area, 6) : 'Nenhuma superfície registrada'}</dd></div>
      </dl>
      <h3>Observação</h3>
      <p className="observacao-detalhes">{peca.note || 'Sem observação.'}</p>
      <h3>Superfícies por material</h3>
      {peca.surfaces.length === 0 ? <p>O arquivo não registra superfícies para este objeto.</p> : (
        <div className="tabela-container"><table>
          <caption>Registros de superfície do objeto no arquivo</caption>
          <thead><tr><th scope="col">Material</th><th scope="col">Área medida (m²)</th></tr></thead>
          <tbody>{peca.surfaces.map((s, i) => <tr key={i}>
            <th scope="row">{s.material || '(Material sem nome)'}</th>
            <td className="medida">{formatar(s.areaM2, 6)}</td>
          </tr>)}</tbody>
        </table></div>
      )}
      <p>
        As dimensões são envelopes nos eixos do mundo e podem mudar com a rotação.
        A superfície soma faces modeladas, incluindo frente, verso e espessuras.
        Não representa quantidade final de material para compra. O acréscimo de
        materiais não altera estas medidas.
      </p>
    </dialog>
  )
}
export default DetalhesPeca
