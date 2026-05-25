# Beta Launch Checklist

## Product Flow

- [ ] Merchant can sign up with Supabase Auth.
- [ ] Merchant can create an organization.
- [ ] Owner membership is bootstrapped safely.
- [ ] Merchant can create services.
- [ ] Merchant can import CSV customers.
- [ ] Imported customers without proof stay `needs_consent`.
- [ ] Public QR waitlist stores customer, consent, waitlist entry, and audit log atomically.
- [ ] Merchant can create an opening.
- [ ] Eligible recipients exclude `needs_consent` and `opted_out`.
- [ ] Simulator send records opening offers and SMS messages.
- [ ] Inbound OUI/YES/1 ranks respondents by timestamp.
- [ ] STOP updates consent to `opted_out`.
- [ ] Manual validation fills one opening once.
- [ ] Selected customer receives confirmation.
- [ ] Other respondents receive unavailable message.
- [ ] Reports update from confirmed booking records.

## Security

- [ ] RLS verified with two test organizations.
- [ ] Owner, manager, and staff roles verified.
- [ ] Admin routes protected by platform admin auth.
- [ ] Service role key exists only on the server.
- [ ] Public waitlist endpoint rate-limited.
- [ ] SMS webhook endpoint rate-limited.
- [ ] Provider webhook signatures verified.
- [ ] Audit logs verified for sensitive actions.

## Operations

- [ ] Vercel environment variables configured.
- [ ] Supabase migrations applied in order.
- [ ] SMS simulator verified after deployment.
- [ ] Real SMS sending requires explicit approval.
- [ ] Monitoring/logging configured for API errors.
- [ ] Rollback plan documented for migrations and deployment.

## Legal and Business

- [ ] Privacy Policy reviewed by counsel.
- [ ] Terms of Service reviewed by counsel.
- [ ] SMS consent copy reviewed for Canada/Quebec use.
- [ ] Pricing and SMS usage terms finalized.
- [ ] Commission calculation terms finalized.
