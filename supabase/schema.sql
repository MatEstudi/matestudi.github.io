-- =====================================================================
-- MatEstudi - Supabase Schema (Idempotent: safe to re-run)
-- =====================================================================

-- 1. CHAT
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  uid uuid not null references auth.users(id) on delete cascade,
  nick text not null
    check (
      char_length(nick) between 3 and 20
      and nick ~ '^[A-Za-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ]+( [A-Za-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ]+)*$'
    ),
  k text not null check (k ~ '^[a-z0-9]{3,20}$'),
  color text not null check (char_length(color) <= 7),
  text text not null check (char_length(text) between 1 and 300),
  ts timestamptz not null default now()
);
create index if not exists idx_chat_ts on public.chat_messages (ts desc);

-- 2. PROFILES (public community stats + latest presence state)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default ''
    check (
      char_length(nickname) <= 20
      and (
        nickname = ''
        or (
          char_length(nickname) >= 3
          and nickname ~ '^[A-Za-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ]+( [A-Za-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ]+)*$'
        )
      )
    ),
  avatar_color text not null default '#6366f1'
    check (char_length(avatar_color) <= 7),
  total_seconds bigint not null default 0 check (total_seconds >= 0),
  today_seconds integer not null default 0 check (today_seconds >= 0 and today_seconds <= 86400),
  today_date_key text not null default '' check (char_length(today_date_key) <= 10),
  weekly_seconds integer not null default 0 check (weekly_seconds >= 0 and weekly_seconds <= 604800),
  week_start_key text not null default '' check (char_length(week_start_key) <= 10),
  streak integer not null default 0 check (streak >= 0 and streak <= 36500),
  streak_end text not null default '' check (char_length(streak_end) <= 10),
  best_streak integer not null default 0 check (best_streak >= 0 and best_streak <= 36500),
  ww jsonb not null default '[]'::jsonb
    check (jsonb_typeof(ww) = 'array' and octet_length(ww::text) < 20000),
  esta_verificado boolean not null default false,
  online boolean not null default false,
  active text check (active is null or char_length(active) <= 30),
  since timestamptz,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_updated_at on public.profiles (updated_at desc);
create index if not exists idx_profiles_last_seen on public.profiles (last_seen);

-- 3. NICKS (case/accent/space-insensitive unique reservations)
create table if not exists public.nicks (
  key text primary key check (key ~ '^[a-z0-9]{3,20}$'),
  uid uuid not null unique references auth.users(id) on delete cascade,
  nick text not null
    check (
      char_length(nick) between 3 and 20
      and nick ~ '^[A-Za-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ]+( [A-Za-z0-9ÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝàáâãäåçèéêëìíîïñòóôõöùúûüýÿ]+)*$'
    ),
  ts timestamptz not null default now()
);

create index if not exists idx_nicks_ts on public.nicks (ts);

-- 4. PROGRESS (private cloud backup per user, < 500 KB)
create table if not exists public.progress (
  uid uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb
    check (jsonb_typeof(data) = 'object' and octet_length(data::text) < 500000),
  rev integer not null default 0 check (rev >= 0),
  updated_at timestamptz not null default now()
);

-- 5. PROTECTION TRIGGERS (lock esta_verificado and rev from client API)
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.esta_verificado := false;
    elsif new.esta_verificado is distinct from old.esta_verificado then
      raise exception 'Forbidden: esta_verificado cannot be changed by user';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_fields on public.profiles;
create trigger trg_protect_profile_fields
before insert or update on public.profiles
for each row execute function public.protect_profile_fields();

create or replace function public.protect_progress_rev()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.rev := 0;
    elsif new.rev is distinct from old.rev then
      raise exception 'Forbidden: rev cannot be changed by user';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_progress_rev on public.progress;
create trigger trg_protect_progress_rev
before insert or update on public.progress
for each row execute function public.protect_progress_rev();

-- 6. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.nicks enable row level security;
alter table public.progress enable row level security;
alter table public.chat_messages enable row level security;

-- Profiles: any signed-in user (incl. anon) can read; only owner can write
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

