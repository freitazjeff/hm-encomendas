import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useOrders } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { byDate, isFinalizada, todayISO } from '../lib/format'
import { OrderCard } from '../components.jsx'

export default function Home() {
  const { orders, loading, error } = useOrders()
  const { profile } = useAuth()
  const h = todayISO()
  const ativos = orders.filter((o) => ['agendada', 'pronta'].includes(o.status)).sort(byDate)
  const hoje = orders.filter((o) => o.data_entrega === h && o.status !== 'cancelada').sort(byDate)
  const concluidas = hoje.filter(isFinalizada).length
  const proximas = ativos.filter((o) => o.data_entrega > h).slice(0, 5)
  const atrasadas = ativos.filter((o) => o.data_entrega < h)

  return (
    <div className="page">
      <div className="head">
        <div><div className="sub">Olá, {profile.nome.split(' ')[0]}</div><h1>Início</h1></div>
        <div className="avatar">{profile.nome[0]}</div>
      </div>
      <div className="hero">
        <div className="big">{loading ? '–' : hoje.length}</div>
        <p>entregas e retiradas previstas para hoje</p>
        {!loading && hoje.length > 0 && <div className="mini">✓ {concluidas} finalizada(s) · {hoje.length - concluidas} pendente(s)</div>}
      </div>
      <Link to="/nova" className="btn-pill"><Plus size={20} /> Nova encomenda</Link>
      {error && <div className="err">{error}</div>}
      {atrasadas.length > 0 && <div className="err">{atrasadas.length} encomenda(s) com data passada ainda não concluída(s).</div>}
      <h2>Hoje</h2>
      {hoje.length ? hoje.map((o) => <OrderCard key={o.id} o={o} />) : <div className="empty">Nada previsto para hoje.</div>}
      <h2>Próximas encomendas</h2>
      {proximas.length ? proximas.map((o) => <OrderCard key={o.id} o={o} />) : <div className="empty">Sem próximas encomendas.</div>}
      {atrasadas.length > 0 && (<><h2>Atrasadas</h2>{atrasadas.map((o) => <OrderCard key={o.id} o={o} />)}</>)}
    </div>
  )
}
