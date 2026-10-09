import { useState } from 'react'
import { useOrders } from '../lib/api'
import { addDays, byDate, fmtDate, todayISO } from '../lib/format'
import { applyFilters, Chips, Filters, OrderCard } from '../components.jsx'

export default function Agenda() {
  const { orders, loading } = useOrders()
  const [per, setPer] = useState('semana')
  const [f, setF] = useState({ status: '', modalidade: '' })
  const h = todayISO()
  const fim = per === 'dia' ? h : addDays(h, per === 'semana' ? 6 : 30)
  const lista = applyFilters(orders, f).filter((o) => o.data_entrega >= h && o.data_entrega <= fim).sort(byDate)
  const grupos = lista.reduce((g, o) => ((g[o.data_entrega] ||= []).push(o), g), {})

  return (
    <div className="page">
      <div className="head"><div><h1>Agenda</h1><div className="sub">Encomendas por data de entrega/retirada</div></div></div>
      <Chips value={per} onChange={setPer} options={[['dia', 'Hoje'], ['semana', '7 dias'], ['mes', '30 dias']]} />
      <Filters f={f} setF={setF} />
      {loading ? <div className="empty">Carregando…</div> :
        Object.keys(grupos).length ? Object.keys(grupos).map((d) => (
          <div key={d}><h2>{fmtDate(d)}</h2>{grupos[d].map((o) => <OrderCard key={o.id} o={o} />)}</div>
        )) : <div className="empty">Nenhuma encomenda no período.</div>}
    </div>
  )
}
