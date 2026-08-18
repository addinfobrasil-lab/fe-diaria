-- supabase/migrations/20260818_premium_subscription_lifecycle.sql
--
-- Evolui a tabela premium_purchases para o modelo de assinatura mensal:
-- adiciona campos de ciclo de vida e troca o status padrão para 'active'.

alter table public.premium_purchases
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_id text unique,
  add column if not exists current_period_end timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.premium_purchases
  alter column status set default 'active';

-- Registros antigos (pagamento único) ficam marcados como assinatura válida.
update public.premium_purchases set status = 'active' where status = 'paid';