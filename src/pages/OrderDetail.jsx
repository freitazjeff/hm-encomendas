import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, MessageCircle, Trash2, XCircle } from 'lucide-react'
import { deleteOrder, getOrder, updateOrder } from '../lib/api'
import { useAuth } from '../lib/auth.jsx'
import { brl, fmtDate, fmtTime } from '../lib/format'
import { enviarWhatsApp, resumoEncomenda } from '../lib/whatsapp'
import { ConfirmModal, OrderBadges } from '../components.jsx'

export default function OrderDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { profile, isAdmin } = useAuth()
  const [o, setO] = useState(null)
  const [err, setErr] = useState('')
  const [modal, setModal] = useState(null) // 'cancelar' | 'excluir'
  const [busy, setBusy] = useState(false)
  const load = () => getOrder(id).then(setO).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [id])

  if (err) return <div className="page"><div className="err">{err}</div></div>
  if (!o) return <div className="page"><div className="empty">Carregando…</div></div>
  const pode = isAdmin || o.criado_por === profile.id
  const saldo = Math.max(0, o.valor_total - o.valor_pago)

  async function mudar(patch) {
    setBusy(true)
    try { await updateOrder(id, patch); setModal(null); await load() } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  async function excluir() {
    setBusy(true)
    try { await deleteOrder(id); nav('/pedidos', { replace: true }) } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="page">
      <button className="back" onClick={() => nav(-1)}><ChevronLeft size={20} /> Voltar</button>
      <h1>{o.cliente}</h1>
      <OrderBadges o={o} />

      <div className="card" style={{ marginTop: 18 }}>
        <div className="sub">Telefone</div><div className="title">{o.telefone ? <a href={`tel:${o.telefone}`} style={{ color: 'var(--pri)' }}>{o.telefone}</a> : '—'}</div>
        <div className="sub" style={{ marginTop: 12 }}>Data</div><div className="title">{fmtDate(o.data_entrega)}{o.horario ? ` às ${fmtTime(o.horario)}` : ''}</div>
        {o.modalidade === 'entrega' && (<><div className="sub" style={{ marginTop: 12 }}>Endereço</div><div className="title">{o.endereco}</div></>)}
        {o.observacoes && (<><div className="sub" style={{ marginTop: 12 }}>Observações</div><div className="title">{o.observacoes}</div></>)}
        <div className="sub" style={{ marginTop: 12 }}>Criada por</div><div className="title">{o.criador?.nome || '—'}</div>
      </div>

      <div className="card">
        <h3>Sabores</h3>
        {o.order_items.map((i) => (
          <div className="row" key={i.id} style={{ marginBottom: 8 }}><span>{i.sabor} × {i.quantidade}</span><span className="title">{brl(i.quantidade * o.preco_unitario)}</span></div>
        ))}
        <div className="totals">
          <div className="row"><span className="sub">Total de picolés</span><span className="num">{o.total_unidades}</span></div>
          <div className="row"><span className="sub">Valor total</span><span className="num">{brl(o.valor_total)}</span></div>
          <div className="row"><span className="sub">Pago</span><span className="num">{brl(o.valor_pago)}</span></div>
          <div className="row"><span className="sub">Saldo</span><span className="num">{brl(saldo)}</span></div>
        </div>
      </div>

      {/* Qualquer vendedor pode enviar o resumo, mesmo de pedidos de outros */}
      <div className="btn-row">
        <button className="btn" onClick={() => enviarWhatsApp(resumoEncomenda(o))}>
          <MessageCircle size={18} /> Enviar por WhatsApp
        </button>
      </div>

      {pode ? (
        <>
          <div className="btn-row">
            {o.status === 'agendada' && <button className="btn" onClick={() => mudar({ status: 'pronta' })}>Marcar como pronta</button>}
            {['agendada', 'pronta'].includes(o.status) && <button className="btn" onClick={() => mudar({ status: 'entregue' })}>Entregue/retirada</button>}
            {['entregue', 'cancelada'].includes(o.status) && <button className="btn" onClick={() => mudar({ status: 'agendada' })}>Reabrir</button>}
            {o.pagamento !== 'paga' && o.status !== 'cancelada' && <button className="btn" onClick={() => mudar({ pagamento: 'paga', valor_pago: o.valor_total })}>Quitar pagamento</button>}
          </div>
          <div className="btn-row">
            <button className="btn" onClick={() => nav(`/pedidos/${id}/editar`)}>Editar</button>
            {o.status !== 'cancelada' && <button className="btn danger" onClick={() => setModal('cancelar')}>Cancelar pedido</button>}
            <button className="btn danger" onClick={() => setModal('excluir')}>Excluir</button>
          </div>
        </>
      ) : <div className="info">Você pode consultar esta encomenda, mas só o criador ou o administrador pode alterá-la.</div>}

      {modal === 'cancelar' && <ConfirmModal icon={XCircle} title="Cancelar encomenda?" detail={`O pedido de ${o.cliente} ficará marcado como cancelado.`} confirmLabel="Cancelar pedido" busy={busy} onCancel={() => setModal(null)} onConfirm={() => mudar({ status: 'cancelada' })} />}
      {modal === 'excluir' && <ConfirmModal icon={Trash2} title="Excluir encomenda?" detail="Essa ação não pode ser desfeita." confirmLabel="Excluir" busy={busy} onCancel={() => setModal(null)} onConfirm={excluir} />}
    </div>
  )
}