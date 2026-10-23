import type { Projeto } from '../types/cenoquant'

export function gerarJsonRevisado(projeto: Projeto): string {
  const originais = projeto.arquivoOriginal.pieces
  if (!Array.isArray(originais)) throw new Error('Não foi possível encontrar os objetos originais.')

  const revisoes = new Map(
    projeto.pecas.map((peca) => [peca.id, peca]),
  )

  const pecasRevisadas = originais.map((valor: unknown) => {
    const original = valor as Record<string, unknown>
    const revisao = revisoes.get(original.id as string)

    if (!revisao) return original

    return {
      ...original,
      code: revisao.code,
      note: revisao.note,
      category: revisao.category,
      included: revisao.included,
    }
  })

  const arquivoRevisado = {
    ...projeto.arquivoOriginal,
    pieces: pecasRevisadas,
  }

  return JSON.stringify(arquivoRevisado, null, 2)

}
