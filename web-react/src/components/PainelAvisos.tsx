import { useState } from 'react'
import type { Aviso } from '../types/cenoquant'
import { filtrarAvisos } from '../utils/filtrarAvisos'
import Paginacao from './Paginacao'

type PainelAvisosProps = {
  avisos: Aviso[]
  aoExportar: () => void
}

function PainelAvisos({ avisos, aoExportar }: PainelAvisosProps) {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const filtrados = filtrarAvisos(avisos, busca)
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / 20))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * 20
  const visiveis = filtrados.slice(inicio, inicio + 20)

  return (
    <section className="resumo-categorias">
      <h3>Avisos da extração</h3>
      <p>
        Estes avisos foram registrados na extração original.
        Alterar categorias ou inclusão na revisão não recalcula os avisos.
        O CSV exporta todos os avisos, independentemente da busca e da página.
      </p>
      <button type="button" onClick={aoExportar} disabled={avisos.length === 0}>
        Exportar avisos em CSV
      </button>
      {avisos.length === 0 ? (
        <p>Nenhum aviso registrado. Isso não garante que a cena esteja livre de problemas.</p>
      ) : (
        <details>
          <summary>Ver avisos ({avisos.length.toLocaleString('pt-BR')})</summary>
          <div className="filtros">
            <label>
              Buscar nos avisos por objeto ou mensagem
              <input type="search" value={busca} placeholder="Ex.: categoria, luz, textura..."
                onChange={(evento) => { setBusca(evento.target.value); setPagina(1) }} />
            </label>
            <button type="button" disabled={!busca}
              onClick={() => { setBusca(''); setPagina(1) }}>
              Limpar busca de avisos
            </button>
          </div>
          <p role="status">
            {filtrados.length.toLocaleString('pt-BR')} de {avisos.length.toLocaleString('pt-BR')} avisos encontrados.
          </p>
          {filtrados.length === 0 ? <p>Nenhum aviso encontrado. Tente outro termo ou limpe a busca.</p> : <>
            <div className="tabela-container">
              <table>
                <caption>Avisos registrados no arquivo importado — até 20 por página</caption>
                <thead><tr>
                  <th scope="col">Objeto ou contexto</th><th scope="col">Aviso</th>
                </tr></thead>
                <tbody>{visiveis.map((aviso, indice) => (
                  <tr key={inicio + indice}>
                    <th scope="row" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>{aviso.object}</th>
                    <td style={{ overflowWrap: 'anywhere' }}>{aviso.message}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <Paginacao pagina={paginaAtual} totalPaginas={totalPaginas}
              aoAlterarPagina={setPagina} rotulo="Paginação dos avisos" />
          </>}
        </details>
      )}
    </section>
  )
}
export default PainelAvisos