-- Nicks: signed-in users can read; non-anon users can claim or reclaim (>30d)
drop policy if exists nicks_select on public.nicks;
create policy nicks_select on public.nicks
  for select to authenticated
  using (true);

drop policy if exists nicks_insert on public.nicks;
create policy nicks_insert on public.nicks
  for insert to authenticated
  with check (
    auth.uid() = uid
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  );

drop policy if exists nicks_update on public.nicks;
create policy nicks_update on public.nicks
  for update to authenticated
  using (
    (auth.uid() = uid or ts < now() - interval '30 days')
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  )
  with check (
    auth.uid() = uid
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
  );

drop policy if exists nicks_delete on public.nicks;
create policy nicks_delete on public.nicks
  for delete to authenticated
  using (auth.uid() = uid);

-- Progress: strictly private to owner
drop policy if exists progress_select on public.progress;
create policy progress_select on public.progress
  for select to authenticated
  using (auth.uid() = uid);

drop policy if exists progress_insert on public.progress;
create policy progress_insert on public.progress
  for insert to authenticated
  with check (auth.uid() = uid);

drop policy if exists progress_update on public.progress;
create policy progress_update on public.progress
  for update to authenticated
  using (auth.uid() = uid)
  with check (auth.uid() = uid);

drop policy if exists progress_delete on public.progress;
create policy progress_delete on public.progress
  for delete to authenticated
  using (auth.uid() = uid);

-- Chat
drop policy if exists chat_select on public.chat_messages;
create policy chat_select on public.chat_messages
  for select to authenticated
  using (true);

drop policy if exists chat_insert on public.chat_messages;
create policy chat_insert on public.chat_messages
  for insert to authenticated
  with check (
    uid = auth.uid()
    and coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
    and exists (
      select 1 from public.nicks n
      where n.key = chat_messages.k and n.uid = auth.uid() and n.nick = chat_messages.nick
    )
  );

drop policy if exists chat_delete on public.chat_messages;
create policy chat_delete on public.chat_messages
  for delete to authenticated
  using (uid = auth.uid() or ts < now() - interval '7 days');

-- 7. GRANTS
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.nicks, public.progress, public.chat_messages
  to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- 8. REALTIME para el chat
do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception when duplicate_object then null;
end $$;

-- 9. Limpieza diaria ampliada
create or replace function public.cleanup_stale_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set online = false, active = null, since = null
   where online = true and last_seen < now() - interval '12 hours';

  delete from public.nicks where ts < now() - interval '30 days';
  delete from public.chat_messages where ts < now() - interval '7 days';
end;
$$;

-- 10. CRON diario
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('mathstudy_daily_cleanup');
exception when others then
  null;
end $$;

select cron.schedule(
  'mathstudy_daily_cleanup',
  '15 4 * * *',
  'select public.cleanup_stale_data();'
);

-- 11. PING
create or replace function public.ping()
returns integer
language sql
stable
as $$ select 1; $$;

revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;


-- 12. MISSIONS (las crea/edita admin.html con la clave service_role, que se salta RLS: no hay políticas de escritura para clientes)
create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  subject text not null default 'otros',
  title text not null check (char_length(title) between 1 and 120),
  items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 60),   -- ["1","2","6a"]; vacío = misión de un solo paso
  deadline date,
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.missions enable row level security;
drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions for select to authenticated using (active);
grant select on public.missions to authenticated;

-- Resumen público de misiones por perfil: {n: tareas hechas, m: misiones completas, w: {semana: tareas}}
alter table public.profiles add column if not exists ms jsonb not null default '{}'::jsonb
  check (jsonb_typeof(ms) = 'object' and octet_length(ms::text) < 2000);

alter table public.profiles add column if not exists gs jsonb
  check (gs is null or (jsonb_typeof(gs) = 'object' and octet_length(gs::text) < 20000));

