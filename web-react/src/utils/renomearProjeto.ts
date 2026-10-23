import type { Projeto } from '../types/cenoquant'

export function renomearProjeto(projeto: Projeto, valor: string): Projeto {
  if (typeof valor !== 'string' || !valor.trim() || valor.length > 2000) {
    throw new Error('Informe um nome de projeto de 1 a 2.000 caracteres.')
  }
  const nome = valor.trim()
  if (nome === projeto.nome) return projeto
  const metadados = projeto.arquivoOriginal.project
  if (!metadados || typeof metadados !== 'object' || Array.isArray(metadados)) {
    throw new Error('Não foi possível localizar os dados do projeto.')
  }
  return {
    ...projeto,
    nome,
    arquivoOriginal: {
      ...projeto.arquivoOriginal,
      project: { ...metadados, name: nome },
    },
  }
}
