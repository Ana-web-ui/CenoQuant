import type { Peca } from '../types/cenoquant'

export type OrdemPecas = 'original' | 'nome-asc' | 'nome-desc' | 'codigo' | 'categoria' |
  'area-desc' | 'area-asc' | 'x-desc' | 'y-desc' | 'z-desc'

const comparador = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' })

export function ordenarPecas(pecas: Peca[], ordem: OrdemPecas): Peca[] {
  const linhas = pecas.map((peca, indice) => ({
    peca, indice,
    area: ordem.startsWith('area-')
      ? peca.surfaces.reduce((soma, s) => soma + s.areaM2, 0) : 0,
  }))
  if (ordem === 'original') return [...pecas]
  linhas.sort((a, b) => {
    let resultado = 0
    if (ordem === 'nome-asc') resultado = comparador.compare(a.peca.name, b.peca.name)
    if (ordem === 'nome-desc') resultado = comparador.compare(b.peca.name, a.peca.name)
    if (ordem === 'categoria') resultado = comparador.compare(a.peca.category, b.peca.category)
    if (ordem === 'codigo') {
      const codigoA = a.peca.code.trim(), codigoB = b.peca.code.trim()
      resultado = !codigoA && codigoB ? 1 : codigoA && !codigoB ? -1 : comparador.compare(codigoA, codigoB)
    }
    if (ordem === 'area-desc') resultado = b.area - a.area
    if (ordem === 'area-asc') resultado = a.area - b.area
    if (ordem === 'x-desc') resultado = b.peca.dimensionsM[0] - a.peca.dimensionsM[0]
    if (ordem === 'y-desc') resultado = b.peca.dimensionsM[1] - a.peca.dimensionsM[1]
    if (ordem === 'z-desc') resultado = b.peca.dimensionsM[2] - a.peca.dimensionsM[2]
    return resultado || a.indice - b.indice
  })
  return linhas.map((linha) => linha.peca)
}
