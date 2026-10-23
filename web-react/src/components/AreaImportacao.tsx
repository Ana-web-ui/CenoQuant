import { useRef, useState } from 'react'
import type { DragEvent } from 'react'

type Props = {
  carregando: boolean
  erro: string
  aoImportar: (arquivo: File) => Promise<void>
}

function AreaImportacao({ carregando, erro, aoImportar }: Props) {
  const [arrastando, setArrastando] = useState(false)
  const [erroSelecao, setErroSelecao] = useState('')
  const profundidade = useRef(0)

  function receberArquivos(arquivos: FileList | null) {
    if (carregando || !arquivos?.length) return
    if (arquivos.length !== 1) {
      setErroSelecao('Importe apenas um arquivo JSON por vez.')
      return
    }
    const arquivo = arquivos[0]
    if (!arquivo.name.toLowerCase().endsWith('.json')) {
      setErroSelecao('Selecione um arquivo com extensão .json.')
      return
    }
    setErroSelecao('')
    void aoImportar(arquivo)
  }

  function soltarArquivo(evento: DragEvent<HTMLElement>) {
    evento.preventDefault()
    profundidade.current = 0
    setArrastando(false)
    receberArquivos(evento.dataTransfer.files)
  }

  return (
    <section
      className={`cartao area-importacao${arrastando ? ' arrastando' : ''}`}
      aria-label="Importar projeto JSON"
      aria-busy={carregando}
      onDragEnter={(evento) => {
        evento.preventDefault()
        if (!evento.dataTransfer.types.includes('Files')) return
        profundidade.current += 1
        if (!carregando) setArrastando(true)
      }}
      onDragOver={(evento) => {
        evento.preventDefault()
        evento.dataTransfer.dropEffect = carregando ? 'none' : 'copy'
      }}
      onDragLeave={(evento) => {
        evento.preventDefault()
        profundidade.current = Math.max(0, profundidade.current - 1)
        if (profundidade.current === 0) setArrastando(false)
      }}
      onDrop={soltarArquivo}
    >
      <h2>Importar projeto</h2>
      <p>Arraste um arquivo JSON para este cartão ou escolha pelo botão abaixo. Limite: 20 MB.</p>
      <p>
        A revisão é salva automaticamente neste navegador. Para continuar, abra
        o mesmo endereço usando o mesmo navegador e perfil. Baixe o JSON revisado
        para manter uma cópia de segurança ou transferir para outro computador.
      </p>
      <input type="file" accept=".json,application/json"
        aria-label="Selecionar arquivo JSON do projeto" disabled={carregando}
        onChange={(evento) => {
          receberArquivos(evento.target.files)
          evento.target.value = ''
        }} />
      {arrastando && <p role="status">Solte o JSON aqui para importar.</p>}
      {carregando && <p role="status">Lendo o arquivo...</p>}
      {(erroSelecao || erro) && <p role="alert" style={{ color: '#b42318' }}>{erroSelecao || erro}</p>}
    </section>
  )
}
export default AreaImportacao
