import { baixarArquivo } from '../utils/baixarArquivo'
import { useEffect, useRef, useState } from 'react'
import type { Projeto } from '../types/cenoquant'
import { CHAVE_REVISAO, lerRevisao, salvarRevisao } from '../utils/revisaoSalva'
import type { ProblemaRevisao } from '../utils/revisaoSalva'

const obterArmazenamento = () => window.localStorage

export function useRevisaoSalva() {
  const [inicial] = useState(() => lerRevisao(obterArmazenamento))
  const [projeto, setProjeto] = useState<Projeto | null>(inicial.projeto)
  const [problema, setProblema] = useState<ProblemaRevisao>(inicial.problema)
  const bloqueio = useRef<ProblemaRevisao>(inicial.problema)
  const esperado = useRef(inicial.texto)
  const [status, setStatus] = useState<'sem-projeto' | 'salvo' | 'erro' | 'bloqueado'>('sem-projeto')

  function bloquear(valor: ProblemaRevisao) {
    bloqueio.current = valor
    setProblema(valor)
    setStatus('bloqueado')
  }

  useEffect(() => {
    function conferir(evento: StorageEvent) {
      if (evento.key !== CHAVE_REVISAO && evento.key !== null) return
      try {
        if (evento.storageArea !== window.localStorage) return
        if (window.localStorage.getItem(CHAVE_REVISAO) !== esperado.current) bloquear('conflito')
      } catch { bloquear('acesso') }
    }
    window.addEventListener('storage', conferir)
    return () => window.removeEventListener('storage', conferir)
  }, [])

  useEffect(() => {
    if (bloqueio.current) { setStatus('bloqueado'); return }
    if (!projeto) { setStatus('sem-projeto'); return }
    const resultado = salvarRevisao(obterArmazenamento, esperado.current, projeto)
    if (resultado.status === 'conflito') { bloquear('conflito'); return }
    esperado.current = resultado.texto
    setStatus(resultado.status)
  }, [projeto])

  function autorizarImportacao(): boolean {
    // Relê após a leitura assíncrona do arquivo, antes de qualquer substituição.
    try {
      if (obterArmazenamento().getItem(CHAVE_REVISAO) !== esperado.current) {
        bloquear('conflito')
        return false
      }
    } catch { bloquear('acesso') }
    if (bloqueio.current === 'conflito') return false
    const mensagem = bloqueio.current === 'invalida'
      ? 'Existe uma revisão salva que não pôde ser recuperada. Importar substituirá essa cópia. Para preservá-la, cancele e use Baixar cópia para recuperação. Deseja substituir?'
      : 'Importar substituirá a revisão atual. Para guardar suas alterações, cancele e baixe o JSON revisado. Deseja substituir?'
    if ((projeto || bloqueio.current === 'invalida') && !window.confirm(mensagem)) return false
    if (bloqueio.current === 'invalida') {
      bloqueio.current = ''
      setProblema('')
    }
    return true
  }

  function baixarCopia() {
    if (inicial.texto === null) return
    baixarArquivo(inicial.texto, 'CenoQuant_copia_para_recuperacao.txt', 'text/plain;charset=utf-8')
  }

  return { projeto, setProjeto, status, problema, autorizarImportacao, baixarCopia,
    temCopia: inicial.texto !== null }
}
