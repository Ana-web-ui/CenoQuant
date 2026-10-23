import type { FiltroConferencia } from '../utils/conferirPecas'
import type { OrdemPecas } from '../utils/ordenarPecas'
import type { FiltroInclusao } from '../utils/filtrarPecas'

type FiltrosPecasProps = {
  conferencia: FiltroConferencia
  aoAlterarConferencia: (valor: FiltroConferencia) => void
  busca: string
  categoria: string
  categorias: string[]
  materiais: string[]
  material: string | null
  aoAlterarMaterial: (valor: string | null) => void
  inclusao: FiltroInclusao
  ordem: OrdemPecas
  aoAlterarOrdem: (valor: OrdemPecas) => void
  aoAlterarBusca: (valor: string) => void
  aoAlterarCategoria: (valor: string) => void
  aoAlterarInclusao: (valor: FiltroInclusao) => void
  aoLimpar: () => void
}

function FiltrosPecas({
  busca, categoria, categorias, materiais, material, aoAlterarMaterial, inclusao, ordem, aoAlterarOrdem, conferencia, aoAlterarConferencia,
  aoAlterarBusca, aoAlterarCategoria, aoAlterarInclusao, aoLimpar,
}: FiltrosPecasProps) {
  return (
    <>
    <div className="filtros">
      <label>
        Buscar por nome, código ou observação
        <input type="search" placeholder="Ex.: piso, P01, revisar..."
          value={busca} onChange={(evento) => aoAlterarBusca(evento.target.value)} />
      </label>
      <label>
        Categoria
        <select value={categoria} onChange={(evento) => aoAlterarCategoria(evento.target.value)}>
          <option value="">Todas as categorias</option>
          {categorias.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
        </select>
      </label>
      <button type="button" onClick={aoLimpar}>Limpar filtros</button>
    </div>
    <details className="filtros-adicionais">
      <summary>Mais filtros e ordenação{(material !== null || inclusao !== 'todos' || conferencia !== 'todas' || ordem !== 'original') ? ' · opções ativas' : ''}</summary>
      <div className="filtros">
      <label>
        Material usado pelo objeto
        <select value={material === null ? 'todos' : JSON.stringify(material)}
          onChange={(evento) => aoAlterarMaterial(
            evento.target.value === 'todos' ? null : JSON.parse(evento.target.value) as string,
          )}>
          <option value="todos">Todos os materiais</option>
          {materiais.map((nome) => <option key={nome} value={JSON.stringify(nome)}>
            {nome === '' ? '(Material sem nome)' : nome.trim() !== nome ? JSON.stringify(nome) : nome}
          </option>)}
        </select>
      </label>
      <label>
        Inclusão no quantitativo
        <select value={inclusao}
          onChange={(evento) => aoAlterarInclusao(evento.target.value as FiltroInclusao)}>
          <option value="todos">Todos os objetos</option>
          <option value="incluidos">Apenas incluídos</option>
          <option value="excluidos">Apenas excluídos</option>
        </select>
      </label>
      <label>
        Conferência
        <select value={conferencia}
          onChange={(evento) => aoAlterarConferencia(evento.target.value as FiltroConferencia)}>
          <option value="todas">Todas as situações</option>
          <option value="sem-categoria">Sem categoria</option>
          <option value="sem-codigo">Sem código</option>
          <option value="sem-superficies">Sem superfícies registradas</option>
          <option value="material-sem-nome">Com material sem nome</option>
        </select>
      </label>
      <label>
        Ordenar objetos
        <select value={ordem} onChange={(evento) => aoAlterarOrdem(evento.target.value as OrdemPecas)}>
          <option value="original">Ordem do arquivo</option>
          <option value="nome-asc">Nome: A–Z (ordem natural)</option>
          <option value="nome-desc">Nome: Z–A</option>
          <option value="codigo">Código: A–Z (sem código ao final)</option>
          <option value="categoria">Categoria: A–Z</option>
          <option value="area-desc">Superfície: maior primeiro</option>
          <option value="area-asc">Superfície: menor primeiro</option>
          <option value="x-desc">Dimensão X mundo: maior primeiro</option>
          <option value="y-desc">Dimensão Y mundo: maior primeiro</option>
          <option value="z-desc">Dimensão Z mundo: maior primeiro</option>
        </select>
      </label>
      </div>
    </details>
    </>
  )
}
export default FiltrosPecas
