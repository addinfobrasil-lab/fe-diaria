drop policy if exists "Perfis sao publicos para leitura" on profiles;
drop policy if exists "Cada pessoa so edita o proprio perfil" on profiles;
drop policy if exists "Cada pessoa so atualiza o proprio perfil" on profiles;
drop policy if exists "Qualquer um le publicacoes aprovadas" on posts;
drop policy if exists "Usuario autenticado cria publicacao" on posts;
drop policy if exists "Autor apaga a propria publicacao" on posts;
drop policy if exists "Qualquer um ve curtidas" on post_likes;
drop policy if exists "Usuario so curte em proprio nome" on post_likes;
drop policy if exists "Usuario so remove a propria curtida" on post_likes;
drop policy if exists "So remetente ou destinatario leem a mensagem" on dm_messages;
drop policy if exists "So posso enviar mensagem em meu proprio nome" on dm_messages;
drop policy if exists "Cada pessoa so le o proprio estado" on user_state;
drop policy if exists "Cada pessoa so grava o proprio estado" on user_state;
drop policy if exists "Cada pessoa so atualiza o proprio estado" on user_state;
drop policy if exists "Cada pessoa so le o proprio historico de consentimento" on consent_log;
drop policy if exists "Cada pessoa so grava o proprio consentimento" on consent_log;
drop policy if exists "Qualquer um ve as fotos" on storage.objects;
drop policy if exists "Usuario autenticado envia fotos" on storage.objects;
drop policy if exists "Autor apaga a propria foto" on storage.objects;
drop view if exists posts_with_likes;
drop trigger if exists on_auth_user_created on auth.users;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Convidado',
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "Perfis sao publicos para leitura"
  on profiles for select using (true);
create policy "Cada pessoa so edita o proprio perfil"
  on profiles for insert with check (auth.uid() = id);
create policy "Cada pessoa so atualiza o proprio perfil"
  on profiles for update using (auth.uid() = id);

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

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'encorajamento',
  text text not null check (char_length(text) <= 280),
  author_name text,
  author_avatar text,
  image_url text,
  approved boolean not null default null,
  moderation_reason text,
  created_at timestamptz not null default now()
);
alter table posts enable row level security;
create policy "Qualquer um le publicacoes aprovadas"
  on posts for select using (approved is true or user_id = auth.uid());
create policy "Usuario autenticado cria publicacao"
  on posts for insert with check (auth.uid() = user_id);
create policy "Autor apaga a propria publicacao"
  on posts for delete using (auth.uid() = user_id);

create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table post_likes enable row level security;
create policy "Qualquer um ve curtidas"
  on post_likes for select using (true);
create policy "Usuario so curte em proprio nome"
  on post_likes for insert with check (auth.uid() = user_id);
create policy "Usuario so remove a propria curtida"
  on post_likes for delete using (auth.uid() = user_id);

create or replace view posts_with_likes as
  select p.*, coalesce(l.likes_count, 0) as likes_count
  from posts p
  left join (
    select post_id, count(*) as likes_count from post_likes group by post_id
  ) l on l.post_id = p.id;

create table if not exists dm_messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) <= 500),
  created_at timestamptz not null default now()
);
alter table dm_messages enable row level security;
create policy "So remetente ou destinatario leem a mensagem"
  on dm_messages for select using (auth.uid() = from_user or auth.uid() = to_user);
create policy "So posso enviar mensagem em meu proprio nome"
  on dm_messages for insert with check (auth.uid() = from_user);

create table if not exists user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table user_state enable row level security;
create policy "Cada pessoa so le o proprio estado"
  on user_state for select using (auth.uid() = user_id);
create policy "Cada pessoa so grava o proprio estado"
  on user_state for insert with check (auth.uid() = user_id);
create policy "Cada pessoa so atualiza o proprio estado"
  on user_state for update using (auth.uid() = user_id);

create table if not exists consent_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  sensitive_data_consent boolean not null default false,
  age_bracket text not null check (age_bracket in ('under_13', '13_to_17', '18_plus')),
  guardian_consent boolean not null default false,
  created_at timestamptz not null default now()
);
alter table consent_log enable row level security;
create policy "Cada pessoa so le o proprio historico de consentimento"
  on consent_log for select using (auth.uid() = user_id);
create policy "Cada pessoa so grava o proprio consentimento"
  on consent_log for insert with check (auth.uid() = user_id);

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

insert into storage.buckets (id, name, public)
  values ('photos', 'photos', true)
  on conflict (id) do nothing;

create policy "Qualquer um ve as fotos"
  on storage.objects for select using (bucket_id = 'photos');
create policy "Usuario autenticado envia fotos"
  on storage.objects for insert with check (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "Autor apaga a propria foto"
  on storage.objects for delete using (bucket_id = 'photos' and owner = auth.uid());

create index if not exists idx_posts_created_at on posts (created_at desc);
create index if not exists idx_dm_between on dm_messages (from_user, to_user, created_at);