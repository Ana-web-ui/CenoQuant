import type { Peca } from '../types/cenoquant'

export function celulaTexto(valor: string): string {
  const protegido = /^[\s\u0000-\u001f]*[=+\-@]/.test(valor)
    ? "'" + valor
    : valor
  return `"${protegido.replace(/"/g, '""')}"`
}

export function decimal(valor: number): string {
  return valor.toFixed(6).replace('.', ',')
}

export function gerarCsvPecas(
  pecas: Peca[], opcoes: { incluirExcluidos?: boolean } = {},
): string {
  const cabecalho = [
    'ID', 'Nome', 'Código', 'Observação', 'Categoria', 'Quantidade de objetos',
    'X mundo (m)', 'Y mundo (m)', 'Z mundo (m)',
    'Superfície modelada (m²)', 'Materiais',
  ]

  if (opcoes.incluirExcluidos) cabecalho.push('Inclusão no quantitativo')

  const linhas = pecas.filter((peca) => opcoes.incluirExcluidos || peca.included).map((peca) => {
    const area = peca.surfaces.reduce((soma, superficie) => soma + superficie.areaM2, 0)
    const materiais = [...new Set(
      peca.surfaces.map((superficie) => superficie.material.trim() || 'Sem material'),
    )].join(' | ')

    return [
      celulaTexto(peca.id),
      celulaTexto(peca.name),
      celulaTexto(peca.code),
      celulaTexto(peca.note),
      celulaTexto(peca.category),
      '1',
      ...peca.dimensionsM.map(decimal),
      decimal(area),
      celulaTexto(materiais),
      ...(opcoes.incluirExcluidos ? [celulaTexto(peca.included ? 'Incluído' : 'Excluído')] : []),
    ].join(';')
  })

  return '\uFEFF' + [cabecalho.map(celulaTexto).join(';'), ...linhas].join('\r\n')
}