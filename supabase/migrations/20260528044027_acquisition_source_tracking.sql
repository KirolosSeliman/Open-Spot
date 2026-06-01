-- Acquisition source tracking for client/waitlist growth channels.
-- Additive and non-destructive: existing rows become manual unless future
-- forward migrations choose a more precise backfill.

alter table public.customers
  add column if not exists source text not null default 'manual';

alter table public.waitlist_entries
  add column if not exists source text not null default 'manual';

alter table public.customers
  drop constraint if exists customers_source_allowed;

alter table public.customers
  add constraint customers_source_allowed
  check (
    source in (
      'manual',
      'excel_import',
      'csv_import',
      'qr_code',
      'public_link',
      'kiosk',
      'copy_paste',
      'future_external_import'
    )
  );

alter table public.waitlist_entries
  drop constraint if exists waitlist_entries_source_allowed;

alter table public.waitlist_entries
  add constraint waitlist_entries_source_allowed
  check (
    source in (
      'manual',
      'excel_import',
      'csv_import',
      'qr_code',
      'public_link',
      'kiosk',
      'copy_paste',
      'future_external_import'
    )
  );

create index if not exists customers_org_source_idx
  on public.customers(organization_id, source);

create index if not exists waitlist_entries_org_source_idx
  on public.waitlist_entries(organization_id, source);
