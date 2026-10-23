import type { FiltroConferencia, IndicadorConferencia } from '../utils/conferirPecas'

type Props = {
  indicadores: IndicadorConferencia[]
  aoConferir: (filtro: FiltroConferencia) => void
}
function ConferenciaRevisao({ indicadores, aoConferir }: Props) {
  return <section className="conferencia-revisao" aria-label="Conferência da revisão">
    <h3>Conferência da revisão</h3>
    <p>
      Indicadores dos objetos incluídos no projeto inteiro. Um objeto pode aparecer
      em mais de um indicador. Código é opcional; estes sinais orientam a conferência
      e não significam automaticamente erro. Ter todos os indicadores zerados não
      garante que o levantamento esteja pronto para produção.
    </p>
    <div className="indicadores-conferencia">
      {indicadores.map((indicador) => <div key={indicador.filtro}>
        <span>{indicador.titulo}</span>
        <strong>{indicador.quantidade.toLocaleString('pt-BR')}</strong>
        <button type="button" disabled={indicador.quantidade === 0}
          aria-label={`Ver objetos incluídos: ${indicador.titulo}`}
          onClick={() => aoConferir(indicador.filtro)}>Ver objetos</button>
      </div>)}
    </div>
    <p>Os atalhos ajustam os filtros da tabela principal e limpam a seleção atual.</p>
  </section>
}
export default ConferenciaRevisao

