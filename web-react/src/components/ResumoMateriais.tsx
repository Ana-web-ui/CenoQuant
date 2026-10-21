type MaterialResumo = {
    material: string
    areaM2: number
}

type ResumoMateriaisProps = {
    materiais: MaterialResumo[]
    superficieTotal: number
    aoExportar: () => void
}

function formatarArea(area: number) {
    return area.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })
}

function ResumoMateriais({
    materiais,
    superficieTotal,
    aoExportar,
}: ResumoMateriaisProps) {
    return(
        <section className="resumo-categorias">
            <h3>Superfície por material</h3>

            <button
            type="button"
            onClick={aoExportar}
            disabled={materiais.length === 0}
            >
                Exportar materiais em CSV
            </button>

            <p>
                Apenas objetos incluídos. Os filtros da lista não alteram este resumo. Materiais são agrupados pelo nome.
                </p> 

                {materiais.length === 0 ? (
                    <p>Nenhuma superfície disponível nos objetos incluídos</p>
                ) : (
                    <div className="tabela-container">
                        <table>
                            <caption>Área modelada por material</caption>

                            <thead>
                                <tr>
                                    <th scope="col">Material</th>
                                    <th scope="col" className="medida">Superfície (m²)</th>
                                </tr>
                            </thead>

                            <tbody>
                                {materiais.map((item) => (
                                    <tr key={item.material}>
                                      <th scope="row">{item.material}</th>
                                      <td className="medida">
                                        {formatarArea(item.areaM2)}
                                        </td>  
                                    </tr>
                                ))}
                            </tbody>

                            <tfoot>
                                <tr>
                                    <th scope="row">Total de Superfície</th>
                                    <td className="medida">
                                        <strong>{formatarArea(superficieTotal)}</strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}  

                <p>
                    As áreas incluem as faces modeladas, como frente,
                 verso e espessuras. Revise antes de converter esses valores em quantidades para compra.
                </p>
        </section>
    )
}

export default ResumoMateriais