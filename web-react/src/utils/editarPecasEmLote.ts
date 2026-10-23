import type { Peca } from '../types/cenoquant'

export type AlteracaoPecas = Partial<Pick<Peca, 'category' | 'included' | 'code' | 'note'>>

export function descreverAlteracaoLote(alteracao: AlteracaoPecas): string {
  const acoes: string[] = []
  if (alteracao.category !== undefined) acoes.push(`Aplicar a categoria "${alteracao.category}"`)
  if (alteracao.included !== undefined) acoes.push(alteracao.included ? 'Incluir no quantitativo' : 'Excluir do quantitativo')
  if (alteracao.code !== undefined) acoes.push(alteracao.code ? `Aplicar o código "${alteracao.code}"` : 'Limpar os códigos')
  if (alteracao.note !== undefined) acoes.push(alteracao.note ? 'Substituir as observações pelo texto informado' : 'Limpar as observações')
  return acoes.join('; ')
}

export function editarPecasEmLote(
  pecas: Peca[], ids: ReadonlySet<string>, alteracao: AlteracaoPecas,
): Peca[] {
  for (const campo of ['category', 'code', 'note'] as const) {
    const valor = alteracao[campo]
    if (valor !== undefined && (typeof valor !== 'string' || valor.length > 2000)) {
      throw new Error('Os textos da edição em lote devem ter até 2.000 caracteres.')
    }
  }
  if (alteracao.included !== undefined && typeof alteracao.included !== 'boolean') {
    throw new Error('A inclusão em lote deve ser booleana.')
  }
  return pecas.map((peca) => ids.has(peca.id) ? {
    ...peca,
    ...(alteracao.category !== undefined ? { category: alteracao.category.trim() || 'Sem categoria' } : {}),
    ...(alteracao.included !== undefined ? { included: alteracao.included } : {}),
    ...(alteracao.code !== undefined ? { code: alteracao.code } : {}),
    ...(alteracao.note !== undefined ? { note: alteracao.note } : {}),
  } : peca)
}
