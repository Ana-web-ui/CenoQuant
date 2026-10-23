export function validarCategoriasPersonalizadas(valor: unknown): string[] {
  if (valor === undefined) return []
  if (!Array.isArray(valor) || valor.length > 100) {
    throw new Error('A lista de categorias personalizadas deve ter até 100 nomes.')
  }
  return [...new Set(valor.map((nome: unknown) => {
    if (typeof nome !== 'string' || !nome.trim() || nome.length > 2000) {
      throw new Error('Cada categoria deve ter um nome de 1 a 2.000 caracteres.')
    }
    return nome.trim()
  }))]
}

export function adicionarCategoriaPersonalizada(
  atuais: string[], nome: string, disponiveis: string[],
): string[] {
  const categoria = validarCategoriasPersonalizadas([nome])[0]
  if (disponiveis.includes(categoria)) {
    throw new Error('Essa categoria já está disponível na lista.')
  }
  return validarCategoriasPersonalizadas([...atuais, categoria])
}
