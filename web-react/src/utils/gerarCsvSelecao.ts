import type { Peca } from '../types/cenoquant'
import { gerarCsvPecas } from './gerarCsvPecas'

export function gerarCsvSelecao(pecas: Peca[], selecionados: ReadonlySet<string>): string {
  return gerarCsvPecas(pecas.filter((peca) => selecionados.has(peca.id)), { incluirExcluidos: true })
}
