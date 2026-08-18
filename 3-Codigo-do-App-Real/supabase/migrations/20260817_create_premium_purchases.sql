-- supabase/migrations/20260817_create_premium_purchases.sql
--
-- Registra compras do Premium feitas via Stripe (Payment Link).
-- Somente a Edge Function (service_role) escreve; o app consulta através
-- da função /verify — nenhum acesso direto pelo client é necessário.

create table if not exists public.premium_purchases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  stripe_session_id text not null unique,
  amount_total bigint,
  currency text default 'brl',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

alter table public.premium_purchases enable row level security;

-- Sem policies: bloqueia qualquer acesso direto (incluindo anon/authenticated).
-- A Edge Function acessa via service_role, que ignora RLS por design.