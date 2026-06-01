-- Narrow public read path for the QR/waitlist signup page.
-- It returns only safe organization profile fields and active services.

create or replace function public.get_public_waitlist_signup_data(
  organization_slug text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  target_organization_name text;
  target_organization_slug text;
  active_services jsonb;
begin
  select o.id, o.name, o.slug
    into target_organization_id, target_organization_name, target_organization_slug
  from public.organizations o
  where o.slug = pg_catalog.btrim(organization_slug)
  limit 1;

  if target_organization_id is null then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'description', s.description,
        'durationMinutes', s.duration_minutes,
        'normalPriceCents', s.normal_price_cents
      )
      order by s.name
    ),
    '[]'::jsonb
  )
    into active_services
  from public.services s
  where s.organization_id = target_organization_id
    and s.active = true;

  return jsonb_build_object(
    'organization',
    jsonb_build_object(
      'id', target_organization_id,
      'name', target_organization_name,
      'slug', target_organization_slug
    ),
    'services',
    active_services
  );
end;
$$;

revoke all on function public.get_public_waitlist_signup_data(text)
  from public, anon, authenticated, service_role;
grant execute on function public.get_public_waitlist_signup_data(text)
  to anon, authenticated, service_role;
