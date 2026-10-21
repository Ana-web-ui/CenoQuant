import { useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'
import ResumoMateriais from './components/ResumoMateriais'



type Superficie = {
  material: string
  areaM2: number
}

type Peca = {
  id: string
  name: string
  category: string
  dimensionsM: [number, number, number]
  included: boolean
  surfaces: Superficie[]
}

type Projeto = {
  nome: string
  pecas: Peca[]
  arquivoOriginal: Record<string, unknown>
}

const ITENS_POR_PAGINA = 20

function validarPeca(valor: unknown): Peca {
  if (typeof valor !== 'object' || valor === null) {
    throw new Error('O arquivo contém um objeto inválido.')
  }

  const peca = valor as Record<string, unknown>
  const dimensoes = peca.dimensionsM

  if (
    typeof peca.id !== 'string' ||
    typeof peca.name !== 'string' ||
    !Array.isArray(dimensoes) ||
    dimensoes.length !== 3 ||
    !dimensoes.every(
      (numero) =>
        typeof numero === 'number' &&
        Number.isFinite(numero) &&
        numero >= 0,
    )
  ) {
    throw new Error('Há objetos com identificação ou dimensões inválidas.')
  }

  const superficies = peca.surfaces

  if (!Array.isArray(superficies)) {
    throw new Error('O arquivo contém um objeto com superfícies inválidas.')
  }

  const superficiesValidas: Superficie[] = superficies.map(
    (valor: unknown) => {
      if (typeof valor !== 'object' || valor === null) {
        throw new Error('Há uma superfície invalida no arquivo.')
      }
      
      const superficie = valor as Record<string, unknown>

      if (
        typeof superficie.material !== 'string' ||
        typeof superficie.areaM2 !== 'number' ||
        !Number.isFinite(superficie.areaM2) ||
        superficie.areaM2 < 0
      ) {
        throw new Error('há uma superficie com material ou área inválida')
      }

      return {
        material: superficie.material,
        areaM2: superficie.areaM2,
      }
    },
  )

  return {
    id: peca.id,
    name: peca.name,
    category: typeof peca.category === 'string' && peca.category.trim()
      ? peca.category
      : 'Sem categoria',
    dimensionsM: dimensoes as [number, number, number],
    included: peca.included !== false,
    surfaces: superficiesValidas,
  }
}

function formatarMedida(valor: number) {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

function App() {
  const [projeto, setProjeto] = useState<Projeto | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')

  async function importarProjeto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''

    if (!arquivo) return

    setErro('')
    setCarregando(true)

    try {
      if (arquivo.size > 20 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 20 MB.')
      }

      const texto = await arquivo.text()
      const dados = JSON.parse(texto.replace(/^\uFEFF/, ''))

      if (
        dados?.schema !== 'ceno-quant/1' ||
        typeof dados?.project?.name !== 'string' ||
        !Array.isArray(dados?.pieces)
      ) {
        throw new Error('Esse arquivo não está no formato do Ceno Quant.')
      }

      if (dados.pieces.length > 10000) {
        throw new Error('O limite desta versão é de 10.000 objetos.')
      }

      const pecas: Peca[] = dados.pieces.map(validarPeca)
      const identificadores = new Set(pecas.map((peca: Peca) => peca.id))

      if (identificadores.size !== pecas.length) {
        throw new Error('O arquivo contém identificadores repetidos.')
      }

      setProjeto({
        nome: dados.project.name,
        pecas,
        arquivoOriginal: dados,
      })

      setPagina(1)
      setBusca('')
      setCategoria('')
    } catch (erro) {
      setErro(
        erro instanceof SyntaxError
          ? 'Não foi possível ler o JSON. Confira o arquivo selecionado.'
          : erro instanceof Error
            ? erro.message
            : 'Não foi possível importar o arquivo.',
      )
    } finally {
      setCarregando(false)
    }
  }

  function alterarInclusao(id: string, incluir: boolean) {
    setProjeto((atual) => {
      if (!atual) return atual

      return {
        ...atual,
        pecas: atual.pecas.map((peca) =>
          peca.id === id ? { ...peca, included: incluir } : peca,
        ),
      }
    })
  }
function exportarProjeto() {
  if (!projeto) return

  const originais = projeto.arquivoOriginal.pieces

  if (!Array.isArray(originais)) {
    setErro('Não foi possível encontrar os objetos originais.')
    return
  }

  const revisoes = new Map(
    projeto.pecas.map((peca) => [peca.id, peca]),
  )

  const pecasRevisadas = originais.map((valor: unknown) => {
    const original = valor as Record<string, unknown>
    const revisao = revisoes.get(original.id as string)

    if (!revisao) return original

    return {
      ...original,
      category: revisao.category,
      included: revisao.included,
    }
  })

  const arquivoRevisado = {
    ...projeto.arquivoOriginal,
    pieces: pecasRevisadas,
  }

  const texto = JSON.stringify(arquivoRevisado, null, 2)

  const arquivo = new Blob([texto], {
    type: 'application/json;charset=utf-8',
  })

  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')

  link.href = endereco
  link.download = 'CenoQuant_revisado.json'

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(endereco)
  }, 1000)
}

