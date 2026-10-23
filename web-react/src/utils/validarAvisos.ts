import type { Aviso } from '../types/cenoquant'

export function validarAvisos(valor: unknown): Aviso[] {
  if (valor === undefined) return []

  if (!Array.isArray(valor) || valor.length > 20000) {
    throw new Error('Lista de avisos inválida ou acima de 20.000 registros.')
  }

  return valor.map((item: unknown) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error('O arquivo contém um aviso inválido.')
    }

    const aviso = item as Record<string, unknown>

    if (
      typeof aviso.object !== 'string' ||
      typeof aviso.message !== 'string' ||
      aviso.object.length > 2000 ||
      aviso.message.length > 2000
    ) {
      throw new Error('Há um aviso com objeto ou mensagem inválidos.')
    }

    return {
      object: aviso.object.trim() || 'Geral',
      message: aviso.message,
    }
  })
}