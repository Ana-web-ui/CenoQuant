import { useEffect,  useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'
import ResumoMateriais from './components/ResumoMateriais'
import ResumoCategorias from './components/ResumoCategorias'
import FiltrosPecas from './components/FiltrosPecas'
import TabelaPecas from './components/TabelaPecas'
import Paginacao from './components/Paginacao'
import type {  Peca, Projeto } from './types/cenoquant'
import { validarPeca } from './utils/validarPeca'
import { calcularResumoCategorias } from './utils/calcularResumoCategorias'
import { calcularResumoMateriais } from './utils/calcularResumoMateriais'
import { calcularSuperficieIncluida } from './utils/calcularSuperficieIncluida'

const ITENS_POR_PAGINA = 20
function App() {
  const [projeto, setProjeto] = useState<Projeto | null>(() => {
  try {
    const salvo = localStorage.getItem('cenoquant-revisao-v1')

    if (!salvo) return null

    const dados = JSON.parse(salvo)

    if (
      typeof dados?.nome !== 'string' ||
      !Array.isArray(dados?.pecas) ||
      dados.pecas.length > 10000 ||
      dados?.arquivoOriginal?.schema !== 'ceno-quant/1' ||
      !Array.isArray(dados.arquivoOriginal.pieces)
    ) {
      return null
    }

    const pecas: Peca[] = dados.pecas.map(validarPeca)
    const ids = new Set(pecas.map((peca) => peca.id))

    if (ids.size !== pecas.length) return null

    return {
      nome: dados.nome,
      pecas,
      arquivoOriginal: dados.arquivoOriginal,
    }
  } catch {
    return null
  }
})
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [statusSalvamento, setStatusSalvamento] = useState<
    'sem-projeto' | 'salvo' | 'erro'
  >('sem-projeto')

  useEffect(() => {
    if (!projeto) {
      setStatusSalvamento('sem-projeto')
      return
    }

    try {
      localStorage.setItem(
        'cenoquant-revisao-v1',
        JSON.stringify(projeto),
      )

      setStatusSalvamento('salvo')
    } catch {
      setStatusSalvamento('erro')
    }
  }, [projeto])

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
      if (projeto) {
      const confirmou = window.confirm(
        'Importar este arquivo substituirá a revisão atual e sua cópia ' +
        'automática neste navegador. Se quiser guardar a revisão atual, ' +
        'clique em Cancelar e baixe o JSON revisado antes de continuar. ' +
        'Deseja substituir?',
        )

        if (!confirmou) return
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
  const superficieIncluida = calcularSuperficieIncluida(pecas)
  const totalFiltrado = pecasFiltradas.length
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / ITENS_POR_PAGINA))
  const inicio = (pagina - 1) * ITENS_POR_PAGINA
  const pecasVisiveis = pecasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA)
  const resumoPorCategoria = calcularResumoCategorias(pecas)
  const resumoPorMaterial = calcularResumoMateriais(pecas)

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
        <p>
        A revisão é salva automaticamente neste navegador.
        Para continuar, abra o mesmo endereço usando o mesmo navegador
        e perfil. Baixe o JSON revisado para manter uma cópia de segurança
        ou transferir a revisão para outro computador.
        </p>

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
          <p
            role="status"
            style={{
              color: statusSalvamento === 'erro' ? '#b42318' : undefined,
            }}
          >
            {statusSalvamento === 'salvo' &&
              'Revisão salva neste navegador.'}

            {statusSalvamento === 'erro' &&
              'Não foi possível salvar a revisão no navegador. Baixe o JSON revisado para guardar suas alterações.'}
          </p>
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

<ResumoCategorias
  categorias={resumoPorCategoria}
  totalIncluido={totalIncluido}
  aoExportar={exportarResumoCSV}
/>

          <ResumoMateriais
            materiais={resumoPorMaterial}
            superficieTotal={superficieIncluida}
            aoExportar={exportarMateriaisCSV}
          />

         <FiltrosPecas
  busca={busca}
  categoria={categoria}
  categorias={categorias}
  aoAlterarBusca={(valor) => {
    setBusca(valor)
    setPagina(1)
  }}
  aoAlterarCategoria={(valor) => {
    setCategoria(valor)
    setPagina(1)
  }}
  aoLimpar={() => {
    setBusca('')
    setCategoria('')
    setPagina(1)
  }}
/>

          <p role="status">
            {totalFiltrado.toLocaleString('pt-BR')} de{' '}
            {total.toLocaleString('pt-BR')} objetos encontrados.
          </p>

          {totalFiltrado === 0 ? (
            <p>
              {total === 0
                ? 'Este projeto não contém objetos.'
                : 'Nenhum objeto encontrado. Tente outro nome ou categoria.'}
            </p>
          ) : (
            <>
             <TabelaPecas
               pecas={pecasVisiveis}
              categorias={categorias}
              aoAlterarInclusao={alterarInclusao}
               aoAlterarCategoria={alterarCategoria}
              />

              <Paginacao
                pagina={pagina}
                totalPaginas={totalPaginas}
               aoAlterarPagina={setPagina}
              />
            </>
          )}
        </section>
      )}
    </main>
  )
}

export default App