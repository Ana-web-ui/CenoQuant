import type { Aviso } from '../types/cenoquant'
import { celulaTexto } from './gerarCsvPecas'

export function gerarCsvAvisos(avisos: Aviso[], nomeProjeto: string): string {
  const cabecalho = ['Projeto', 'Objeto ou contexto', 'Aviso da extração original']
  const linhas = avisos.map((aviso) => [
    nomeProjeto, aviso.object, aviso.message,
  ].map(celulaTexto).join(';'))
  return '\uFEFF' + [cabecalho.map(celulaTexto).join(';'), ...linhas].join('\r\n')
}
