import OpcoesAvancadas from './components/OpcoesAvancadas'
import { baixarArquivo } from './utils/baixarArquivo'
import { gerarCsvCategorias } from './utils/gerarCsvCategorias'
import { gerarJsonRevisado } from './utils/gerarJsonRevisado'
import ProtecaoRevisao from './components/ProtecaoRevisao'
import { useRevisaoSalva } from './hooks/useRevisaoSalva'
import { gerarCsvMateriais } from './utils/gerarCsvMateriais'
import { renomearCategoria } from './utils/renomearCategoria'
import { listarMateriais } from './utils/listarMateriais'
import { renomearProjeto } from './utils/renomearProjeto'
import { conferirPecas } from './utils/conferirPecas'
import type { FiltroConferencia } from './utils/conferirPecas'
import { gerarCsvSelecao } from './utils/gerarCsvSelecao'
import DetalhesPeca from './components/DetalhesPeca'
import { ordenarPecas } from './utils/ordenarPecas'
import type { OrdemPecas } from './utils/ordenarPecas'
import { validarProjeto } from './utils/validarProjeto'
import { compararRevisao } from './utils/compararRevisao'
import type { AlteracaoRevisao } from './utils/compararRevisao'
import { gerarCsvAlteracoes } from './utils/gerarCsvAlteracoes'
import RelatorioImpressao from './components/RelatorioImpressao'
import AreaImportacao from './components/AreaImportacao'
import { validarCategoriasPersonalizadas, adicionarCategoriaPersonalizada } from './utils/categoriasPersonalizadas'
import { filtrarPecas } from './utils/filtrarPecas'
import type { FiltroInclusao } from './utils/filtrarPecas'
import { validarAcrescimo } from './utils/acrescimoMaterial'
import { gerarCsvAvisos } from './utils/gerarCsvAvisos'
import { calcularGrupos } from './utils/calcularGrupos'
import { gerarCsvGrupos } from './utils/gerarCsvGrupos'
import { editarPecasEmLote, descreverAlteracaoLote } from './utils/editarPecasEmLote'
import type { AlteracaoPecas } from './utils/editarPecasEmLote'
import { gerarCsvPecas } from './utils/gerarCsvPecas'
import { useRef, useState } from 'react'
import './App.css'
import FiltrosPecas from './components/FiltrosPecas'
import TabelaPecas from './components/TabelaPecas'
import Paginacao from './components/Paginacao'
import type { Aviso, Projeto } from './types/cenoquant'
import { calcularResumoCategorias } from './utils/calcularResumoCategorias'
import { calcularResumoMateriais } from './utils/calcularResumoMateriais'
import { calcularSuperficieIncluida } from './utils/calcularSuperficieIncluida'
import { validarAvisos } from './utils/validarAvisos'

const ITENS_POR_PAGINA = 20


