-- ============================================================
-- Fé Diária — Esquema do banco de dados (Supabase / Postgres)
-- ============================================================
-- Como usar: Supabase Dashboard -> SQL Editor -> cole este arquivo inteiro -> Run.
-- Isso cria as tabelas, ativa Row Level Security (RLS) e define quem pode
-- ler/escrever o quê. Sem RLS, qualquer pessoa com a chave pública do
-- projeto poderia ler ou editar os dados de qualquer usuário — com RLS,
-- o próprio banco impõe as regras, mesmo que o código do app tenha bugs.

-- 1) PERFIS -----------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Convidado',
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Perfis são públicos para leitura"
  on profiles for select
  using (true);

create policy "Cada pessoa só edita o próprio perfil"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Cada pessoa só atualiza o próprio perfil"
  on profiles for update
  using (auth.uid() = id);

-- Cria o perfil automaticamente no primeiro login (nome vindo do Google)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Convidado'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2) PUBLICAÇÕES DO MURAL ----------------------------------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'encorajamento',
  text text not null check (char_length(text) <= 280),
  image_url text,
  approved boolean not null default null,  -- null = aguardando moderação; true = aprovado; false = removido
  moderation_reason text,
  created_at timestamptz not null default now()
);

alter table posts enable row level security;

create policy "Qualquer um lê publicações aprovadas"
  on posts for select
  using (approved is true or user_id = auth.uid());

create policy "Usuário autenticado cria publicação"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Autor apaga a própria publicação"
  on posts for delete
  using (auth.uid() = user_id);

-- 3) CURTIDAS (tabela própria evita a corrida de "ler-alterar-salvar" de um contador solto)
create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table post_likes enable row level security;

create policy "Qualquer um vê curtidas"
  on post_likes for select
  using (true);

create policy "Usuário só curte em próprio nome"
  on post_likes for insert
  with check (auth.uid() = user_id);

create policy "Usuário só remove a própria curtida"
  on post_likes for delete
  using (auth.uid() = user_id);

-- View pronta com contagem de curtidas (evita contar no cliente)
create or replace view posts_with_likes as
  select p.*, coalesce(l.likes_count, 0) as likes_count
  from posts p
  left join (
    select post_id, count(*) as likes_count from post_likes group by post_id
  ) l on l.post_id = p.id;

-- 4) MENSAGENS PRIVADAS (aviso: privacidade real depende só destas regras — leia o guia)
create table if not exists dm_messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) <= 500),
  created_at timestamptz not null default now()
);

alter table dm_messages enable row level security;

-- Aqui a privacidade é de verdade: só remetente e destinatário conseguem ler.
create policy "Só remetente ou destinatário leem a mensagem"
  on dm_messages for select
  using (auth.uid() = from_user or auth.uid() = to_user);

create policy "Só posso enviar mensagem em meu próprio nome"
  on dm_messages for insert
  with check (auth.uid() = from_user);

-- 5) ESTADO PESSOAL (progresso, diário, favoritos, tarefas — sincroniza entre aparelhos)
create table if not exists user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table user_state enable row level security;

create policy "Cada pessoa só lê o próprio estado"
  on user_state for select
  using (auth.uid() = user_id);

create policy "Cada pessoa só grava o próprio estado"
  on user_state for insert
  with check (auth.uid() = user_id);

create policy "Cada pessoa só atualiza o próprio estado"
  on user_state for update
  using (auth.uid() = user_id);

-- 5b) LGPD — CONSENTIMENTO E DIREITOS DO TITULAR ------------------
-- Consentimento specific e destacado (Art. 11) é diferente de aceitar o Termo de Uso geral.
-- Guarda o QUE foi aceito, QUANDO, e em qual versão do texto — evidência exigida em fiscalização.
create table if not exists consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  sensitive_data_consent boolean not null default false, -- conteúdo religioso/fé = dado sensível (Art. 5º, II)
  age_bracket text not null check (age_bracket in ('under_13', '13_to_17', '18_plus')),
  guardian_consent boolean not null default false, -- exigido pelo Art. 14 se menor de 13 (ou 16, ver guia)
  created_at timestamptz not null default now()
);

alter table consent_log enable row level security;

create policy "Cada pessoa só lê o próprio histórico de consentimento"
  on consent_log for select using (auth.uid() = user_id);

create policy "Cada pessoa só grava o próprio consentimento"
  on consent_log for insert with check (auth.uid() = user_id);

-- Direito de exclusão (Art. 18, VI): apaga em cascata tudo que identifica a pessoa.
-- SECURITY DEFINER para poder remover de auth.users, que o usuário comum não acessa direto.
create or replace function delete_my_account()
returns void as $$
begin
  delete from posts where user_id = auth.uid();
  delete from post_likes where user_id = auth.uid();
  delete from dm_messages where from_user = auth.uid() or to_user = auth.uid();
  delete from user_state where user_id = auth.uid();
  delete from consent_log where user_id = auth.uid();
  delete from profiles where id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;

-- Direito de portabilidade (Art. 18, V): devolve tudo que a pessoa gerou, em um só JSON.
create or replace function export_my_data()
returns jsonb as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from profiles p where p.id = auth.uid()),
    'posts', (select coalesce(jsonb_agg(to_jsonb(po)), '[]'::jsonb) from posts po where po.user_id = auth.uid()),
    'messages_sent', (select coalesce(jsonb_agg(to_jsonb(d)), '[]'::jsonb) from dm_messages d where d.from_user = auth.uid()),
    'personal_state', (select state from user_state where user_id = auth.uid()),
    'consent_history', (select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) from consent_log c where c.user_id = auth.uid()),
    'exported_at', now()
  ) into result;
  return result;
end;
$$ language plpgsql security definer;

-- 6) STORAGE (fotos) ----------------------------------------------
-- Rode isto após criar, no painel Storage, um bucket chamado "photos" (público para leitura).
insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict (id) do nothing;

create policy "Qualquer um vê as fotos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Usuário autenticado envia fotos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Autor apaga a própria foto"
  on storage.objects for delete
  using (bucket_id = 'photos' and owner = auth.uid());

-- Índices úteis
create index if not exists idx_posts_created_at on posts (created_at desc);
create index if not exists idx_dm_between on dm_messages (from_user, to_user, created_at);