function alterarCategoria(id: string, novaCategoria: string) {
  setProjeto((atual) => {
    if (!atual) return atual

    return {
      ...atual,
      pecas: atual.pecas.map((peca) =>
        peca.id === id
          ? { ...peca, category: novaCategoria }
          : peca,
      ),
    }
  })

  setPagina(1)
}

  const pecas = projeto?.pecas ?? []
  const categorias = [
  ...new Set([
    'Sem categoria',
    'Piso e acessibilidade',
    'Painéis e fechamentos',
    'Balcões',
    'Mobiliário',
    'Iluminação e LED',
    'Comunicação visual',
    'Cobertura e forro',
    'Vitrines e vidros',
    'Estrutura e acabamentos',
    'Elementos cenográficos',
    'Revisar identificação',
    ...pecas.map((peca) => peca.category),
  ]),
].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  function normalizar(texto: string) {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim()
  }

  const termoBusca = normalizar(busca)
  const pecasFiltradas = pecas.filter((peca) => {
    const correspondeAoNome = normalizar(peca.name).includes(termoBusca)
    const correspondeACategoria = categoria === '' || peca.category === categoria
    return correspondeAoNome && correspondeACategoria
  })

  const total = pecas.length
  const totalIncluido = pecas.filter((peca) => peca.included).length
  const totalExcluido = total - totalIncluido

  const superficieIncluida = pecas
    .filter((peca) => peca.included)
    .reduce(
      (total, peca) =>
        total +
        peca.surfaces.reduce(
          (subtotal, superficie) => subtotal + superficie.areaM2,
          0,
        ),
      0,
    )
  const totalFiltrado = pecasFiltradas.length
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / ITENS_POR_PAGINA))
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const pecasVisiveis = pecasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA)

  const contagemPorCategoria = new Map<string, number>()

for (const peca of pecas) {
  if (!peca.included) continue

  const quantidadeAtual = contagemPorCategoria.get(peca.category) ?? 0

  contagemPorCategoria.set(peca.category, quantidadeAtual + 1)
}

const resumoPorCategoria = [...contagemPorCategoria.entries()]
  .map(([categoria, quantidade]) => ({
    categoria,
    quantidade,
  }))
  .sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR'))

const areasPorMaterial = new Map<string, number>()

for (const peca of pecas) {
  if (!peca.included) continue

  for (const superficie of peca.surfaces) {
    const material = superficie.material.trim() || 'Sem material'
    const areaAtual = areasPorMaterial.get(material) ?? 0

    areasPorMaterial.set(
      material,
      areaAtual + superficie.areaM2,
    )
  }
}

const resumoPorMaterial = [...areasPorMaterial.entries()]
  .map(([material, areaM2]) => ({
    material,
    areaM2,
  }))
  .sort((a, b) => a.material.localeCompare(b.material, 'pt-BR'))

function exportarResumoCSV() {
  if (resumoPorCategoria.length === 0) return

  function prepararCelula(valor: string | number) {
    if (typeof valor === 'number') return String(valor)

    let texto = valor

    // Evita que nomes de categorias sejam interpretados como fórmulas.
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(texto)) {
      texto = "'" + texto
    }

    // Protege aspas, separadores e quebras de linha.
    return `"${texto.replace(/"/g, '""')}"`
  }

  const linhas: (string | number)[][] = [
    ['Categoria', 'Objetos incluídos'],
    ...resumoPorCategoria.map((item) => [
      item.categoria,
      item.quantidade,
    ]),
    ['Total incluído', totalIncluido],
  ]

  const conteudo = linhas
    .map((linha) => linha.map(prepararCelula).join(';'))
    .join('\r\n')

  const arquivo = new Blob(['\uFEFF', conteudo], {
    type: 'text/csv;charset=utf-8',
  })

  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')

  link.href = endereco
  link.download = 'CenoQuant_resumo_categorias.csv'

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(endereco)
  }, 1000)
}

