type CategoriaResumo = {
  categoria: string
  quantidade: number
}

type ResumoCategoriasProps = {
  categorias: CategoriaResumo[]
  totalIncluido: number
  aoExportar: () => void
}

function ResumoCategorias({
  categorias,
  totalIncluido,
  aoExportar,
}: ResumoCategoriasProps) {
  return (
    <section className="resumo-categorias">
      <h3>Quantidades por categoria</h3>

      <button
        type="button"
        onClick={aoExportar}
        disabled={categorias.length === 0}
      >
        Exportar resumo em CSV
      </button>

      <p>
        Apenas objetos incluídos. Este resumo considera o projeto inteiro.
      </p>

      {categorias.length === 0 ? (
        <p>Nenhum objeto incluído no quantitativo.</p>
      ) : (
        <div className="tabela-container">
          <table>
            <caption>
              Contagem dos objetos incluídos por categoria
            </caption>

            <thead>
              <tr>
                <th scope="col">Categoria</th>
                <th scope="col" className="medida">
                  Objetos incluídos
                </th>
              </tr>
            </thead>

            <tbody>
              {categorias.map((item) => (
                <tr key={item.categoria}>
                  <th scope="row">{item.categoria}</th>
                  <td className="medida">
                    {item.quantidade.toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th scope="row">Total incluído</th>
                <td className="medida">
                  <strong>
                    {totalIncluido.toLocaleString('pt-BR')}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p>
        Cada objeto conta como uma unidade ou conjunto do modelo.
        A contagem não representa necessariamente peças de fabricação.
      </p>
    </section>
  )
}

export default ResumoCategorias