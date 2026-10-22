export type Superficie = {
    material: string
    areaM2: number
}

export type Peca = {
    id: string
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