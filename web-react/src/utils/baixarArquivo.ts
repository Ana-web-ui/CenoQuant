/** Inicia um download local e libera a URL temporária após o clique. */
export function baixarArquivo(conteudo: string, nome: string, tipo: string): void {
  const arquivo = new Blob([conteudo], { type: tipo })
  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(endereco), 1000)
}
