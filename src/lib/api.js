import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'

const SELECT = '*, order_items(*), criador:profiles!criado_por(nome)'

export function useOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('orders').select(SELECT).order('data_entrega').order('horario')
    if (error) setError(error.message)
    else setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
    window.addEventListener('focus', reload)
    return () => window.removeEventListener('focus', reload)
  }, [reload])

  return { orders, loading, error, reload }
}

export async function getOrder(id) {
  const { data, error } = await supabase.from('orders').select(SELECT).eq('id', id).single()
  if (error) throw error
  return data
}

// Obs.: criar/editar pedido + itens são chamadas separadas. Para atomicidade total, migre para uma função RPC.
export async function saveOrder(payload, items, id) {
  let orderId = id
  if (id) {
    const { error } = await supabase.from('orders').update(payload).eq('id', id)
    if (error) throw error
    const { error: e2 } = await supabase.from('order_items').delete().eq('order_id', id)
    if (e2) throw e2
  } else {
    const { data, error } = await supabase.from('orders').insert(payload).select('id').single()
    if (error) throw error
    orderId = data.id
  }
  const { error } = await supabase.from('order_items').insert(items.map((i) => ({ ...i, order_id: orderId })))
  if (error) throw error
  return orderId
}

export async function updateOrder(id, patch) {
  const { error } = await supabase.from('orders').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

export async function getPrice() {
  const { data } = await supabase.from('settings').select('preco_padrao').eq('id', 1).single()
  return Number(data?.preco_padrao ?? 1)
}

export async function setPrice(v) {
  const { error } = await supabase.from('settings').update({ preco_padrao: v }).eq('id', 1)
  if (error) throw error
}

// Cadastro/desativação de vendedores passa pela função serverless (usa a service role no servidor).
export async function vendedoresApi(method, body) {
  const { data } = await supabase.auth.getSession()
  const res = await fetch('/api/vendedores', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Falha na requisição')
  return json
}
