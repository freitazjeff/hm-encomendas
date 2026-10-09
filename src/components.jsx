import { Link, NavLink, Outlet } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Check, ClipboardList, Home, Plus, Search, User } from 'lucide-react'
import { brl, fmtDate, fmtTime, isFinalizada, isLate, PAGAMENTO, PAGAMENTO_TONE, STATUS, STATUS_TONE } from './lib/format'

export const Badge = ({ tone, children }) => <span className={`badge ${tone}`}>{children}</span>

export function OrderBadges({ o }) {
  const fim = isFinalizada(o)
  return (
    <div className="badges">
      {fim ? (
        <Badge tone="ok"><Check size={12} strokeWidth={3} style={{ verticalAlign: '-1px' }} /> Finalizada</Badge>
      ) : (
        <>
          <Badge tone={STATUS_TONE[o.status]}>{STATUS[o.status]}</Badge>
          <Badge tone={PAGAMENTO_TONE[o.pagamento]}>{PAGAMENTO[o.pagamento]}</Badge>
        </>
      )}
      <Badge tone="in">{o.modalidade === 'entrega' ? 'Entrega' : 'Retirada'}</Badge>
      {isLate(o) && <Badge tone="er">Atrasada</Badge>}
    </div>
  )
}

export function OrderCard({ o }) {
  return (
    <Link to={`/pedidos/${o.id}`} className={`card order ${isFinalizada(o) ? 'done' : ''}`}>
      <div className="row">
        <span className="title row" style={{ justifyContent: 'flex-start' }}>
          {isFinalizada(o) && <span className="check"><Check size={16} strokeWidth={3} /></span>}
          {o.cliente}
        </span>
        <span className="num">{brl(o.valor_total)}</span>
      </div>
      <div className="sub">
        {fmtDate(o.data_entrega)}
        {o.horario ? ` às ${fmtTime(o.horario)}` : ''} · {o.total_unidades} picolés
      </div>
      <OrderBadges o={o} />
    </Link>
  )
}

export function Chips({ value, onChange, options }) {
  return (
    <div className="chips">
      {options.map(([v, label]) => (
        <button key={v} className={`chip ${value === v ? 'on' : ''}`} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}

export function Filters({ f, setF }) {
  return (
    <>
      <Chips value={f.status} onChange={(status) => setF({ ...f, status })}
        options={[['', 'Todas'], ['finalizada', 'Finalizada'], ...Object.entries(STATUS)]} />
      <Chips value={f.modalidade} onChange={(modalidade) => setF({ ...f, modalidade })}
        options={[['', 'Entrega e retirada'], ['entrega', 'Entrega'], ['retirada', 'Retirada']]} />
    </>
  )
}

export const applyFilters = (list, f) =>
  list.filter((o) => {
    const okStatus = !f.status || (f.status === 'finalizada' ? isFinalizada(o) : o.status === f.status)
    return okStatus && (!f.modalidade || o.modalidade === f.modalidade)
  })

export function ConfirmModal({ icon: Icon = AlertTriangle, title, detail, confirmLabel = 'Confirmar', onConfirm, onCancel, busy }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="ring"><Icon size={30} strokeWidth={2} /></div>
        <h3>{title}</h3>
        <p>{detail}</p>
        <div className="actions">
          <button onClick={onCancel} disabled={busy}>Voltar</button>
          <button onClick={onConfirm} disabled={busy}>{busy ? 'Aguarde…' : confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export function Shell() {
  const tab = (to, Icon, label, end) => (
    <NavLink to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
      <Icon size={22} strokeWidth={1.9} />
      {label}
    </NavLink>
  )
  return (
    <>
      <Outlet />
      <nav className="bar">
        {tab('/', Home, 'Início', true)}
        {tab('/agenda', CalendarDays, 'Agenda')}
        <NavLink to="/nova" className="fab" aria-label="Nova encomenda"><Plus size={28} /></NavLink>
        {tab('/pedidos', ClipboardList, 'Pedidos')}
        {tab('/perfil', User, 'Perfil')}
      </nav>
    </>
  )
}

export const SearchIcon = Search
