export const brl = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const todayISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
export const addDays = (iso, n) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
export const fmtDate = (iso) => (iso ? iso.split('-').reverse().join('/') : '')
export const fmtTime = (t) => (t ? t.slice(0, 5) : '')

export const STATUS = { agendada: 'Agendada', pronta: 'Pronta', entregue: 'Entregue/retirada', cancelada: 'Cancelada' }
export const PAGAMENTO = { pendente: 'Pendente de pagamento', parcial: 'Pagou uma parte', paga: 'Encomenda paga' }
export const STATUS_TONE = { agendada: 'in', pronta: 'wr', entregue: 'ok', cancelada: 'er' }
export const PAGAMENTO_TONE = { pendente: 'er', parcial: 'wr', paga: 'ok' }

export const isFinalizada = (o) => o.status === 'entregue' && o.pagamento === 'paga'
export const isLate = (o) => o.data_entrega < todayISO() && ['agendada', 'pronta'].includes(o.status)
export const byDate = (a, b) =>
  (a.data_entrega + (a.horario || '')).localeCompare(b.data_entrega + (b.horario || ''))
