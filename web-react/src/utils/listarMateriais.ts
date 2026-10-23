import type { Peca } from '../types/cenoquant'

export function listarMateriais(pecas: Peca[]): string[] {
  return [...new Set(pecas.flatMap((peca) => peca.surfaces.map((s) => s.material)))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
}
