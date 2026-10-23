import type { Projeto } from '../types/cenoquant'
import { recuperarRevisao } from './validarProjeto'

export const CHAVE_REVISAO = 'cenoquant-revisao-v1'
export type ProblemaRevisao = '' | 'invalida' | 'acesso' | 'conflito'
export type LeituraRevisao = { projeto: Projeto | null; texto: string | null; problema: ProblemaRevisao }
type Armazenamento = Pick<Storage, 'getItem' | 'setItem'>

export function lerRevisao(obter: () => Armazenamento): LeituraRevisao {
  let texto: string | null
  try { texto = obter().getItem(CHAVE_REVISAO) }
  catch { return { projeto: null, texto: null, problema: 'acesso' } }
  if (texto === null) return { projeto: null, texto, problema: '' }
  try { return { projeto: recuperarRevisao(JSON.parse(texto)), texto, problema: '' } }
  catch { return { projeto: null, texto, problema: 'invalida' } }
}

// Confere a cópia conhecida imediatamente antes de gravar. Nunca apaga a anterior.
export function salvarRevisao(obter: () => Armazenamento, esperado: string | null, projeto: Projeto) {
  try {
    const armazenamento = obter()
    if (armazenamento.getItem(CHAVE_REVISAO) !== esperado) return { status: 'conflito' as const, texto: esperado }
    const texto = JSON.stringify(projeto)
    if (texto !== esperado) armazenamento.setItem(CHAVE_REVISAO, texto)
    return { status: 'salvo' as const, texto }
  } catch { return { status: 'erro' as const, texto: esperado } }
}
