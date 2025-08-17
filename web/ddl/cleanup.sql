-- ddl/cleanup.sql
-- remove expired or revoked remember tokens
delete from remembers
where revoked = true
   or (expires_at is not null and expires_at < now());

-- optional: remove very old local-only pending enrollments (example)
delete from enrollments where status = 'pending' and created_at < now() - interval '90 days';