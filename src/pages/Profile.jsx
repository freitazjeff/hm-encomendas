import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth.jsx'
import { getPrice, setPrice, vendedoresApi } from '../lib/api'
import { Badge } from '../components.jsx'

export default function Profile() {
  const { profile, isAdmin, signOut } = useAuth()
  const [preco, setPreco] = useState('')
  const [vendedores, setVendedores] = useState([])
  const [novo, setNovo] = useState({ nome: '', email: '', senha: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const carregar = () => supabase.from('profiles').select('*').order('nome').then(({ data }) => setVendedores(data || []))
  useEffect(() => { getPrice().then((p) => setPreco(String(p))); if (isAdmin) carregar() }, [isAdmin])

  const run = async (fn, ok) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok) } catch (e) { setErr(e.message) } }

  return (
    <div className="page">
      <div className="head"><div><h1>Perfil</h1></div></div>
      <div className="card">
        <div className="row"><div><div className="title">{profile.nome}</div><div className="sub">Usuário conectado</div></div>
          <Badge tone="in">{isAdmin ? 'Administrador' : 'Vendedor'}</Badge></div>
        <div className="btn-row"><button className="btn" onClick={signOut}><LogOut size={18} /> Sair</button></div>
      </div>
      {msg && <div className="info">{msg}</div>}{err && <div className="err">{err}</div>}

      {isAdmin ? (
        <>
          <div className="card">
            <h3>Preço unitário padrão</h3>
            <input type="number" step="0.01" min="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} />
            <div className="sub" style={{ margin: '8px 0 12px' }}>Vale para novas encomendas. Pedidos antigos mantêm o preço registrado.</div>
            <button className="btn" onClick={() => run(() => setPrice(parseFloat(preco)), 'Preço atualizado.')}>Salvar preço</button>
          </div>
          <div className="card">
            <h3>Vendedores</h3>
            {vendedores.map((v) => (
              <div className="row" key={v.id} style={{ marginBottom: 10 }}>
                <div><div className="title">{v.nome}</div><Badge tone={v.ativo ? 'ok' : 'er'}>{v.ativo ? 'Ativo' : 'Desativado'}</Badge></div>
                {v.id !== profile.id && <button className="btn" onClick={() => run(async () => { await vendedoresApi('PATCH', { id: v.id, ativo: !v.ativo }); await carregar() }, v.ativo ? 'Vendedor desativado.' : 'Vendedor reativado.')}>{v.ativo ? 'Desativar' : 'Reativar'}</button>}
              </div>
            ))}
            <h3 style={{ marginTop: 20 }}>Cadastrar vendedor</h3>
            <label style={{ marginTop: 0 }}>Nome</label><input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
            <label>E-mail</label><input type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} />
            <label>Senha inicial (mín. 6 caracteres)</label><input type="text" value={novo.senha} onChange={(e) => setNovo({ ...novo, senha: e.target.value })} />
            <div style={{ height: 14 }} />
            <button className="btn-pill" onClick={() => run(async () => { await vendedoresApi('POST', novo); setNovo({ nome: '', email: '', senha: '' }); await carregar() }, 'Vendedor cadastrado.')}>Cadastrar vendedor</button>
          </div>
        </>
      ) : <div className="card sub">Somente o administrador altera o preço padrão e gerencia vendedores.</div>}
    </div>
  )
}
