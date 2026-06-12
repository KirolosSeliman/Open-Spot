-- Platform Admin Dashboard access control.
-- Bootstrap manually after deployment:
-- insert into public.platform_admins (user_id, role, active)
-- values ('YOUR_SUPABASE_AUTH_USER_ID', 'platform_owner', true);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('platform_owner', 'support', 'readonly')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  notes text
);

create index if not exists platform_admins_active_idx
on public.platform_admins (active);

alter table public.platform_admins enable row level security;

revoke all privileges on table public.platform_admins from anon;
revoke all privileges on table public.platform_admins from public;
grant select on table public.platform_admins to authenticated;

drop policy if exists "platform admins can read their own admin row"
on public.platform_admins;

create policy "platform admins can read their own admin row"
on public.platform_admins
for select
to authenticated
using (auth.uid() = user_id);
