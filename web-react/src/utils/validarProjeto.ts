import type { Peca, Projeto } from '../types/cenoquant'
import { validarPeca } from './validarPeca'
import { validarAvisos } from './validarAvisos'
import { validarAcrescimo } from './acrescimoMaterial'
import { validarCategoriasPersonalizadas } from './categoriasPersonalizadas'

function registro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function validarListaPecas(valor: unknown): Peca[] {
  if (!Array.isArray(valor) || valor.length > 10000) {
    throw new Error('Lista de peças inválida. O limite é de 10.000 objetos.')
  }
  let totalSuperficies = 0
  const ids = new Set<string>()
  return valor.map((item) => {
    const peca = validarPeca(item)
    if (ids.has(peca.id)) throw new Error('O arquivo contém identificadores repetidos.')
    ids.add(peca.id)
    totalSuperficies += peca.surfaces.length
    if (totalSuperficies > 100000) throw new Error('O limite total é de 100.000 registros de superfície.')
    return peca
  })
}

export function validarProjeto(valor: unknown): Projeto {
  if (!registro(valor) || valor.schema !== 'ceno-quant/1' || !registro(valor.project)) {
    throw new Error('Esse arquivo não está no formato do Ceno Quant.')
  }
  const meta = valor.project
  for (const campo of ['name', 'source', 'application', 'scene', 'scope', 'extractedAt']) {
    if (meta[campo] !== undefined && (typeof meta[campo] !== 'string' || meta[campo].length > 2000)) {
      throw new Error(`Metadado ${campo}: informe um texto de até 2.000 caracteres.`)
    }
  }
  if (typeof meta.name !== 'string' || !meta.name.trim()) throw new Error('O projeto precisa de um nome.')
  if (!['blender', '3dsmax'].includes(String(meta.source))) {
    throw new Error('O projeto precisa indicar Blender ou 3ds Max como origem.')
  }
  if (typeof meta.extractedAt !== 'string' || !meta.extractedAt.trim() || !Number.isFinite(Date.parse(meta.extractedAt))) {
    throw new Error('A data de extração do projeto é inválida.')
  }
  const pecas = validarListaPecas(valor.pieces)
  validarAvisos(valor.warnings)
  validarAcrescimo(valor.lossPercent)
  validarCategoriasPersonalizadas(valor.customCategories)
  // Mantém campos adicionais e os dados originais para exportação e comparação.
  return { nome: meta.name, pecas, arquivoOriginal: valor }
}

export function recuperarRevisao(valor: unknown): Projeto {
  if (!registro(valor) || typeof valor.nome !== 'string' || !valor.nome.trim() || valor.nome.length > 2000 ||
      !Array.isArray(valor.pecas) || valor.pecas.length > 10000) {
    throw new Error('Revisão salva inválida.')
  }
  const original = validarProjeto(valor.arquivoOriginal)
  const porId = new Map(original.pecas.map((p) => [p.id, p]))
  const pecas = validarListaPecas(valor.pecas.map((item: unknown) => {
    if (!registro(item) || typeof item.id !== 'string') throw new Error('Objeto salvo inválido.')
    const anterior = porId.get(item.id)
    if (!anterior) throw new Error('Objeto salvo não pertence ao JSON importado.')
    return {
      ...item,
      code: item.code === undefined ? anterior.code : item.code,
      note: item.note === undefined ? anterior.note : item.note,
    }
  }))
  if (pecas.length !== original.pecas.length) throw new Error('A revisão salva contém uma lista incompleta de objetos.')
  return { nome: valor.nome, pecas, arquivoOriginal: original.arquivoOriginal }
}
