import type { Projeto } from '../types/cenoquant'
import { validarCategoriasPersonalizadas } from './categoriasPersonalizadas'

export function renomearCategoria(
  projeto: Projeto, origem: string, destino: string, disponiveis: string[],
): Projeto {
  if (!disponiveis.includes(origem)) throw new Error('Escolha uma categoria existente.')
  const nome = validarCategoriasPersonalizadas([destino])[0]
  if (nome === origem) return projeto
  if (disponiveis.includes(nome)) throw new Error('O nome de destino já existe. Escolha outro nome para evitar unir categorias.')
  const personalizadas = validarCategoriasPersonalizadas(projeto.arquivoOriginal.customCategories)
  const novas = validarCategoriasPersonalizadas([...personalizadas.filter((c) => c !== origem), nome])
  return {
    ...projeto,
    pecas: projeto.pecas.map((peca) => peca.category === origem ? { ...peca, category: nome } : peca),
    arquivoOriginal: { ...projeto.arquivoOriginal, customCategories: novas },
  }
}
