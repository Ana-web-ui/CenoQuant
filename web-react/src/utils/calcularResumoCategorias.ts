import type { Peca } from '../types/cenoquant'

export function calcularResumoCategorias(pecas: Peca[]) {
  const contagemPorCategoria = new Map<string, number>()

  for (const peca of pecas) {
    if (!peca.included) continue

    const quantidadeAtual = contagemPorCategoria.get(peca.category) ?? 0

    contagemPorCategoria.set(peca.category, quantidadeAtual + 1)
  }

  return [...contagemPorCategoria.entries()]
    .map(([categoria, quantidade]) => ({
      categoria,
      quantidade,
    }))
    .sort((a, b) => a.categoria.localeCompare(b.categoria, 'pt-BR'))
}