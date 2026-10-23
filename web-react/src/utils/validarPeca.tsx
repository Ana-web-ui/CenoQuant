import type { Peca, Superficie } from '../types/cenoquant'

export function validarPeca(valor: unknown): Peca {
  if (typeof valor !== 'object' || valor === null) {
    throw new Error('O arquivo contém um objeto inválido.')
  }

  const peca = valor as Record<string, unknown>
  const dimensoes = peca.dimensionsM

  if (
    typeof peca.id !== 'string' ||
    !peca.id.trim() ||
    peca.id.length > 2000 ||
    typeof peca.name !== 'string' ||
    peca.name.length > 2000 ||
    !Array.isArray(dimensoes) ||
    dimensoes.length !== 3 ||
    !dimensoes.every(
      (numero) =>
        typeof numero === 'number' &&
        Number.isFinite(numero) &&
        numero >= 0 && numero <= 1e7,
    )
  ) {
    throw new Error('Há objetos com identificação ou dimensões inválidas.')
  }

  for (const campo of ['code', 'note', 'category']) {
    const texto = peca[campo]
    if (texto !== undefined && (typeof texto !== 'string' || texto.length > 2000)) {
      throw new Error('Categoria, código e observação devem ser textos de até 2.000 caracteres.')
    }
  }

  if (peca.included !== undefined && typeof peca.included !== 'boolean') {
    throw new Error('O campo included deve ser booleano (true ou false).')
  }

  const superficies = peca.surfaces

  if (!Array.isArray(superficies) || superficies.length > 500) {
    throw new Error('O arquivo contém um objeto com superfícies inválidas.')
  }

  const superficiesValidas: Superficie[] = superficies.map(
    (valor: unknown) => {
      if (typeof valor !== 'object' || valor === null) {
        throw new Error('Há uma superfície inválida no arquivo.')
      }

      const superficie = valor as Record<string, unknown>

      if (
        typeof superficie.material !== 'string' ||
        superficie.material.length > 2000 ||
        typeof superficie.areaM2 !== 'number' ||
        !Number.isFinite(superficie.areaM2) ||
        superficie.areaM2 < 0 ||
        superficie.areaM2 > 1e12
      ) {
        throw new Error('Há uma superfície com material ou área inválida.')
      }

      return {
        material: superficie.material,
        areaM2: superficie.areaM2,
      }
    },
  )

  return {
    code: typeof peca.code === 'string' ? peca.code : '',
    note: typeof peca.note === 'string' ? peca.note : '',
    id: peca.id,
    name: peca.name,
    category:
      typeof peca.category === 'string' && peca.category.trim()
        ? peca.category
        : 'Sem categoria',
    dimensionsM: dimensoes as [number, number, number],
    included: peca.included !== false,
    surfaces: superficiesValidas,
  }
}