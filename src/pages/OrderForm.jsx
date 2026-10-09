import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import { getOrder, getPrice, saveOrder } from '../lib/api'
import { SABORES } from '../lib/sabores'
import { useAuth } from '../lib/auth.jsx'
import { brl, todayISO, fmtTime } from '../lib/format'
import { PAGAMENTO } from '../lib/format'

const vazio = { cliente: '', telefone: '', data_entrega: todayISO(), horario: '', modalidade: 'entrega', endereco: '', observacoes: '', pagamento: 'pendente', valor_pago: '' }

export default function OrderForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const { profile, isAdmin } = useAuth()
  const [f, setF] = useState(vazio)
  const [itens, setItens] = useState([{ sabor: '', quantidade: '' }])
  const [preco, setPreco] = useState(1)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => {
    if (!id) { getPrice().then(setPreco); return }
    getOrder(id).then((o) => {
      setBloqueado(!(isAdmin || o.criado_por === profile.id))
      setPreco(Number(o.preco_unitario)) // mantém o preço aplicado na criação
      setF({ cliente: o.cliente, telefone: o.telefone || '', data_entrega: o.data_entrega, horario: fmtTime(o.horario), modalidade: o.modalidade,
        endereco: o.endereco || '', observacoes: o.observacoes || '', pagamento: o.pagamento, valor_pago: o.valor_pago || '' })
      setItens(o.order_items.map((i) => ({ sabor: i.sabor, quantidade: i.quantidade })))
    }).catch((e) => setErr(e.message))
  }, [id])

  const limpos = itens.map((i) => ({ sabor: i.sabor.trim(), quantidade: parseInt(i.quantidade) || 0 })).filter((i) => i.sabor && i.quantidade > 0)
  const unidades = itens.reduce((s, i) => s + (parseInt(i.quantidade) || 0), 0)
  const total = unidades * preco
  const pago = f.pagamento === 'paga' ? total : f.pagamento === 'pendente' ? 0 : Math.min(Number(f.valor_pago) || 0, total)

  const setItem = (idx, k, v) => setItens(itens.map((it, i) => (i === idx ? { ...it, [k]: v } : it)))

  async function salvar() {
    setErr('')
    if (!f.cliente.trim()) return setErr('Informe o nome do cliente.')
    if (!limpos.length) return setErr('Adicione ao menos um sabor com quantidade.')
    if (!f.data_entrega) return setErr('Informe a data de entrega ou retirada.')
    if (f.modalidade === 'entrega' && !f.endereco.trim()) return setErr('Informe o endereço da entrega.')
    if (f.pagamento === 'parcial' && !(pago > 0)) return setErr('Informe o valor já pago.')
    const u = limpos.reduce((s, i) => s + i.quantidade, 0)
    const payload = {
      cliente: f.cliente.trim(), telefone: f.telefone.trim() || null, data_entrega: f.data_entrega, horario: f.horario || null,
      modalidade: f.modalidade, endereco: f.modalidade === 'entrega' ? f.endereco.trim() : null, observacoes: f.observacoes.trim() || null,
      pagamento: f.pagamento, valor_pago: pago, preco_unitario: preco, total_unidades: u, valor_total: u * preco,
    }
    setBusy(true)
    try { nav(`/pedidos/${await saveOrder(payload, limpos, id)}`, { replace: true }) }
    catch (e) { setErr('Não foi possível salvar: ' + e.message); setBusy(false) }
  }

  return (
    <div className="page">
      <button className="back" onClick={() => nav(-1)}><ChevronLeft size={20} /> Voltar</button>
      <h1>{id ? 'Editar encomenda' : 'Nova encomenda'}</h1>
      {bloqueado && <div className="err">Você só pode editar as encomendas que criou.</div>}

      <div className="card" style={{ marginTop: 18 }}>
        <h3>Cliente</h3>
        <label style={{ marginTop: 0 }}>Nome *</label><input value={f.cliente} onChange={set('cliente')} />
        <label>Telefone</label><input inputMode="tel" value={f.telefone} onChange={set('telefone')} />
      </div>

      <div className="card">
        <h3>Sabores e quantidades</h3>
        {itens.map((it, i) => (
          <div className="items" key={i}>
            <select value={it.sabor} onChange={(e) => setItem(i, 'sabor', e.target.value)}>
              <option value="">Selecione o sabor</option>
              {/* sabor antigo (digitado livremente) continua aparecendo ao editar pedidos antigos */}
              {it.sabor && !SABORES.includes(it.sabor) && <option value={it.sabor}>{it.sabor}</option>}
              {SABORES.map((s) => (
                <option key={s} value={s} disabled={itens.some((x, xi) => xi !== i && x.sabor === s)}>{s}</option>
              ))}
            </select>
            <input placeholder="Qtd" type="number" inputMode="numeric" min="1" value={it.quantidade} onChange={(e) => setItem(i, 'quantidade', e.target.value)} />
            <button className="icon-btn" aria-label="Remover" disabled={itens.length === 1} onClick={() => setItens(itens.filter((_, x) => x !== i))}><X size={18} /></button>
          </div>
        ))}
        <button className="btn" onClick={() => setItens([...itens, { sabor: '', quantidade: '' }])}><Plus size={18} /> Adicionar outro sabor</button>
        <div className="totals">
          <div className="row"><span className="sub">Total de picolés</span><span className="num">{unidades} {unidades === 1 ? 'unidade' : 'unidades'}</span></div>
          <div className="row"><span className="sub">Valor total ({brl(preco)} por unidade)</span><span className="num">{brl(total)}</span></div>
        </div>
      </div>

      <div className="card">
        <h3>Entrega ou retirada</h3>
        <div className="grid2">
          <div><label style={{ marginTop: 0 }}>Data *</label><input type="date" value={f.data_entrega} onChange={set('data_entrega')} /></div>
          <div><label style={{ marginTop: 0 }}>Horário</label><input type="time" value={f.horario} onChange={set('horario')} /></div>
        </div>
        <label>Modalidade</label>
        <select value={f.modalidade} onChange={set('modalidade')}><option value="entrega">Entrega</option><option value="retirada">Retirada</option></select>
        {f.modalidade === 'entrega' && (<><label>Endereço *</label><input value={f.endereco} onChange={set('endereco')} /></>)}
        <label>Observações</label><textarea rows={2} value={f.observacoes} onChange={set('observacoes')} />
      </div>

      <div className="card">
        <h3>Pagamento</h3>
        <select value={f.pagamento} onChange={set('pagamento')}>{Object.entries(PAGAMENTO).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        {f.pagamento === 'parcial' && (<><label>Valor já pago (R$)</label><input type="number" step="0.01" min="0" value={f.valor_pago} onChange={set('valor_pago')} /></>)}
        <div className="totals"><div className="row"><span className="sub">Saldo restante</span><span className="num">{brl(total - pago)}</span></div></div>
      </div>

      {err && <div className="err">{err}</div>}
      <button className="btn-pill" onClick={salvar} disabled={busy || bloqueado}>{busy ? 'Salvando…' : 'Salvar encomenda'}</button>
    </div>
  )
}
