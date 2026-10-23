import type { MaterialResumo } from './calcularResumoMateriais'
import { celulaTexto, decimal } from './gerarCsvPecas'
import { aplicarAcrescimo } from './acrescimoMaterial'

export function gerarCsvMateriais(
  materiais: MaterialResumo[], superficie: number, acrescimo: number, porCategoria = false,
): string {
  const cabecalho = [...(porCategoria ? ['Categoria'] : []), 'Material',
    'Superfície medida (m²)', 'Acréscimo (%)', 'Área com acréscimo (m²)']
  const linhas = materiais.map((m) => [
    ...(porCategoria ? [m.categoria ?? 'Sem categoria'] : []), m.material,
    decimal(m.areaM2), decimal(acrescimo), decimal(aplicarAcrescimo(m.areaM2, acrescimo)),
  ])
  linhas.push([...(porCategoria ? [''] : []), 'Total de superfície',
    decimal(superficie), decimal(acrescimo), decimal(aplicarAcrescimo(superficie, acrescimo))])
  return '\uFEFF' + [cabecalho, ...linhas].map((linha) => linha.map(celulaTexto).join(';')).join('\r\n')
}
