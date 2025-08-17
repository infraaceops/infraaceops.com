-- enable pgcrypto (for gen_random_uuid() and digest)
create extension if not exists pgcrypto;

-- remembers table (stores token hashes only)
create table if not exists remembers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- Supabase auth uid
  token_hash text not null, -- hex-encoded sha256 digest of token
  device_info text,
  ip text,
  created_at timestamptz default now(),
  expires_at timestamptz,
  revoked boolean default false
);

create index if not exists remembers_user_idx on remembers(user_id);
create index if not exists remembers_hash_idx on remembers(token_hash);

-- Enable RLS
alter table remembers enable row level security;
create policy profiles_select_owner on public.profiles
  for select using (user_id = auth.uid()::text);

create policy profiles_insert_owner on public.profiles
  for insert with check (user_id = auth.uid()::text);

create policy profiles_update_owner on public.profiles
  for update using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);

create policy remembers_select_owner on remembers
  for select using (user_id = auth.uid()::text);

create policy remembers_insert_owner on remembers
  for insert with check (user_id = auth.uid()::text);

create policy remembers_delete_owner on remembers
  for delete using (user_id = auth.uid()::text);

create policy remembers_update_owner on remembers
  for update using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Admins table (identify admins by email for simplicity)
create table if not exists admins (
  email text primary key,
  added_at timestamptz default now()
);

-- Example admin row (change to your admin email before running if desired)
-- Replace 'admin@infraaceops.com' with the real admin email you will sign in with.
insert into admins (email) values ('shahshadab1680@gmail.com') on conflict do nothing;

-- Insert a new remember token (example). Replace <UID> and <TOKEN_VALUE> when using.
-- Prefer: compute digest('<TOKEN_VALUE>','sha256') on backend and send hex string to DB.
insert into remembers (user_id, token_hash, device_info, ip, expires_at)
values (
  'shadab',
  encode(digest('<TOKEN_VALUE>', 'sha256'), 'hex'),
  'Chrome on Windows 11',
  '203.0.113.5',
  now() + interval '30 days'
);

-- Verify token when user returns (backend computes sha256 and compares):
select * from remembers
where token_hash = encode(digest('<TOKEN_VALUE>', 'sha256'), 'hex')
  and revoked = false
  and (expires_at is null or expires_at > now());

-- Revoke a token (admin or owner)
update remembers set revoked = true where id = '<REMEMBER_ID>';

-- Cleanup expired or revoked tokens (periodic job)
delete from remembers where expires_at < now() or revoked = true;