import type { ComponentProps } from 'react'
import EditarNomeProjeto from './EditarNomeProjeto'
import EdicaoLote from './EdicaoLote'
import ResumoCategorias from './ResumoCategorias'
import ResumoMateriais from './ResumoMateriais'
import ResumoGrupos from './ResumoGrupos'
import AlteracoesRevisao from './AlteracoesRevisao'
import PainelAvisos from './PainelAvisos'
import RenomearCategoria from './RenomearCategoria'
import ConferenciaRevisao from './ConferenciaRevisao'

type OpcoesAvancadasProps = {
  nomeProjeto: ComponentProps<typeof EditarNomeProjeto>
  historico: { podeDesfazer: boolean; mensagem: string; aoDesfazer: () => void }
  edicaoLote: ComponentProps<typeof EdicaoLote>
  superficie: number
  resumoCategorias: ComponentProps<typeof ResumoCategorias>
  resumoMateriais: ComponentProps<typeof ResumoMateriais>
  resumoGrupos: ComponentProps<typeof ResumoGrupos>
  alteracoes: ComponentProps<typeof AlteracoesRevisao>
  avisos: ComponentProps<typeof PainelAvisos>
  erroAvisos: string
  criacaoCategoria: {
    nome: string; mensagem: string; erro: boolean
    aoCriar: () => void; aoAlterarNome: (nome: string) => void
  }
  renomearCategoria: ComponentProps<typeof RenomearCategoria>
  conferencia: ComponentProps<typeof ConferenciaRevisao>
}

function OpcoesAvancadas({
  nomeProjeto, historico, edicaoLote, superficie, resumoCategorias,
  resumoMateriais, resumoGrupos, alteracoes, avisos, erroAvisos,
  criacaoCategoria, renomearCategoria, conferencia,
}: OpcoesAvancadasProps) {
  return (
    <details className="opcoes-avancadas" id="opcoes-avancadas">
      <summary>Opções avançadas — resumos, edição em lote e conferência</summary>
      <div className="conteudo-avancado">
        <h3>Projeto e histórico</h3>
    <EditarNomeProjeto key={nomeProjeto.nome} {...nomeProjeto} />
    <button type="button" onClick={historico.aoDesfazer}
      disabled={!historico.podeDesfazer || nomeProjeto.carregando}>
      Desfazer última alteração
    </button>
    <p>
      Desfaz uma alteração nesta sessão, incluindo uma edição em lote.
      Em Código e Observação, desfaz o texto digitado desde a entrada no campo.
      A opção é limpa ao atualizar a página ou importar outro projeto.
    </p>
    <p role="status">{historico.mensagem}</p>
    <EdicaoLote {...edicaoLote} />

    <p aria-live="polite">
      Superfície medida dos objetos incluídos:{' '}
      <strong>
        {superficie.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{' '}
        m²
      </strong>
    </p>

    <p>
      Esta medida soma as faces da geometria, incluindo frente,
      verso e espessuras modeladas. Não representa diretamente
      área de piso ou quantidade de material para compra.
      O total considera o projeto inteiro, independentemente dos filtros.
    </p>

<ResumoCategorias {...resumoCategorias} />

    <ResumoMateriais {...resumoMateriais} />

    <ResumoGrupos {...resumoGrupos} />
    <AlteracoesRevisao {...alteracoes} />

    {erroAvisos ? (
      <p role="alert">{erroAvisos}</p>
    ) : (
      <PainelAvisos {...avisos} />
    )}

    <section aria-label="Categorias personalizadas">
      <h3>Criar categoria</h3>
      <p>
        Adiciona uma opção às listas deste projeto sem reclassificar objetos.
        Categorias sem objetos incluídos não aparecem no resumo por categoria.
      </p>
      <form onSubmit={(evento) => { evento.preventDefault(); criacaoCategoria.aoCriar() }}>
        <label>
          Nome da nova categoria
          <input type="text" value={criacaoCategoria.nome} maxLength={2000}
            onChange={(evento) => criacaoCategoria.aoAlterarNome(evento.target.value)} />
        </label>
        <button type="submit" disabled={!criacaoCategoria.nome.trim() || nomeProjeto.carregando}>
          Criar categoria
        </button>
      </form>
      <p role={criacaoCategoria.erro ? 'alert' : 'status'}
        style={{ color: criacaoCategoria.erro ? '#b42318' : undefined }}>
        {criacaoCategoria.mensagem}
      </p>
    </section>

    <RenomearCategoria {...renomearCategoria} />

    <ConferenciaRevisao {...conferencia} />
      </div>
    </details>
  )
}

export default OpcoesAvancadas
