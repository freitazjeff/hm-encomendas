import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [ver, setVer] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const nav = useNavigate()

  async function entrar(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErr('E-mail ou senha incorretos.')
    else nav('/', { replace: true }) // após entrar, sempre começa pelo Início
    setBusy(false)
  }

  return (
    <div className="login">
      <form className="box" onSubmit={entrar}>
        <img src="/logo.png" alt="HM Picolés" className="logo-login" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <h1>HM Encomendas</h1>
        <p className="sub">Acesso restrito à equipe HM Picolés.</p>
        <label>E-mail</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <label>Senha</label>
        <div className="pw">
          <input type={ver ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
          <button type="button" onClick={() => setVer(!ver)} aria-label="Mostrar ou ocultar senha">{ver ? <EyeOff size={20} /> : <Eye size={20} />}</button>
        </div>
        {err && <div className="err">{err}</div>}
        <div style={{ height: 18 }} />
        <button className="btn-pill" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  )
}
