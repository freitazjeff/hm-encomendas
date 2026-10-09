import { brl, fmtDate, fmtTime, isFinalizada, PAGAMENTO, STATUS } from './format'

export function resumoEncomenda(o) {
  const saldo = Math.max(0, o.valor_total - o.valor_pago)
  return [
    '*Encomenda HM Picolés*',
    `Cliente: ${o.cliente}`,
    o.telefone ? `Telefone: ${o.telefone}` : null,
    `${o.modalidade === 'entrega' ? 'Entrega' : 'Retirada'}: ${fmtDate(o.data_entrega)}${o.horario ? ` às ${fmtTime(o.horario)}` : ''}`,
    o.modalidade === 'entrega' && o.endereco ? `Endereço: ${o.endereco}` : null,
    '',
    '*Sabores*',
    ...o.order_items.map((i) => `• ${i.sabor} × ${i.quantidade}`),
    '',
    `Total: ${o.total_unidades} picolés — ${brl(o.valor_total)}`,
    `Pagamento: ${PAGAMENTO[o.pagamento]}${saldo > 0 ? ` (falta ${brl(saldo)})` : ''}`,
    `Situação: ${isFinalizada(o) ? "Finalizada ✅" : STATUS[o.status]}`,
    o.observacoes ? `Obs.: ${o.observacoes}` : null,
  ].filter((l) => l !== null).join('\n')
}

// Sem número no link: o WhatsApp abre na lista de contatos e o vendedor escolhe para quem enviar.
export function enviarWhatsApp(texto) {
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
}
