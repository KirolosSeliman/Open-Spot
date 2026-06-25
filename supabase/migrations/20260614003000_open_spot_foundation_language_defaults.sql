-- Align new tenant defaults with Open Spot's French-first launch posture.
-- This is intentionally non-destructive: historical organization rows keep
-- their stored language until a user or migration explicitly changes them.

alter table public.organizations
  alter column default_language set default 'fr'::public.supported_language;

alter table public.organization_settings
  alter column default_language set default 'fr'::public.supported_language;
