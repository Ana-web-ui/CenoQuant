import { useState } from 'react'
import type { ChangeEvent } from 'react'

type Props = {
  valor: string
  rotulo: string
  multilinha?: boolean
  aoConfirmar: (valor: string) => void
  aoFinalizar: () => void
}

// O rascunho mantém a linha estável enquanto o usuário digita sob filtros.
// A chave usada na tabela reinicia o rascunho ao desfazer ou atualizar o valor externo.
export default function CampoTextoPeca({ valor, rotulo, multilinha = false, aoConfirmar, aoFinalizar }: Props) {
  const [rascunho, setRascunho] = useState(valor)
  const props = {
    'aria-label': rotulo,
    value: rascunho,
    maxLength: 2000,
    onChange: (evento: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRascunho(evento.target.value),
    onBlur: () => {
      if (rascunho !== valor) aoConfirmar(rascunho)
      aoFinalizar()
    },
  }
  return multilinha ? <textarea {...props} rows={2} /> : <input {...props} type="text" />
}
