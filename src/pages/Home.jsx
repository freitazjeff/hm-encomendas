import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useOrders } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { byDate, isFinalizada, isLate, todayISO } from '../lib/format'
import { OrderCard } from '../components.jsx'

export default function Home() {
  const { orders, loading, error } = useOrders()
  const { profile } = useAuth()
  const h = todayISO()
  const ativas = orders.filter((o) => o.status !== 'cancelada').sort(byDate)

  // Na tela de Início aparecem só as pendentes (finalizadas ficam de fora)
  const hojeTodas = ativas.filter((o) => o.data_entrega === h)
  const hoje = hojeTodas.filter((o) => !isFinalizada(o))
  const concluidas = hojeTodas.length - hoje.length
  const proximas = ativas.filter((o) => o.data_entrega > h && !isFinalizada(o)).slice(0, 5)
  const atrasadas = ativas.filter(isLate)

  return (
    <div className="page">
      <div className="head">
        <img src="/logo.png" alt="HM Picolés" className="logo-home" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <div className="avatar">{profile.nome[0]}</div>
      </div>
      <div style={{ margin: '-6px 0 18px' }}>
        <div className="sub">Olá, {profile.nome.split(' ')[0]}</div>
        <h1>Início</h1>
      </div>
      <div className="hero">
        <div className="big">{loading ? '–' : hoje.length}</div>
        <p>pendentes para hoje</p>
        {!loading && concluidas > 0 && <div className="mini">✓ {concluidas} já finalizada(s) hoje</div>}
      </div>
      <Link to="/nova" className="btn-pill"><Plus size={20} /> Nova encomenda</Link>
      {error && <div className="err">{error}</div>}
      {atrasadas.length > 0 && <div className="err">{atrasadas.length} encomenda(s) com data passada ainda não concluída(s).</div>}
      <h2>Hoje</h2>
      {hoje.length ? hoje.map((o) => <OrderCard key={o.id} o={o} />) : <div className="empty">Nada pendente para hoje.</div>}
      <h2>Próximas encomendas</h2>
      {proximas.length ? proximas.map((o) => <OrderCard key={o.id} o={o} />) : <div className="empty">Sem próximas encomendas.</div>}
      {atrasadas.length > 0 && (<><h2>Atrasadas</h2>{atrasadas.map((o) => <OrderCard key={o.id} o={o} />)}</>)}
    </div>
  )
}
