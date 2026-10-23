import type { Peca } from '../types/cenoquant'

export type FiltroConferencia = 'todas' | 'sem-categoria' | 'sem-codigo' |
  'sem-superficies' | 'material-sem-nome'
export type IndicadorConferencia = {
  filtro: Exclude<FiltroConferencia, 'todas'>
  titulo: string
  quantidade: number
}

export function correspondeConferencia(peca: Peca, filtro: FiltroConferencia): boolean {
  if (filtro === 'sem-categoria') return !peca.category.trim() || peca.category.trim().toLocaleLowerCase('pt-BR') === 'sem categoria'
  if (filtro === 'sem-codigo') return !peca.code.trim()
  if (filtro === 'sem-superficies') return peca.surfaces.length === 0
  if (filtro === 'material-sem-nome') return peca.surfaces.some((s) => !s.material.trim())
  return true
}

export function conferirPecas(pecas: Peca[]): IndicadorConferencia[] {
  const indicadores: IndicadorConferencia[] = [
    { filtro: 'sem-categoria', titulo: 'Sem categoria', quantidade: 0 },
    { filtro: 'sem-codigo', titulo: 'Sem código', quantidade: 0 },
    { filtro: 'sem-superficies', titulo: 'Sem superfícies registradas', quantidade: 0 },
    { filtro: 'material-sem-nome', titulo: 'Com material sem nome', quantidade: 0 },
  ]
  for (const peca of pecas) {
    if (!peca.included) continue
    for (const indicador of indicadores) {
      if (correspondeConferencia(peca, indicador.filtro)) indicador.quantidade += 1
    }
  }
  return indicadores
}
