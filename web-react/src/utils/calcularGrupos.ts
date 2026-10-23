import type { Peca } from '../types/cenoquant'

export type GrupoPecas = {
  chave: string
  categoria: string
  codigo: string
  objeto: string
  dimensoes: number[]
  materiais: string[]
  quantidade: number
  areaM2: number
}

export function calcularGrupos(pecas: Peca[]): GrupoPecas[] {
  const grupos = new Map<string, GrupoPecas>()
  for (const peca of pecas) {
    if (!peca.included) continue
    const codigo = peca.code.trim()
    const dimensoes = peca.dimensionsM.map((valor) => Math.round(valor * 1e6) / 1e6)
    // Preserva nomes exatos: materiais diferentes não são consolidados automaticamente.
    const materiais = [...new Set(peca.surfaces.map((s) => s.material))].sort()
    const chave = JSON.stringify([
      peca.category, codigo ? ['codigo', codigo] : ['objeto', peca.id], dimensoes, materiais,
    ])
    let grupo = grupos.get(chave)
    if (!grupo) {
      grupo = {
        chave, categoria: peca.category, codigo,
        objeto: codigo ? '' : peca.name,
        dimensoes, materiais, quantidade: 0, areaM2: 0,
      }
      grupos.set(chave, grupo)
    }
    grupo.quantidade += 1
    grupo.areaM2 += peca.surfaces.reduce((soma, s) => soma + s.areaM2, 0)
  }
  return [...grupos.values()].sort((a, b) =>
    a.categoria.localeCompare(b.categoria, 'pt-BR') ||
    a.codigo.localeCompare(b.codigo, 'pt-BR') ||
    a.objeto.localeCompare(b.objeto, 'pt-BR'),
  )
}
