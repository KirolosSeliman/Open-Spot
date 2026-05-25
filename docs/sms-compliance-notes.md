# SMS Compliance Notes

This document is not legal advice. Legal review is required before production SMS launch.

## Core Rule

2e Chance RDV must never send cancellation-recovery SMS to a customer whose current consent status is `opted_out` or `needs_consent`.

Eligible marketing/recovery sends require `opted_in`.

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
- CANCEL
- ARRET

The parser should be case-insensitive and trim whitespace. French accented variants can be added, but the system should not depend on accents to identify opt-out intent.

## Reply Handling

Positive replies for openings should support:

- YES
- OUI
- 1

Positive replies do not confirm the appointment. They create or update a booking request for merchant review.

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

## Audit Expectations

Audit events should be written for:

- Consent creation.
- Consent status changes.
- Import batch processing.
- Outbound opening offer sends.
- Inbound STOP messages.
- Manual booking validation.

Audit records should support investigation without storing unnecessary sensitive text.
