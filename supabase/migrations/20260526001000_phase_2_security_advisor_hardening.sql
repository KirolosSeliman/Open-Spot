-- Phase 2 blocker hardening: fix Supabase Security Advisor warnings.
-- This migration only tightens function safety. It does not change table RLS
-- policies, table grants, or application behavior.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, private, public
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- public.rls_auto_enable() is not part of the tracked schema or application.
-- If it exists in the live project from earlier manual SQL, it must not be
-- callable through exposed API roles.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
