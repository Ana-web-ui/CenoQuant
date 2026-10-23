export type Superficie = {
    material: string
    areaM2: number
}

export type Peca = {
    id: string
    code: string
    note: string
    name:string
    category: string
    dimensionsM: [number, number, number]
    included: boolean
    surfaces: Superficie[]
}

export type Projeto = {
    nome: string
    pecas: Peca[]
    arquivoOriginal: Record<string, unknown>
}

export type Aviso = {
  object: string
  message: string
}