import { useState } from 'react'
import type { Peca } from '../types/cenoquant'

type Props = {
  categorias: string[]
  pecas: Peca[]
  carregando: boolean
  aoRenomear: (origem: string, destino: string) => boolean
}
function RenomearCategoria({ categorias, pecas, carregando, aoRenomear }: Props) {
  const [origem, setOrigem] = useState('')
  const [destino, setDestino] = useState('')
  const [erro, setErro] = useState('')
  const afetados = pecas.filter((p) => p.category === origem)
  const excluidos = afetados.filter((p) => !p.included).length
  return <details className="renomear-categoria">
    <summary>Renomear categoria no projeto inteiro</summary>
    <p>
      Altera todos os objetos dessa categoria, inclusive os excluídos e os que estão
      fora dos filtros. Categorias padrão continuam disponíveis como opções após
      a mudança. O nome de destino deve ser novo.
    </p>
    <form onSubmit={(evento) => {
      evento.preventDefault()
      try {
        if (aoRenomear(origem, destino)) {
          setOrigem(''); setDestino(''); setErro('')
        }
      } catch (erro) {
        setErro(erro instanceof Error ? erro.message : 'Não foi possível renomear a categoria.')
      }
    }}>
      <label>Categoria atual
        <select value={origem} onChange={(evento) => { setOrigem(evento.target.value); setErro('') }}>
          <option value="">Escolha uma categoria</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label>Novo nome da categoria
        <input type="text" maxLength={2000} value={destino}
          onChange={(evento) => { setDestino(evento.target.value); setErro('') }} />
      </label>
      <button type="submit" disabled={carregando || !categorias.includes(origem) || !destino.trim() || destino.trim() === origem}>
        Renomear categoria
      </button>
    </form>
    {origem && <p role="status">
      {afetados.length.toLocaleString('pt-BR')} objetos serão afetados
      {' — '}{excluidos.toLocaleString('pt-BR')} excluídos do quantitativo.
    </p>}
    {erro && <p role="alert" style={{ color: '#b42318' }}>{erro}</p>}
  </details>
}
export default RenomearCategoria
