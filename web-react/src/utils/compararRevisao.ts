import type { Peca } from '../types/cenoquant'
import { validarPeca } from './validarPeca'

export type AlteracaoRevisao = {
  id: string
  nome: string
  campo: string
  antes: string
  depois: string
}

export function compararRevisao(pecas: Peca[], originais: unknown): AlteracaoRevisao[] {
  if (!Array.isArray(originais)) throw new Error('Referência de comparação inválida.')
  const referencia = originais.map(validarPeca)
  const porId = new Map(referencia.map((peca) => [peca.id, peca]))
  if (porId.size !== referencia.length) throw new Error('Identificadores repetidos na referência.')
  const resultado: AlteracaoRevisao[] = []
  for (const peca of pecas) {
    const anterior = porId.get(peca.id)
    if (!anterior) throw new Error('Objeto sem referência no arquivo importado.')
    const campos = [
      ['Categoria', anterior.category, peca.category],
      ['Inclusão', anterior.included ? 'Incluído' : 'Excluído', peca.included ? 'Incluído' : 'Excluído'],
      ['Código', anterior.code, peca.code],
      ['Observação', anterior.note, peca.note],
    ]
    for (const [campo, antes, depois] of campos) {
      if (antes !== depois) resultado.push({ id: peca.id, nome: peca.name, campo, antes, depois })
    }
  }
  return resultado
}
