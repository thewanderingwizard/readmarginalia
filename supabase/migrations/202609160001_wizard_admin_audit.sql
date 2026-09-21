begin;

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text check (actor_email is null or char_length(actor_email) <= 320),
  action text not null check (char_length(action) between 1 and 100),
  target_email text check (target_email is null or char_length(target_email) <= 320),
  outcome text not null check (outcome in ('succeeded', 'failed', 'rate_limited')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_created_at
  on public.admin_audit_log (created_at desc);

create index admin_audit_log_actor
  on public.admin_audit_log (actor_id, created_at desc);

alter table public.admin_audit_log enable row level security;

-- This record is intentionally inaccessible to browser clients. Owner-only
-- server actions read and write it with the server-side Supabase secret key.
revoke all on public.admin_audit_log from anon, authenticated;

commit;
