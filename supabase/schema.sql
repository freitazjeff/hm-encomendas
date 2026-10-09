-- HM Encomendas — esquema + segurança (RLS). Rode no SQL Editor do Supabase.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  role text not null default 'vendedor' check (role in ('admin','vendedor')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  preco_padrao numeric(10,2) not null default 1.00 check (preco_padrao > 0)
);
insert into public.settings (id) values (1);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  cliente text not null check (length(trim(cliente)) > 0),
  telefone text,
  data_entrega date not null,
  horario time,
  modalidade text not null check (modalidade in ('entrega','retirada')),
  endereco text,
  observacoes text,
  status text not null default 'agendada' check (status in ('agendada','pronta','entregue','cancelada')),
  pagamento text not null default 'pendente' check (pagamento in ('pendente','parcial','paga')),
  valor_pago numeric(10,2) not null default 0 check (valor_pago >= 0),
  preco_unitario numeric(10,2) not null check (preco_unitario > 0),
  total_unidades int not null default 0,
  valor_total numeric(10,2) not null default 0,
  criado_por uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint endereco_na_entrega check (modalidade = 'retirada' or length(trim(coalesce(endereco,''))) > 0)
);
create index on public.orders (data_entrega);
create index on public.orders (criado_por);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sabor text not null check (length(trim(sabor)) > 0),
  quantidade int not null check (quantidade > 0)
);
create index on public.order_items (order_id);

-- Funções auxiliares (security definer para evitar recursão nas políticas)
create or replace function public.is_active() returns boolean
language sql security definer set search_path = public stable as
$$ select exists (select 1 from profiles where id = auth.uid() and ativo) $$;

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as
$$ select exists (select 1 from profiles where id = auth.uid() and ativo and role = 'admin') $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- profiles: cada um lê o próprio; ativos leem todos (para mostrar "criado por"); só admin altera
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.is_active());
create policy "profiles_admin_write" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- settings: ativos leem; só admin altera
create policy "settings_select" on public.settings for select using (public.is_active());
create policy "settings_admin_update" on public.settings for update
  using (public.is_admin()) with check (public.is_admin());

-- orders: todos os ativos leem; cria como si mesmo; edita/exclui só as próprias (admin: todas)
create policy "orders_select" on public.orders for select using (public.is_active());
create policy "orders_insert" on public.orders for insert
  with check (public.is_active() and criado_por = auth.uid());
create policy "orders_update" on public.orders for update
  using (public.is_active() and (criado_por = auth.uid() or public.is_admin()))
  with check (public.is_active() and (criado_por = auth.uid() or public.is_admin()));
create policy "orders_delete" on public.orders for delete
  using (public.is_active() and (criado_por = auth.uid() or public.is_admin()));

-- order_items: leitura geral; escrita só do dono do pedido (ou admin)
create policy "items_select" on public.order_items for select using (public.is_active());
create policy "items_write" on public.order_items for all
  using (public.is_active() and exists (select 1 from public.orders o where o.id = order_id and (o.criado_por = auth.uid() or public.is_admin())))
  with check (public.is_active() and exists (select 1 from public.orders o where o.id = order_id and (o.criado_por = auth.uid() or public.is_admin())));

-- PRIMEIRO ADMIN: crie o usuário em Authentication > Users e depois rode (troque e-mail e nome):
-- insert into public.profiles (id, nome, role)
--   select id, 'Seu Nome', 'admin' from auth.users where email = 'seu@email.com';
