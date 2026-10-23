import type { AlteracaoRevisao } from './compararRevisao'
import { celulaTexto } from './gerarCsvPecas'

export function gerarCsvAlteracoes(alteracoes: AlteracaoRevisao[], projeto: string): string {
  const cabecalho = ['Projeto', 'ID', 'Objeto', 'Campo', 'No JSON importado', 'Na revisão atual']
  const linhas = alteracoes.map((a) => [projeto, a.id, a.nome, a.campo, a.antes, a.depois]
    .map(celulaTexto).join(';'))
  return '\uFEFF' + [cabecalho.map(celulaTexto).join(';'), ...linhas].join('\r\n')
}
