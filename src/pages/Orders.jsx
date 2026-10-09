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
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const limite = new Date(); limite.setDate(hoje.getDate() + 7); limite.setHours(23,59,59,999)
    const proximas = orders.filter((o) => {
      if (!o.data_entrega) return false
      if (o.status === 'cancelada') return false
      const d = new Date(o.data_entrega + 'T00:00:00')
      return d >= hoje && d <= limite
    }).sort((a, b) => byDate(a, b))

    if (!proximas.length) { alert('Nenhuma nos próximos 7 dias'); return }

    let msg = `*HM PICOLES - PROXIMOS 7 DIAS*\n${hoje.toLocaleDateString('pt-BR')} a ${limite.toLocaleDateString('pt-BR')}\n----------------------------\n\n`
    let tot = 0, saldoTot = 0
    proximas.forEach(o => {
      const v = Number(o.valor_total)||0
      const s = Math.max(0, v - (Number(o.valor_pago)||0))
      tot+=v; saldoTot+=s
      msg += `*${o.cliente}* - ${fmtDate(o.data_entrega)} - ${o.status}\n`
      o.order_items?.forEach(i => { msg += `${i.sabor} x${i.quantidade}\n` })
      msg += `${brl(v)} - ${o.pagamento==='paga' ? 'PAGO' : `SALDO ${brl(s)}`}\n\n`
    })
    msg += `----------------------------\nA receber: ${brl(saldoTot)} | Total: ${brl(tot)}\n`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="page">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <div>
          <h1 style={{margin:0}}>Encomendas</h1>
          <div className="sub">{lista.length} encontrada(s)</div>
        </div>
        <button onClick={enviarResumoWhatsapp} style={{background:'#25D366', color:'white', border:'none', padding:'10px 16px', borderRadius:'10px', fontWeight:'bold'}}>📲 Resumo 7 dias</button>
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