-- 13. ADMIN (usado por admin.html). Sin claves secretas en el navegador: funciones SECURITY DEFINER protegidas por una clave de admin
--     cuyo hash vive en admin_secret (tabla sin políticas = ilegible para los clientes). Pon tu clave (larga y aleatoria, 40+ caracteres) UNA vez en el SQL Editor:
--       delete from public.admin_secret; insert into public.admin_secret(h) values (encode(extensions.digest('TU_CLAVE_LARGA','sha256'),'hex'));
--     y pégala en la constante ADMIN_KEY de admin.html. Sin esa clave todas las funciones fallan.
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.admin_secret (h text not null);
alter table public.admin_secret enable row level security;
revoke all on public.admin_secret from anon, authenticated;

create or replace function public._adm(k text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if k is null or not exists (select 1 from public.admin_secret where h = encode(extensions.digest(k, 'sha256'), 'hex')) then
    perform pg_sleep(1.5);
    raise exception 'forbidden';
  end if;
end $$;
revoke all on function public._adm(text) from public, anon, authenticated;

create or replace function public.admin_users(k text)
returns table (id uuid, nickname text, total_seconds bigint, last_seen timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._adm(k);
  return query select p.id, p.nickname, p.total_seconds, p.last_seen from public.profiles p order by p.last_seen desc limit 1000;
end $$;

create or replace function public.admin_progress(k text, p_uid uuid) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r jsonb;
begin
  perform public._adm(k);
  select jsonb_build_object('data', g.data, 'rev', g.rev) into r from public.progress g where g.uid = p_uid;
  return r;
end $$;

/* Guarda el progreso con rev + 1 (la app del usuario sustituye lo local por esto) y actualiza las cifras públicas del perfil */
create or replace function public.admin_set_progress(k text, p_uid uuid, p_data jsonb, p_total bigint, p_today int, p_tkey text, p_weekly int, p_wkey text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._adm(k);
  insert into public.progress (uid, data, rev) values (p_uid, p_data, 1)
    on conflict (uid) do update set data = excluded.data, rev = public.progress.rev + 1, updated_at = now();
  update public.profiles set total_seconds = p_total, today_seconds = p_today, today_date_key = p_tkey, weekly_seconds = p_weekly, week_start_key = p_wkey where id = p_uid;
end $$;

create or replace function public.admin_delete_user(k text, p_uid uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._adm(k);
  delete from auth.users where id = p_uid;   -- cascada: profiles, nicks, progress, chat_messages
end $$;

create or replace function public.admin_missions(k text) returns setof public.missions
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._adm(k);
  return query select * from public.missions order by created_at desc;
end $$;

create or replace function public.admin_mission_save(k text, p_id uuid, p_title text, p_subject text, p_items jsonb, p_deadline date) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  perform public._adm(k);
  if p_id is null then insert into public.missions (title, subject, items, deadline) values (p_title, p_subject, p_items, p_deadline);
  else update public.missions set title = p_title, subject = p_subject, items = p_items, deadline = p_deadline where id = p_id; end if;
end $$;

create or replace function public.admin_mission_active(k text, p_id uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin perform public._adm(k); update public.missions set active = p_on where id = p_id; end $$;

create or replace function public.admin_mission_delete(k text, p_id uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin perform public._adm(k); delete from public.missions where id = p_id; end $$;

revoke all on function public.admin_users(text), public.admin_progress(text,uuid), public.admin_set_progress(text,uuid,jsonb,bigint,int,text,int,text),
  public.admin_delete_user(text,uuid), public.admin_missions(text), public.admin_mission_save(text,uuid,text,text,jsonb,date),
  public.admin_mission_active(text,uuid,boolean), public.admin_mission_delete(text,uuid) from public;
grant execute on function public.admin_users(text), public.admin_progress(text,uuid), public.admin_set_progress(text,uuid,jsonb,bigint,int,text,int,text),
  public.admin_delete_user(text,uuid), public.admin_missions(text), public.admin_mission_save(text,uuid,text,text,jsonb,date),
  public.admin_mission_active(text,uuid,boolean), public.admin_mission_delete(text,uuid) to anon, authenticated;

-- Run to set up the admin key for admin.html --
-- delete from public.admin_secret;
-- insert into public.admin_secret(h) values (encode(extensions.digest('LONG_ADMIN_KEY','sha256'),'hex'));
