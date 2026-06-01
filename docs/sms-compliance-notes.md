# SMS Compliance Notes

This document is not legal advice. Legal review is required before production SMS launch.

## Core Rule

Open Spot must never send cancellation-recovery SMS to a customer whose current consent status is `opted_out` or `needs_consent`.

Eligible marketing/recovery sends require `opted_in`.

Appointment reminders are operational/transactional in product intent, but Open
Spot should still require a conservative consent basis before sending SMS. The
system must re-check current consent at send time, not only when the reminder is
scheduled.

## Consent Sources

Allowed consent sources should be explicit and stored:

- Public QR waitlist signup with consent checkbox.
- Merchant import row with documented consent proof.
- Manual merchant entry with consent source recorded.
- Customer SMS opt-in flow, if implemented later.

Imported customers without proof must be stored as `needs_consent`.

## Required Consent Fields

Store:

- Customer or phone number.
- Organization.
- Consent status.
- Consent source.
- Consent timestamp.
- Consent copy or version.
- Preferred language if available.
- Opt-out timestamp and source when applicable.

## STOP Handling

Inbound messages that indicate opt-out must immediately update consent status to `opted_out`.

Initial keywords to support:

- STOP
- UNSUBSCRIBE
- ARRET
- ARRÊT
- DESABONNER / DÉSABONNER if implemented safely

The parser should be case-insensitive and trim whitespace. French accented variants can be added, but the system should not depend on accents to identify opt-out intent.

`CANCEL` is ambiguous. If an inbound message is clearly linked to an appointment
reminder that told the customer to reply CANCEL or NO/NON to cancel the
appointment, it may be treated as an appointment cancellation. If the context is
missing or unclear, the safer behavior is opt-out handling or manual review.

## Reply Handling

Positive replies for openings should support:

- YES
- OUI
- 1

Positive replies do not confirm the appointment. They create or update a booking request for merchant review.

Appointment reminder confirmation replies should support:

- YES
- OUI
- 1
- CONFIRM / CONFIRMER where documented

Appointment reminder cancellation replies should support:

- NO
- NON
- ANNULER
- CANCEL only when the linked reminder context makes appointment cancellation
  unambiguous.

Cancellation replies can mark the appointment cancelled and, if configured,
create a recoverable opening. They must not automatically confirm a waitlist
customer.

## Message Categories

Open Spot should distinguish consent/compliance handling by message category:

- Transactional appointment reminders and confirmation requests.
- Cancellation recovery offers sent to opted-in waitlist customers.
- Acknowledgements for confirmation, cancellation, and opt-out.
- Marketing/reactivation messages such as winback or review requests, which need
  stricter review before production.

Every category should have bilingual copy and a clear opt-out strategy before
real provider sending is enabled.

## Local Development Safety

- Default local SMS provider must be simulator-only.
- Tests must not send real SMS.
- Real provider credentials must be absent from example env files or represented only as empty placeholders.
- Any command or test that can send real SMS must require explicit configuration.

## Message Content Rules

Outbound cancellation-recovery messages should include:

- Merchant/business identity.
- Opening time or clear appointment context.
- Optional offer details if configured.
- Simple reply instruction.
- Opt-out instruction where legally required.

Avoid:

- Misleading urgency.
- Hidden fees.
- Guaranteed booking language before merchant validation.
- Sending discounts that were not configured by the merchant.

## MVP Opening Message Generation

The MVP opening creation flow does not ask merchants for a separate expiration
time. The opening start and end times remain the operational source of truth for
the customer-facing alert.

Opening SMS content is generated from structured server-side context: business
name, selected service, opening date/time, optional offer label, language, and
recipient context when available. The generator prepares preview text only in
the current phase; the outbound simulator/provider workflow is intentionally
handled later.

Real provider sending remains disabled until an explicit provider integration
phase.

## Audit Expectations

Audit events should be written for:

- Consent creation.
- Consent status changes.
- Import batch processing.
- Outbound opening offer sends.
- Inbound STOP messages.
- Manual booking validation.
- Appointment reminder scheduled/sent/skipped.
- Appointment confirmed or cancelled by inbound SMS.
- Cancellation-to-opening automation when enabled.

Audit records should support investigation without storing unnecessary sensitive text.

## Legal Review

This document is operational guidance, not legal advice. Production SMS copy,
consent language, opt-out handling, and category classification must be reviewed
for the target jurisdictions and SMS provider rules before launch.
