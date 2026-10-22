type FitrosPecaProps = {
    busca: string
    categoria: string
    categorias: string[]
    aoAlterarBusca: (valor: string) => void
    aoAlterarCategoria: (valor: string) => void
    aoLimpar: () => void
}

function FiltrosPecas({
    busca,
    categoria,
    categorias,
    aoAlterarBusca,
    aoAlterarCategoria,
    aoLimpar,
}: FitrosPecaProps) {
    return (
        <div className="filtros">
            <label>
                Buscar por nome
            <input
            type="search"
            placeholder="Ex.:piso, parede, LED..."
            value={busca}
            onChange={(evento) => aoAlterarBusca(evento.target.value)}
            />
            </label>

        <label>
            Categoria
            <select
            value={categoria}
            onChange={(evento) => aoAlterarCategoria(evento.target.value)}
            >
                <option value="">Todas as categorias</option>
                {categorias.map((nome) => (
                <option key={nome} value={nome}>
                    {nome}
                </option>
                ))}
        </select>
        </label>

        <button type="button" onClick={aoLimpar}>

        </button>
        </div>
    )
}

export default FiltrosPecas