function exportarMateriaisCSV() {
  if (resumoPorMaterial.length === 0) return

  function prepararCelula(texto: string) {
    // Evita interpretar nomes de materiais como fórmulas.
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(texto)) {
      texto = "'" + texto
    }

    return `"${texto.replace(/"/g, '""')}"`
  }

  function formatarAreaCSV(area: number) {
    return area.toLocaleString('pt-BR', {
      useGrouping: false,
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    })
  }

  const linhas = [
    ['Material', 'Superfície medida (m²)'],
    ...resumoPorMaterial.map((item) => [
      item.material,
      formatarAreaCSV(item.areaM2),
    ]),
    ['Total de superfície', formatarAreaCSV(superficieIncluida)],
  ]

  const conteudo = linhas
    .map((linha) => linha.map(prepararCelula).join(';'))
    .join('\r\n')

  const arquivo = new Blob(['\uFEFF', conteudo], {
    type: 'text/csv;charset=utf-8',
  })

  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')

  link.href = endereco
  link.download = 'CenoQuant_superficie_por_material.csv'

  document.body.appendChild(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(endereco)
  }, 1000)
}

  return (
    <main className="pagina">
      <header>
        <span className="etiqueta">TV1 · CENOGRAFIA</span>
        <h1>Ceno Quant</h1>
        <p>Organize as peças e os materiais do seu projeto.</p>
      </header>

      <section className="cartao">
        <h2>Importar projeto</h2>
        <p>Selecione o JSON extraído do Blender ou do 3ds Max.</p>

        <input
          type="file"
          accept=".json,application/json"
          aria-label="Selecionar arquivo JSON do projeto"
          onChange={importarProjeto}
          disabled={carregando}
        />

        {carregando && <p role="status">Lendo o arquivo...</p>}

        {erro && (
          <p role="alert" style={{ color: '#b42318' }}>
            {erro}
          </p>
        )}
      </section>

      {projeto && (
        <section className="cartao">
          <h2>{projeto.nome}</h2>
          <button type="button" onClick={exportarProjeto}>
            Baixar JSON revisado
          </button>
          <p>{total.toLocaleString('pt-BR')} objetos no arquivo.</p>

          <p aria-live="polite">
            <strong>{totalIncluido.toLocaleString('pt-BR')}</strong> incluídos
            {' · '}
            <strong>{totalExcluido.toLocaleString('pt-BR')}</strong> excluídos
            {' — totais do projeto inteiro.'}
          </p>

          <p aria-live="polite">
            Superfície medida dos objetos incluídos:{' '}
            <strong>
              {superficieIncluida.toLocaleString('pt-BR', {
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

          <section className="resumo-categorias">
          <h3>Quantidades por categoria</h3>
           <button
             type="button"
            onClick={exportarResumoCSV}
            disabled={resumoPorCategoria.length === 0}
            >
            Exportar resumo em CSV
          </button>

  <p>
    Apenas objetos incluídos. Este resumo considera o projeto inteiro.
  </p>

  {resumoPorCategoria.length === 0 ? (
    <p>Nenhum objeto incluído no quantitativo.</p>
  ) : (
    <div className="tabela-container">
      <table>
        <caption>Contagem dos objetos incluídos por categoria</caption>

        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col" className="medida">
              Objetos incluídos
            </th>
          </tr>
        </thead>

        <tbody>
          {resumoPorCategoria.map((item) => (
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
              <strong>{totalIncluido.toLocaleString('pt-BR')}</strong>
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

          <ResumoMateriais
            materiais={resumoPorMaterial}
            superficieTotal={superficieIncluida}
            aoExportar={exportarMateriaisCSV}
          />

          <div className="filtros">
            <label>
              Buscar por nome
              <input
                type="search"
                placeholder="Ex.: piso, parede, LED..."
                value={busca}
                onChange={(evento) => {
                  setBusca(evento.target.value)
                  setPagina(1)
                }}
              />
            </label>

            <label>
              Categoria
              <select
                value={categoria}
                onChange={(evento) => {
                  setCategoria(evento.target.value)
                  setPagina(1)
                }}
              >
                <option value="">Todas as categorias</option>
                {categorias.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setBusca('')
                setCategoria('')
                setPagina(1)
              }}
            >
              Limpar filtros
            </button>
          </div>

          <p role="status">
            {totalFiltrado.toLocaleString('pt-BR')} de{' '}
            {total.toLocaleString('pt-BR')} objetos encontrados.
          </p>
          <p>
             Baixe o JSON revisado antes de fechar ou atualizar a página.
            Para continuar depois, importe esse arquivo.
          </p>

          {totalFiltrado === 0 ? (
            <p>
              {total === 0
                ? 'Este projeto não contém objetos.'
                : 'Nenhum objeto encontrado. Tente outro nome ou categoria.'}
            </p>
          ) : (
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
                    {pecasVisiveis.map((peca) => (
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
                              alterarInclusao(peca.id, evento.target.checked)
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
                           alterarCategoria(peca.id, evento.target.value)
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

              <nav className="paginacao" aria-label="Páginas da tabela">
                <button
                  type="button"
                  disabled={pagina === 1}
                  onClick={() => setPagina((atual) => atual - 1)}
                >
                  Anterior
                </button>

                <span aria-live="polite">
                  Página {pagina} de {totalPaginas}
                </span>

                <button
                  type="button"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina((atual) => atual + 1)}
                >
                  Próxima
                </button>
              </nav>
            </>
          )}
        </section>
      )}
    </main>
  )
}

export default App