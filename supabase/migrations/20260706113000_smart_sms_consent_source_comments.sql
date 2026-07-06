-- Clarify Smart SMS consent source of truth.
-- Additive comments only; public.sms_consents remains authoritative.

comment on column public.customer_sms_preferences.sms_consent_status is
'Deprecated snapshot field. Source of truth is public.sms_consents.';

comment on column public.customer_sms_preferences.consented_at is
'Deprecated snapshot field. Source of truth is public.sms_consents.';

comment on column public.customer_sms_preferences.opted_out_at is
'Deprecated snapshot field. Source of truth is public.sms_consents.';
