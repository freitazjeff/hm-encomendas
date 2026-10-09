import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth.jsx'
import { Shell } from './components.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Agenda from './pages/Agenda.jsx'
import Orders from './pages/Orders.jsx'
import OrderForm from './pages/OrderForm.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import Profile from './pages/Profile.jsx'

export default function App() {
  const { session, profile, loading, signOut } = useAuth()
  if (loading) return <div className="login"><div className="sub">Carregando…</div></div>
  if (!session) return <Login />
  if (!profile || !profile.ativo)
    return (
      <div className="login"><div className="box card">
        <h1>Acesso indisponível</h1>
        <p className="sub">Seu usuário não está ativo. Fale com o administrador.</p>
        <button className="btn" onClick={signOut}>Sair</button>
      </div></div>
    )
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/" element={<Home />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/pedidos/:id" element={<OrderDetail />} />
        <Route path="/pedidos/:id/editar" element={<OrderForm />} />
        <Route path="/nova" element={<OrderForm />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
