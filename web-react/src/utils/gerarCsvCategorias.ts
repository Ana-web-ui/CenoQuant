import { celulaTexto } from './gerarCsvPecas'

type CategoriaResumo = { categoria: string; quantidade: number }

export function gerarCsvCategorias(categorias: CategoriaResumo[], totalIncluido: number): string {
  const linhas: (string | number)[][] = [
    ['Categoria', 'Objetos incluídos'],
    ...categorias.map((item) => [item.categoria, item.quantidade]),
    ['Total incluído', totalIncluido],
  ]
  return '\uFEFF' + linhas
    .map((linha) => linha.map((valor) => typeof valor === 'number' ? String(valor) : celulaTexto(valor)).join(';'))
    .join('\r\n')
}
