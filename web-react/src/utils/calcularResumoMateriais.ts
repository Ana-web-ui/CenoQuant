import type { Peca } from '../types/cenoquant'

export type MaterialResumo = { categoria?: string; material: string; areaM2: number }

export function calcularResumoMateriais(pecas: Peca[], porCategoria = false): MaterialResumo[] {
  const resultado = new Map<string, MaterialResumo>()
  for (const peca of pecas) {
    if (!peca.included) continue
    for (const superficie of peca.surfaces) {
      const material = superficie.material.trim() || 'Sem material'
      const chave = JSON.stringify([porCategoria ? peca.category : null, material])
      const item = resultado.get(chave) ?? {
        ...(porCategoria ? { categoria: peca.category } : {}), material, areaM2: 0,
      }
      item.areaM2 += superficie.areaM2
      resultado.set(chave, item)
    }
  }
  return [...resultado.values()].sort((a, b) =>
    (a.categoria ?? '').localeCompare(b.categoria ?? '', 'pt-BR') ||
    a.material.localeCompare(b.material, 'pt-BR'),
  )
}