function App() {

  
  const { projeto, setProjeto, status: statusSalvamento, problema: problemaRevisao,
    autorizarImportacao, baixarCopia, temCopia } = useRevisaoSalva()
  const [projetoAnterior, setProjetoAnterior] = useState<Projeto | null>(null)
  const [mensagemHistorico, setMensagemHistorico] = useState('')
  const [campoEmEdicao, setCampoEmEdicao] = useState('')

  function alterarNomeProjeto(nome: string) {
    if (!projeto) return
    const atualizado = renomearProjeto(projeto, nome)
    if (atualizado === projeto) return
    registrarAlteracao()
    setProjeto(atualizado)
    setMensagemHistorico('Nome do projeto atualizado. Você pode desfazer esta alteração.')
  }

  function registrarAlteracao() {
    setProjetoAnterior(projeto)
    setMensagemHistorico('')
    setCampoEmEdicao('')
  }

  function desfazerAlteracao() {
    if (!projetoAnterior || carregando) return
    setNovaCategoria('')
    setMensagemCategoria('')
    setErroCategoria(false)
    setCategoriaLote('')
    setCodigoLote('')
    setObservacaoLote('')
    setProjeto(projetoAnterior)
    setProjetoAnterior(null)
    setCampoEmEdicao('')
    setSelecionados(new Set())
    setMensagemLote('')
    setBusca('')
    setCategoria('')
    setFiltroInclusao('todos')
    setFiltroConferencia('todas')
    setFiltroMaterial(null)
    setOrdem('original')
    setPagina(1)
    setMensagemHistorico('Última alteração desfeita. Os filtros foram limpos para facilitar a conferência.')
  }

  const [erro, setErro] = useState('')
  const [idDetalhes, setIdDetalhes] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const importacaoEmAndamento = useRef(false)
  const [pagina, setPagina] = useState(1)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('')
  const [filtroInclusao, setFiltroInclusao] = useState<FiltroInclusao>('todos')
  const [ordem, setOrdem] = useState<OrdemPecas>('original')
  const [materiaisPorCategoria, setMateriaisPorCategoria] = useState(false)
  const [filtroConferencia, setFiltroConferencia] = useState<FiltroConferencia>('todas')
  const [filtroMaterial, setFiltroMaterial] = useState<string | null>(null)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [categoriaLote, setCategoriaLote] = useState('')
  const [codigoLote, setCodigoLote] = useState('')
  const [observacaoLote, setObservacaoLote] = useState('')
  const [mensagemLote, setMensagemLote] = useState('')
  const [novaCategoria, setNovaCategoria] = useState('')
  const [mensagemCategoria, setMensagemCategoria] = useState('')
  const [erroCategoria, setErroCategoria] = useState(false)

  function selecionarPeca(id: string, selecionar: boolean) {
    setSelecionados((atual) => {
      const novos = new Set(atual)
      if (selecionar) novos.add(id)
      else novos.delete(id)
      return novos
    })
    setMensagemLote('')
  }

  function aplicarEmLote(alteracao: AlteracaoPecas) {
    if (selecionados.size === 0) return
    const foraDaPagina = [...selecionados].filter((id) =>
      !pecasVisiveis.some((peca) => peca.id === id),
    ).length
    const editaTexto = alteracao.code !== undefined || alteracao.note !== undefined
    if (foraDaPagina > 0 || editaTexto) {
      const confirmou = window.confirm(
        `${descreverAlteracaoLote(alteracao)} em ${selecionados.size.toLocaleString('pt-BR')} objetos selecionados? ` +
        `${foraDaPagina.toLocaleString('pt-BR')} estão em outras páginas. ` +
        (alteracao.code !== undefined ? 'O mesmo código pode reunir objetos no resumo agrupado. ' : '') +
        'Cancelar mantém a seleção e não altera os objetos.',
      )
      if (!confirmou) return
    }
    registrarAlteracao()
    const quantidade = selecionados.size
    setProjeto((atual) => atual ? {
      ...atual,
      pecas: editarPecasEmLote(atual.pecas, selecionados, alteracao),
    } : atual)
    setSelecionados(new Set())
    setPagina(1)
    setMensagemLote(`${quantidade.toLocaleString('pt-BR')} objetos atualizados.`)
  }

  async function importarArquivo(arquivo: File) {
    if (importacaoEmAndamento.current) return
    importacaoEmAndamento.current = true

    setErro('')
    setCarregando(true)

    try {
      if (arquivo.size > 20 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 20 MB.')
      }

      const texto = await arquivo.text()
      const dados = JSON.parse(texto.replace(/^\uFEFF/, ''))

      const projetoImportado = validarProjeto(dados)
      if (!autorizarImportacao()) return

      setNovaCategoria('')
      setMensagemCategoria('')
      setErroCategoria(false)
      setProjetoAnterior(null)
      setMensagemHistorico('')
      setCampoEmEdicao('')
      setIdDetalhes(null)
      setMateriaisPorCategoria(false)
      setProjeto(projetoImportado)

      setSelecionados(new Set())
      setCategoriaLote('')
    setCodigoLote('')
    setObservacaoLote('')
      setMensagemLote('')
      setPagina(1)
      setBusca('')
      setCategoria('')
    setFiltroInclusao('todos')
    setFiltroConferencia('todas')
    setFiltroMaterial(null)
    setOrdem('original')
    } catch (erro) {
      setErro(
        erro instanceof SyntaxError
          ? 'Não foi possível ler o JSON. Confira o arquivo selecionado.'
          : erro instanceof Error
            ? erro.message
            : 'Não foi possível importar o arquivo.',
      )
    } finally {
      importacaoEmAndamento.current = false
      setCarregando(false)
    }
  }

  function alterarTextoPeca(id: string, campo: 'code' | 'note', valor: string) {
    if (valor.length > 2000) return
    const peca = projeto?.pecas.find((item) => item.id === id)
    if (!peca || peca[campo] === valor) return
    setSelecionados(new Set())
    setMensagemLote('')
    const chaveCampo = JSON.stringify([id, campo])
    if (campoEmEdicao !== chaveCampo) {
      registrarAlteracao()
      setCampoEmEdicao(chaveCampo)
    }
    setProjeto((atual) => atual ? {
      ...atual,
      pecas: atual.pecas.map((peca) => peca.id === id ? { ...peca, [campo]: valor } : peca),
    } : atual)
  }

  function alterarInclusao(id: string, incluir: boolean) {
    const peca = projeto?.pecas.find((item) => item.id === id)
    if (!peca || peca.included === incluir) return
    registrarAlteracao()
    setSelecionados(new Set())
    setMensagemLote('')
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
    if (!Array.isArray(projeto.arquivoOriginal.pieces)) {
      setErro('Não foi possível encontrar os objetos originais.')
      return
    }
    baixarArquivo(
      gerarJsonRevisado(projeto),
      'CenoQuant_revisado.json',
      'application/json;charset=utf-8',
    )
  }

function alterarCategoria(id: string, novaCategoria: string) {
  const peca = projeto?.pecas.find((item) => item.id === id)
  if (!peca || peca.category === novaCategoria) return
  registrarAlteracao()
  setSelecionados(new Set())
  setMensagemLote('')
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
    ...validarCategoriasPersonalizadas(projeto?.arquivoOriginal.customCategories),
    ...pecas.map((peca) => peca.category),
  ]),
].sort((a, b) => a.localeCompare(b, 'pt-BR'))

  function alterarNomeCategoria(origem: string, destino: string): boolean {
    if (!projeto) return false
    const atualizado = renomearCategoria(projeto, origem, destino, categorias)
    if (atualizado === projeto) return false
    const afetados = pecas.filter((p) => p.category === origem)
    const excluidos = afetados.filter((p) => !p.included).length
    if (!window.confirm(
      `Renomear "${origem}" para "${destino.trim()}" no projeto inteiro? ` +
      `${afetados.length.toLocaleString('pt-BR')} objetos serão afetados, incluindo ` +
      `${excluidos.toLocaleString('pt-BR')} excluídos do quantitativo. ` +
      'Esta ação também alcança objetos fora dos filtros atuais.',
    )) return false
    registrarAlteracao()
    setProjeto(atualizado)
    setSelecionados(new Set())
    setCategoriaLote('')
    setMensagemLote('')
    setBusca('')
    setCategoria(destino.trim())
    setFiltroInclusao('todos')
    setFiltroConferencia('todas')
    setFiltroMaterial(null)
    setPagina(1)
    setMensagemHistorico('Categoria renomeada. Você pode desfazer esta alteração.')
    return true
  }

  function criarCategoria() {
    if (!projeto) return
    try {
      const novas = adicionarCategoriaPersonalizada(
        validarCategoriasPersonalizadas(projeto.arquivoOriginal.customCategories),
        novaCategoria,
        categorias,
      )
      registrarAlteracao()
      setProjeto({
        ...projeto,
        arquivoOriginal: { ...projeto.arquivoOriginal, customCategories: novas },
      })
      setNovaCategoria('')
      setErroCategoria(false)
      setMensagemCategoria('Categoria criada. Escolha-a na tabela ou na edição em lote para aplicá-la aos objetos.')
    } catch (erro) {
      setErroCategoria(true)
      setMensagemCategoria(erro instanceof Error ? erro.message : 'Não foi possível criar a categoria.')
    }
  }

  const pecasFiltradas = filtrarPecas(pecas, busca, categoria, filtroInclusao, filtroConferencia, filtroMaterial)

  const materiaisDisponiveis = listarMateriais(pecas)
  const pecasOrdenadas = ordenarPecas(pecasFiltradas, ordem)
  const indicadoresConferencia = conferirPecas(pecas)

  function abrirConferencia(filtro: FiltroConferencia) {
    setBusca('')
    setCategoria('')
    setFiltroInclusao('incluidos')
    setFiltroConferencia(filtro)
    setFiltroMaterial(null)
    setOrdem('original')
    setPagina(1)
    setSelecionados(new Set())
    setMensagemLote('')
  }


  const total = pecas.length
  const totalIncluido = pecas.filter((peca) => peca.included).length
  const totalExcluido = total - totalIncluido
  const superficieIncluida = calcularSuperficieIncluida(pecas)
  const totalFiltrado = pecasFiltradas.length
  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
  const pecasVisiveis = pecasOrdenadas.slice(inicio, inicio + ITENS_POR_PAGINA)
  const selecionadosForaDaPagina = [...selecionados].filter((id) =>
    !pecasVisiveis.some((peca) => peca.id === id),
  ).length

  function selecionarResultadosFiltrados() {
    setSelecionados(new Set(pecasFiltradas.map((peca) => peca.id)))
    setMensagemLote('')
  }

  const resumoPorCategoria = calcularResumoCategorias(pecas)
  const resumoPorMaterial = calcularResumoMateriais(pecas, materiaisPorCategoria)
  const grupos = calcularGrupos(pecas)
  const acrescimo = validarAcrescimo(projeto?.arquivoOriginal.lossPercent)
  let alteracoes: AlteracaoRevisao[] = []
  let erroComparacao = ''
  if (projeto) {
    try {
      alteracoes = compararRevisao(pecas, projeto.arquivoOriginal.pieces)
    } catch {
      erroComparacao = 'Não foi possível comparar esta revisão com o arquivo importado.'
    }
  }

  function exportarAlteracoesCSV() {
    if (!projeto || erroComparacao || alteracoes.length === 0) return
    baixarArquivo(
      gerarCsvAlteracoes(alteracoes, projeto.nome),
      'CenoQuant_alteracoes.csv',
      'text/csv;charset=utf-8',
    )
  }


  function alterarAcrescimo(valor: number) {
    const percentual = validarAcrescimo(valor)
    if (percentual === acrescimo) return
    registrarAlteracao()
    setProjeto((atual) => atual ? {
      ...atual,
      arquivoOriginal: { ...atual.arquivoOriginal, lossPercent: percentual },
    } : atual)
  }

  function exportarAvisosCSV() {
    if (!projeto || erroAvisos || avisosExtracao.length === 0) return
    baixarArquivo(
      gerarCsvAvisos(avisosExtracao, projeto.nome),
      'CenoQuant_avisos.csv',
      'text/csv;charset=utf-8',
    )
  }

  function exportarGruposCSV() {
    baixarArquivo(
      gerarCsvGrupos(grupos),
      'CenoQuant_grupos.csv',
      'text/csv;charset=utf-8',
    )
  }

  function exportarSelecaoCSV() {
    if (!projeto || selecionados.size === 0) return
    baixarArquivo(
      gerarCsvSelecao(ordenarPecas(pecas, ordem), selecionados),
      'CenoQuant_objetos_selecionados.csv',
      'text/csv;charset=utf-8',
    )
  }

  function exportarPecasCSV() {
    if (!projeto) return
    baixarArquivo(
      gerarCsvPecas(projeto.pecas),
      'CenoQuant_objetos_incluidos.csv',
      'text/csv;charset=utf-8',
    )
  }

  function exportarResumoCSV() {
    if (resumoPorCategoria.length === 0) return
    baixarArquivo(
      gerarCsvCategorias(resumoPorCategoria, totalIncluido),
      'CenoQuant_resumo_categorias.csv',
      'text/csv;charset=utf-8',
    )
  }

  function exportarMateriaisCSV() {
    if (resumoPorMaterial.length === 0) return
    baixarArquivo(
      gerarCsvMateriais(resumoPorMaterial, superficieIncluida, acrescimo, materiaisPorCategoria),
      'CenoQuant_superficie_por_material.csv',
      'text/csv;charset=utf-8',
    )
  }
