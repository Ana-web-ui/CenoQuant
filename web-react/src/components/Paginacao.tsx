type PaginacaoProps ={
    pagina: number
    totalPaginas: number
    aoAlterarPagina: (pagina: number) => void
}

function Paginacao({
    pagina,
    totalPaginas,
    aoAlterarPagina,
} : PaginacaoProps) {
    return (
        <nav className="paginacao" aria-label="Páginnas da tabela">
            <button
            type="button"
            disabled={pagina <= 1}
            onClick={() => aoAlterarPagina(pagina - 1)}
            >
                Anterior
            </button>

            <span aria-live="polite">
                Página {pagina} de {totalPaginas}
            </span>

            <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => aoAlterarPagina(pagina + 1)}
            >
                Próxima
            </button>
        </nav>
    ) 
}

export default Paginacao