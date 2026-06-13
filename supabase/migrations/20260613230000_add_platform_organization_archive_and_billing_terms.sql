-- Admin-only archive metadata and internal billing terms.
-- Archive is only an admin list visibility flag. It does not disable merchants,
-- block SMS, or delete any organization data.

alter table public.platform_organization_admin_controls
add column if not exists archived_at timestamptz,
add column if not exists archived_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
add column if not exists archived_reason text,
add column if not exists unarchived_at timestamptz,
add column if not exists unarchived_by_platform_admin_id uuid references public.platform_admins(id) on delete set null;

create index if not exists platform_org_admin_controls_archived_idx
on public.platform_organization_admin_controls (archived_at);

create index if not exists platform_org_admin_controls_archived_active_idx
on public.platform_organization_admin_controls (organization_id)
where archived_at is null;

create table if not exists public.platform_organization_billing_terms (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  currency text not null default 'CAD',
  monthly_subscription_cents integer not null default 0,
  filled_spot_fee_mode text not null default 'none',
  filled_spot_fixed_fee_cents integer not null default 0,
  filled_spot_percentage_bps integer not null default 0,
  notes text,
  updated_by_platform_admin_id uuid references public.platform_admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_org_billing_terms_currency_check check (
    char_length(currency) = 3
  ),
  constraint platform_org_billing_terms_monthly_subscription_check check (
    monthly_subscription_cents >= 0
  ),
  constraint platform_org_billing_terms_fixed_fee_check check (
    filled_spot_fixed_fee_cents >= 0
  ),
  constraint platform_org_billing_terms_percentage_check check (
    filled_spot_percentage_bps >= 0 and filled_spot_percentage_bps <= 10000
  ),
  constraint platform_org_billing_terms_mode_check check (
    filled_spot_fee_mode in ('none', 'fixed', 'percentage', 'fixed_plus_percentage')
  )
);

create index if not exists platform_org_billing_terms_updated_idx
on public.platform_organization_billing_terms (updated_at desc);

alter table public.platform_organization_billing_terms enable row level security;

revoke all privileges on table public.platform_organization_billing_terms from anon;
revoke all privileges on table public.platform_organization_billing_terms from authenticated;
revoke all privileges on table public.platform_organization_billing_terms from public;

drop trigger if exists set_platform_organization_billing_terms_updated_at
on public.platform_organization_billing_terms;

create trigger set_platform_organization_billing_terms_updated_at
before update on public.platform_organization_billing_terms
for each row
execute function public.set_platform_admin_updated_at();
