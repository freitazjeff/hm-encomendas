// Função serverless da Vercel: cadastra/desativa vendedores usando a service role (somente no servidor).
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export default async function handler(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  const { data: auth } = await admin.auth.getUser(token)
  const caller = auth?.user
  if (!caller) return res.status(401).json({ error: 'Não autenticado.' })

  const { data: me } = await admin.from('profiles').select('role, ativo').eq('id', caller.id).single()
  if (!me || me.role !== 'admin' || !me.ativo) return res.status(403).json({ error: 'Apenas o administrador pode fazer isso.' })

  if (req.method === 'POST') {
    const { nome, email, senha } = req.body || {}
    if (!nome?.trim() || !email?.trim() || (senha || '').length < 6)
      return res.status(400).json({ error: 'Informe nome, e-mail e senha (mín. 6 caracteres).' })
    const { data, error } = await admin.auth.admin.createUser({ email: email.trim(), password: senha, email_confirm: true })
    if (error) return res.status(400).json({ error: error.message })
    const { error: e2 } = await admin.from('profiles').insert({ id: data.user.id, nome: nome.trim(), role: 'vendedor' })
    if (e2) { await admin.auth.admin.deleteUser(data.user.id); return res.status(400).json({ error: e2.message }) }
    return res.status(201).json({ ok: true })
  }

  if (req.method === 'PATCH') {
    const { id, ativo } = req.body || {}
    if (!id || typeof ativo !== 'boolean') return res.status(400).json({ error: 'Dados inválidos.' })
    if (id === caller.id) return res.status(400).json({ error: 'Você não pode desativar a si mesmo.' })
    const { error } = await admin.from('profiles').update({ ativo }).eq('id', id)
    if (error) return res.status(400).json({ error: error.message })
    await admin.auth.admin.updateUserById(id, { ban_duration: ativo ? 'none' : '876000h' })
    return res.status(200).json({ ok: true })
  }

  return res.status(405).json({ error: 'Método não permitido.' })
}
