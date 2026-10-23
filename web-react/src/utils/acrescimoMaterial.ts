export function validarAcrescimo(valor: unknown): number {
  if (valor === undefined) return 0
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > 100) {
    throw new Error('O acréscimo de materiais deve ser um número entre 0 e 100%.')
  }
  return valor
}

export function aplicarAcrescimo(areaM2: number, percentual: number): number {
  return areaM2 * (1 + validarAcrescimo(percentual) / 100)
}
