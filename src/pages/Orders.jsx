import { useState } from 'react'
import { Search } from 'lucide-react'
import { useOrders } from '../lib/api'
import { byDate, brl, fmtDate } from '../lib/format'
import { applyFilters, Filters, OrderCard } from '../components.jsx'

export default function Orders() {
  const { orders, loading } = useOrders()
  const [q, setQ] = useState('')
  const [data, setData] = useState('')
  const [f, setF] = useState({ status: '', modalidade: '' })
  const t = q.trim().toLowerCase()
  const dig = t.replace(/\D/g, '')
  const lista = applyFilters(orders, f)
    .filter((o) => (!t || o.cliente.toLowerCase().includes(t) || (dig && (o.telefone || '').replace(/\D/g, '').includes(dig))) && (!data || o.data_entrega === data))
    .sort((a, b) => byDate(b, a))

  const enviarResumoWhatsapp = () => {
    const hoje = new Date()
    hoje.setHours(0,0,0,0)
    const limite = new Date()
    limite.setDate(hoje.getDate() + 7)
    limite.setHours(23,59,59,999)

    const proximas = orders.filter((o) => {
      if (!o.data_entrega) return false
      if (o.status === 'cancelada') return false
      const d = new Date(o.data_entrega + 'T00:00:00')
      return d >= hoje && d <= limite
    }).sort((a, b) => byDate(a, b))

    if (proximas.length === 0) {
      alert('Nenhuma encomenda nos próximos 7 dias!')
      return
    }

    let totalGeral = 0
    let saldoGeral = 0
    let qtdGeral = 0

    let msg = `*HM PICOLES - PROXIMOS 7 DIAS*\n`
    msg += `${hoje.toLocaleDateString('pt-BR')} a ${limite.toLocaleDateString('pt-BR')}\n`
    msg += `----------------------------\n\n`

    proximas.forEach((o) => {
      const dataF = fmtDate(o.data_entrega)
      const valorTotal = Number(o.valor_total) || 0
      const valorPago = Number(o.valor_pago) || 0
      const saldo = Math.max(0, valorTotal - valorPago)
      const ehPaga = o.pagamento === 'paga'

      totalGeral += valorTotal
      saldoGeral += saldo
      qtdGeral += Number(o.total_unidades) || 0

      // NÃO começa com data pra não virar calendario no Zap
      msg += `*${o.cliente}* - ${dataF} - ${o.status}\n`
      if (o.order_items?.length) {
        o.order_items.forEach(i => {
          msg += `${i.sabor} x${i.quantidade}\n`
        })
      }
      msg += `${brl(valorTotal)} - ${ehPaga ? 'PAGO' : `SALDO ${brl(saldo)}`}\n`
      if (o.telefone) msg += `${o.telefone}\n`
      msg += `\n`
    })

    msg += `----------------------------\n`
    msg += `Pedidos: ${proximas.length}\n`
    msg += `Picoles: ${qtdGeral}\n`
    msg += `Total: ${brl(totalGeral)}\n`
    msg += `A receber: ${brl(saldoGeral)}\n`

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="page">
      <div className="head">
        <div>
          <h1>Encomendas</h1>
          <div className="sub">{lista.length} encontrada(s)</div>
        </div>
        <button 
          onClick={enviarResumoWhatsapp}
          style={{ background: '#25D366', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📲 Resumo 7 dias
        </button>
      </div>
      <div className="search"><Search size={20} /><input placeholder="Buscar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <label>Data</label>
      <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      <div style={{ height: 14 }} />
      <Filters f={f} setF={setF} />
      {loading ? <div className="empty">Carregando…</div> : lista.map((o) => <OrderCard key={o.id} o={o} />)}
    </div>
  )
}