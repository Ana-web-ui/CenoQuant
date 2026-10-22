import type { Peca } from '../types/cenoquant'

export function calcularSuperficieIncluida(pecas: Peca[]): number {
  return pecas
    .filter((peca) => peca.included)
    .reduce(
      (total, peca) =>
        total +
        peca.surfaces.reduce(
          (subtotal, superficie) => subtotal + superficie.areaM2,
          0,
        ),
      0,
    )
}