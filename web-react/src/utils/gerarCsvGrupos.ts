import type { GrupoPecas } from './calcularGrupos'
import { celulaTexto, decimal } from './gerarCsvPecas'

export function gerarCsvGrupos(grupos: GrupoPecas[]): string {
  const cabecalho = [
    'Categoria', 'Código', 'Objeto sem código', 'Quantidade de objetos',
    'X mundo (m)', 'Y mundo (m)', 'Z mundo (m)',
    'Superfície modelada total (m²)', 'Materiais',
  ]
  const linhas = grupos.map((grupo) => [
    celulaTexto(grupo.categoria), celulaTexto(grupo.codigo), celulaTexto(grupo.objeto),
    String(grupo.quantidade), ...grupo.dimensoes.map(decimal), decimal(grupo.areaM2),
    celulaTexto(grupo.materiais.join(' | ')),
  ].join(';'))
  return '\uFEFF' + [cabecalho.map(celulaTexto).join(';'), ...linhas].join('\r\n')
}
