import { useState } from 'react'
import { Search } from 'lucide-react'
import { useOrders } from '../lib/api'
import { byDate } from '../lib/format'
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

  const enviarZap = () => {
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const limite = new Date(); limite.setDate(hoje.getDate()+7); limite.setHours(23,59,59,999)
    const proximas = orders.filter(o=>{
      if(!o.data_entrega || o.status==='cancelada') return false
      const d=new Date(o.data_entrega+'T00:00:00'); return d>=hoje && d<=limite
    }).sort((a,b)=>byDate(a,b))
    if(!proximas.length) return alert('Nada nos prox 7 dias')
    let msg = `*HM PICOLES - PROX 7 DIAS*\n\n`
    proximas.forEach(o=>{
      const vTotal = Number(o.valor_total)||0
      const vPago = Number(o.valor_pago)||0
      const saldo = vTotal - vPago
      const dia = o.data_entrega?.split('-').reverse().join('/')||''
      msg += `*${o.cliente}* - ${dia}\n`
      if(o.order_items?.length){
        o.order_items.forEach(i=>{ msg+= `${i.sabor} x${i.quantidade}\n` })
      }
      msg += `${o.total_unidades||0} picoles - R$ ${vTotal.toFixed(2)} - ${o.pagamento==='paga'?'PAGO':'SALDO R$ '+saldo.toFixed(2)}\n\n`
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank')
  }

  return (
    <div className="page">
      <h1>Encomendas</h1>
      <div className="sub">{lista.length} encontrada(s)</div>
      <button onClick={enviarZap} className="btn" style={{background:'#25D366', marginBottom:12, width:'100%'}}>
        📲 Enviar resumo 7 dias no WhatsApp
      </button>
      <div className="search"><Search size={20} /><input placeholder="Buscar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <label>Data</label><input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      <div style={{ height: 14 }} />
      <Filters f={f} setF={setF} />
      {loading ? <div className="empty">Carregando…</div> : lista.map((o) => <OrderCard key={o.id} o={o} />)}
    </div>
  )
}