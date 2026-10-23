import { correspondeConferencia } from './conferirPecas'
import type { FiltroConferencia } from './conferirPecas'
import type { Peca } from '../types/cenoquant'

export type FiltroInclusao = 'todos' | 'incluidos' | 'excluidos'

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').trim()
}

export function filtrarPecas(
  pecas: Peca[], busca: string, categoria: string, inclusao: FiltroInclusao,
  conferencia: FiltroConferencia = 'todas',
  material: string | null = null,
): Peca[] {
  const termo = normalizar(busca)
  return pecas.filter((peca) => {
    const texto = [peca.name, peca.code, peca.note].some((campo) => normalizar(campo).includes(termo))
    const mesmaCategoria = !categoria || peca.category === categoria
    const mesmoEstado = inclusao === 'todos' ||
      (inclusao === 'incluidos' ? peca.included : !peca.included)
    const mesmoMaterial = material === null || peca.surfaces.some((s) => s.material === material)
    return texto && mesmaCategoria && mesmoEstado && mesmoMaterial && correspondeConferencia(peca, conferencia)
  })
}
