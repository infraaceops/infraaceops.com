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

-- Owners can select their own remember rows
create policy remembers_select_owner on remembers
  for select using (user_id = auth.uid());

-- Owners can insert rows where user_id = auth.uid()
create policy remembers_insert_owner on remembers
  for insert with check (user_id = auth.uid());

-- Owners can delete their own rows
create policy remembers_delete_owner on remembers
  for delete using (user_id = auth.uid());

-- Owners can update their own rows (e.g. to revoke their tokens)
create policy remembers_update_owner on remembers
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admin update policy: users listed in `admins` table can update (revoke/reserve)
-- (Assumes you have an `admins` table with user_id text primary key)
create policy remembers_admin_update on remembers
  for update using (exists (select 1 from admins where admins.user_id = auth.uid()))
  with check (exists (select 1 from admins where admins.user_id = auth.uid()));

-- Insert a new remember token (replace <UID> and <TOKEN_VALUE> with actuals).
-- Prefer: compute digest('<TOKEN_VALUE>','sha256') on backend and send hex string to DB.
insert into remembers (user_id, token_hash, device_info, ip, expires_at)
values (
  '<UID>',
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