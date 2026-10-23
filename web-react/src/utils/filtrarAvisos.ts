import type { Aviso } from '../types/cenoquant'

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').trim()
}

export function filtrarAvisos(avisos: Aviso[], busca: string): Aviso[] {
  const termo = normalizar(busca)
  return avisos.filter((aviso) =>
    normalizar(aviso.object).includes(termo) || normalizar(aviso.message).includes(termo),
  )
}
