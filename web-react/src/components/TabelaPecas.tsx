import type { Peca } from "../types/cenoquant"



type TabelaPecasProps = {
  pecas: Peca[]
  categorias: string[]
  aoAlterarInclusao: (id: string, incluir: boolean) => void
  aoAlterarCategoria: (id: string, categoria: string) => void
}

function formatarMedida(valor: number) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

function TabelaPecas({
  pecas,
  categorias,
  aoAlterarInclusao,
  aoAlterarCategoria,
}: TabelaPecasProps) {
  return (
    <>
      <p id="aviso-dimensoes">
        Dimensões em metros, nos eixos X, Y e Z do mundo.
        A rotação do objeto pode alterar essas medidas.
      </p>

      <div className="tabela-container">
        <table aria-describedby="aviso-dimensoes">
          <caption>Objetos importados do projeto</caption>

          <thead>
            <tr>
              <th scope="col">Incluir</th>
              <th scope="col">Nome</th>
              <th scope="col">Categoria</th>
              <th scope="col">X (m)</th>
              <th scope="col">Y (m)</th>
              <th scope="col">Z (m)</th>
            </tr>
          </thead>

          <tbody>
            {pecas.map((peca) => (
              <tr
                key={peca.id}
                className={peca.included ? '' : 'peca-excluida'}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={peca.included}
                    aria-label={`Incluir ${peca.name} no quantitativo`}
                    onChange={(evento) =>
                      aoAlterarInclusao(peca.id, evento.target.checked)
                    }
                  />
                </td>

                <td>{peca.name}</td>

                <td>
                  <select
                    className="categoria-peca"
                    aria-label={`Categoria de ${peca.name}`}
                    value={peca.category}
                    onChange={(evento) =>
                      aoAlterarCategoria(peca.id, evento.target.value)
                    }
                  >
                    {categorias.map((nome) => (
                      <option key={nome} value={nome}>
                        {nome}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="medida">
                  {formatarMedida(peca.dimensionsM[0])}
                </td>
                <td className="medida">
                  {formatarMedida(peca.dimensionsM[1])}
                </td>
                <td className="medida">
                  {formatarMedida(peca.dimensionsM[2])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default TabelaPecas