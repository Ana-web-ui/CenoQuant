import type { ProblemaRevisao } from '../utils/revisaoSalva'

type Props = { problema: ProblemaRevisao; temCopia: boolean; aoBaixar: () => void }
export default function ProtecaoRevisao({ problema, temCopia, aoBaixar }: Props) {
  if (!problema) return null
  return <section className="cartao" aria-labelledby="titulo-recuperacao">
    <h2 id="titulo-recuperacao">Proteção da revisão salva</h2>
    <p role="alert">
      {problema === 'invalida' && 'Não foi possível recuperar a revisão salva. A cópia existente foi preservada e o salvamento automático está pausado.'}
      {problema === 'acesso' && 'Não foi possível acessar o armazenamento do navegador. Você pode trabalhar nesta sessão, mas precisa baixar o JSON revisado para guardar as alterações.'}
      {problema === 'conflito' && 'A cópia salva foi alterada ou removida em outra aba. O salvamento automático e a importação estão pausados nesta aba para evitar uma substituição acidental.'}
    </p>
    {problema === 'invalida' && <>
      <p>Baixe a cópia para recuperação antes de importar outro projeto. Esse arquivo guarda o conteúdo original para análise; não é um JSON revisado pronto para importar.</p>
      {temCopia && <button type="button" onClick={aoBaixar}>Baixar cópia para recuperação</button>}
      <p>Depois, importe um JSON válido. A substituição só ocorrerá após sua confirmação.</p>
    </>}
    {problema === 'conflito' && <p>Baixe o JSON revisado desta aba para preservar seu trabalho. Depois atualize a página para abrir a cópia atualmente salva e continue em apenas uma aba.</p>}
  </section>
}