let avisosExtracao: Aviso[] = []
let erroAvisos = ''

try {
  avisosExtracao = validarAvisos(projeto?.arquivoOriginal.warnings)
} catch {
  erroAvisos = 'Não foi possível apresentar os avisos da extração.'
}

  return (
    <>
    <main className="pagina">
      <header>
        <span className="etiqueta">TV1 · CENOGRAFIA</span>
        <h1>Ceno Quant</h1>
        <p>Organize as peças e os materiais do seu projeto.</p>
      </header>

      <ProtecaoRevisao problema={problemaRevisao} temCopia={temCopia} aoBaixar={baixarCopia} />

      <AreaImportacao
        carregando={carregando}
        erro={erro}
        aoImportar={importarArquivo}
      />

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

            {statusSalvamento === 'bloqueado' &&
              'Salvamento automático pausado. Consulte o aviso de proteção acima e baixe o JSON revisado para guardar suas alterações.'}

            {statusSalvamento === 'erro' &&
              'Não foi possível salvar a revisão no navegador. Baixe o JSON revisado para guardar suas alterações.'}
          </p>
          <p>{total.toLocaleString('pt-BR')} objetos no arquivo.</p>

          <p aria-live="polite">
            <strong>{totalIncluido.toLocaleString('pt-BR')}</strong> incluídos
            {' · '}
            <strong>{totalExcluido.toLocaleString('pt-BR')}</strong> excluídos
            {' — totais do projeto inteiro.'}
          </p>

          <h3>Revisar objetos</h3>
         <FiltrosPecas
  busca={busca}
  categoria={categoria}
  categorias={categorias}
  materiais={materiaisDisponiveis}
  material={filtroMaterial}
  aoAlterarMaterial={(valor) => {
    setSelecionados(new Set())
    setMensagemLote('')
    setFiltroMaterial(valor)
    setPagina(1)
  }}
  inclusao={filtroInclusao}
  conferencia={filtroConferencia}
  aoAlterarConferencia={(valor) => {
    setSelecionados(new Set())
    setMensagemLote('')
    setFiltroConferencia(valor)
    setPagina(1)
  }}
  ordem={ordem}
  aoAlterarOrdem={(valor) => {
    setSelecionados(new Set())
    setMensagemLote('')
    setOrdem(valor)
    setPagina(1)
  }}
  aoAlterarInclusao={(valor) => {
    setSelecionados(new Set())
    setMensagemLote('')
    setFiltroInclusao(valor)
    setPagina(1)
  }}
  aoAlterarBusca={(valor) => {
    setSelecionados(new Set())
    setMensagemLote('')
    setBusca(valor)
    setPagina(1)
  }}
  aoAlterarCategoria={(valor) => {
    setSelecionados(new Set())
    setMensagemLote('')
    setCategoria(valor)
    setPagina(1)
  }}
  aoLimpar={() => {
    setSelecionados(new Set())
    setMensagemLote('')
    setBusca('')
    setCategoria('')
    setFiltroInclusao('todos')
    setFiltroConferencia('todas')
    setFiltroMaterial(null)
    setOrdem('original')
    setPagina(1)
  }}
/>

          <p role="status">
            {totalFiltrado.toLocaleString('pt-BR')} de{' '}
            {total.toLocaleString('pt-BR')} objetos encontrados.
          </p>

          {selecionados.size > 0 && <p role="status">
            {selecionados.size.toLocaleString('pt-BR')} selecionados. Use a edição em lote nas opções avançadas abaixo.
          </p>}
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
               selecionados={selecionados}
               aoSelecionar={selecionarPeca}
                 aoVerDetalhes={setIdDetalhes}
               aoAlterarTexto={alterarTextoPeca}
               aoFinalizarTexto={() => setCampoEmEdicao('')}
              categorias={categorias}
              aoAlterarInclusao={alterarInclusao}
               aoAlterarCategoria={alterarCategoria}
              />

              <Paginacao
                pagina={paginaAtual}
                totalPaginas={totalPaginas}
               aoAlterarPagina={(novaPagina) => {
                 setSelecionados(new Set())
                 setMensagemLote('')
                 setPagina(novaPagina)
               }}
              />
            </>
          )}
          <section className="exportacao-principal" aria-labelledby="titulo-exportar">
            <h3 id="titulo-exportar">Exportar revisão</h3>
          <div className="acoes-projeto">
          <button type="button" onClick={() => window.print()}>
            Imprimir relatório / salvar PDF
          </button>
          <button type="button" onClick={exportarProjeto}>
            Baixar JSON revisado
          </button>
          <button
            type="button"
            onClick={exportarPecasCSV}
            disabled={totalIncluido === 0}
          >
            Exportar objetos incluídos em CSV
          </button>
          </div>
          <p>
            O CSV detalhado considera todos os objetos incluídos, independentemente
            dos filtros. As medidas são do modelo e precisam de revisão para fabricação.
          </p>
          </section>
          <OpcoesAvancadas
            nomeProjeto={{ nome: projeto.nome, carregando, aoRenomear: alterarNomeProjeto }}
            historico={{ podeDesfazer: !!projetoAnterior, mensagem: mensagemHistorico, aoDesfazer: desfazerAlteracao }}
            edicaoLote={{
              quantidadeSelecionada: selecionados.size,
              selecionadosForaDaPagina,
              quantidadeNaPagina: pecasVisiveis.length,
              totalFiltrado, carregando, mensagemLote, categorias,
              categoriaLote, codigoLote, observacaoLote,
              aoSelecionarPagina: () => {
                setSelecionados(new Set(pecasVisiveis.map((peca) => peca.id)))
                setMensagemLote('')
              },
              aoSelecionarResultados: selecionarResultadosFiltrados,
              aoLimparSelecao: () => setSelecionados(new Set()),
              aoExportarSelecao: exportarSelecaoCSV,
              aoAlterarCategoria: setCategoriaLote,
              aoAlterarCodigo: setCodigoLote,
              aoAlterarObservacao: setObservacaoLote,
              aoAplicar: aplicarEmLote,
            }}
            superficie={superficieIncluida}
            resumoCategorias={{ categorias: resumoPorCategoria, totalIncluido, aoExportar: exportarResumoCSV }}
            resumoMateriais={{
              materiais: resumoPorMaterial, porCategoria: materiaisPorCategoria,
              aoAlterarAgrupamento: setMateriaisPorCategoria,
              superficieTotal: superficieIncluida, acrescimo,
              aoAlterarAcrescimo: alterarAcrescimo, aoExportar: exportarMateriaisCSV,
            }}
            resumoGrupos={{ grupos, aoExportar: exportarGruposCSV }}
            alteracoes={{ alteracoes, erro: erroComparacao, aoExportar: exportarAlteracoesCSV }}
            avisos={{ avisos: avisosExtracao, aoExportar: exportarAvisosCSV }}
            erroAvisos={erroAvisos}
            criacaoCategoria={{
              nome: novaCategoria, mensagem: mensagemCategoria, erro: erroCategoria,
              aoCriar: criarCategoria,
              aoAlterarNome: (nome) => {
                setNovaCategoria(nome)
                setMensagemCategoria('')
              },
            }}
            renomearCategoria={{ categorias, pecas, carregando, aoRenomear: alterarNomeCategoria }}
            conferencia={{ indicadores: indicadoresConferencia, aoConferir: abrirConferencia }}
          />
        </section>
      )}
    </main>
    <DetalhesPeca peca={pecas.find((peca) => peca.id === idDetalhes) ?? null}
      aoFechar={() => setIdDetalhes(null)} />
    {projeto && !erroAvisos && <RelatorioImpressao
      projeto={projeto}
      categorias={resumoPorCategoria}
      materiais={resumoPorMaterial}
      porCategoria={materiaisPorCategoria}
      totalIncluido={totalIncluido}
      superficie={superficieIncluida}
      acrescimo={acrescimo}
      quantidadeAvisos={avisosExtracao.length}
    />}
    </>
  )
}

export default App