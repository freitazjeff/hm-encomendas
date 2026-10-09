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

    let msg = `*HM PICOLES - PROX 7 DIAS*\n`
    let tot = 0
    proximas.forEach(o=>{
      const v = Number(o.valor_total)||0
      tot+=v
      const dia = o.data_entrega?.split('-').reverse().join('/')||''
      msg += `*${o.cliente}* - ${dia} - ${o.status}\n`
      if(o.order_items?.length){
        o.order_items.forEach(i=>{ msg+= `${i.sabor} x${i.quantidade}\n` })
      }
      const pago = o.pagamento==='paga' ? 'PAGO' : `SALDO R$ ${ (v - (Number(o.valor_pago)||0)).toFixed(2) }`
      msg += `R$ ${v.toFixed(2)} - ${pago}\n\n`
    })
    msg += `Total a receber proximos 7 dias: R$ ${tot.toFixed(2)}\n`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank')
  }

  return (
    <div className="page" style={{paddingBottom:100}}>
      <h1>Encomendas</h1>
      <div className="sub">{lista.length} encontrada(s)</div>
      <div className="search"><Search size={20} /><input placeholder="Buscar por nome ou telefone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <label>Data</label>
      <input type="date" value={data} onChange={(e) => setData(e.target.value)} />
      <div style={{ height: 14 }} />
      <Filters f={f} setF={setF} />
      {loading ? <div className="empty">Carregando…</div> : lista.map((o) => <OrderCard key={o.id} o={o} />)}

      <button onClick={enviarZap} style={{position:'fixed', bottom:85, right:20, background:'#25D366', color:'white', border:'none', padding:'14px 22px', borderRadius:'30px', fontWeight:'bold', boxShadow:'0 4px 12px rgba(0,0,0,0.3)', zIndex:9999}}>
        📲 Resumo 7 dias
      </button>
    </div>
  )
}