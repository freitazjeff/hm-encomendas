# HM Encomendas

React + Vite + Supabase (banco, auth, RLS) + Vercel (hospedagem e função serverless).

## 1. Rodar localmente
```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev
```

## 2. Supabase
1. Crie um projeto em supabase.com.
2. SQL Editor → cole e rode `supabase/schema.sql`.
3. Project Settings → API: copie a URL e a `anon key` para `.env.local`.
4. Authentication → Users → *Add user* (seu e-mail e senha, marque "Auto confirm").
5. Authentication → Providers → Email: desative "Allow new users to sign up" (sem cadastro público).
6. No SQL Editor, torne-se admin:
   ```sql
   insert into public.profiles (id, nome, role)
   select id, 'Seu Nome', 'admin' from auth.users where email = 'seu@email.com';
   ```

## 3. Vercel
1. Suba o projeto no GitHub e importe na Vercel (framework: Vite).
2. Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Deploy. A rota `/api/vendedores` (cadastro/desativação de vendedores) só funciona na Vercel
   ou localmente com `npx vercel dev`.

## Segurança
- A `service_role` key só existe no servidor (Vercel). Nunca use prefixo `VITE_` nela.
- As permissões (vendedor edita/exclui só as próprias; admin tudo; preço só admin) estão no banco via RLS.
