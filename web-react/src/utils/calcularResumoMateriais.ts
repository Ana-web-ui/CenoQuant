import type { Peca } from '../types/cenoquant'

export function calcularResumoMateriais(pecas: Peca[]) {
  const areasPorMaterial = new Map<string, number>()

  for (const peca of pecas) {
    if (!peca.included) continue

    for (const superficie of peca.surfaces) {
      const material = superficie.material.trim() || 'Sem material'
      const areaAtual = areasPorMaterial.get(material) ?? 0

      areasPorMaterial.set(
        material,
        areaAtual + superficie.areaM2,
      )
    }
  }

  return [...areasPorMaterial.entries()]
    .map(([material, areaM2]) => ({
      material,
      areaM2,
    }))
    .sort((a, b) => a.material.localeCompare(b.material, 'pt-BR'))
}