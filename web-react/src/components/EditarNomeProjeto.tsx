import { useState } from 'react'

type Props = { nome: string; carregando: boolean; aoRenomear: (nome: string) => void }

function EditarNomeProjeto({ nome, carregando, aoRenomear }: Props) {
  const [rascunho, setRascunho] = useState(nome)
  const [erro, setErro] = useState('')
  return <details className="editar-nome-projeto">
    <summary>Editar nome do projeto</summary>
    <p>Atualiza o nome nesta revisão, no JSON revisado e no relatório para impressão.</p>
    <form onSubmit={(evento) => {
      evento.preventDefault()
      try {
        aoRenomear(rascunho)
        setErro('')
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Não foi possível alterar o nome.')
      }
    }}>
      <label>
        Nome do projeto nesta revisão
        <input type="text" value={rascunho} maxLength={2000} required
          onChange={(evento) => { setRascunho(evento.target.value); setErro('') }} />
      </label>
      <button type="submit" disabled={carregando || !rascunho.trim() || rascunho.trim() === nome}>
        Salvar nome
      </button>
      <button type="button" onClick={() => { setRascunho(nome); setErro('') }}>
        Cancelar edição do nome
      </button>
    </form>
    {erro && <p role="alert" style={{ color: '#b42318' }}>{erro}</p>}
  </details>
}
export default EditarNomeProjeto
