# Product Requirements

## Product Definition

Open Spot is a bilingual SMS-first cancellation recovery platform for appointment-based local businesses. It is an independent SaaS product and is unrelated to Vistaire.

The product helps merchants fill last-minute appointment openings by contacting opted-in customers from a waitlist. Customers do not need an app. Customers interact by SMS, while merchants use a web dashboard.

The planned reminder expansion keeps that same product boundary. Open Spot may
store lightweight appointment records so it can send reminder and confirmation
SMS, but it must not become a complete calendar, booking marketplace, staff
scheduler, or replacement for the merchant's existing booking system.

Initial target sectors:

- Beauty and esthetique
- Barbers
- Salons

The MVP must work for Quebec and Canadian businesses without hardcoding a city. The product should remain adaptable for massage, detailing, clinics, and other appointment-based services later.

## Language Requirements

- User-facing UI and SMS copy must be bilingual-ready in French and English.
- Internal identifiers, database columns, variables, functions, and technical documentation use English.
- Language preference should be stored per organization and, where useful, per customer.
- SMS templates must support both French and English before real customer messaging is enabled.

## Business Model

Starting commercial model:

- Public pricing is not fixed; terms are discussed after understanding the merchant's cancellation volume, services, and workflow.
- Any recovered-booking commercial model must be agreed with the merchant before paid rollout.
- Commission is counted only after the merchant manually validates the recovered booking.
- Commission percentage and cap must be configurable later.

No billing-critical logic should depend on client-side calculations alone.

## MVP In Scope

- Merchant sign up and authentication.
- Organization workspace for each business.
- Organization members with roles.
- Services offered by the merchant.
- Customer records with phone numbers and language preferences.
- CSV/Excel customer import.
- Consent states: `needs_consent`, `opted_in`, `opted_out`.
- QR-code waitlist signup page.
- Opening creation for last-minute availability.
- Optional discount or offer text.
- SMS provider abstraction.
- SMS simulator for local development and tests.
- Real SMS provider implementation behind the same interface.
- Inbound SMS reply handling.
- Reply ranking by received timestamp, oldest first.
- Merchant dashboard showing respondents.
- Manual validation of one recovered booking by merchant.
- Confirmation SMS to the selected customer.
- Unavailable SMS to non-selected respondents where appropriate.
- STOP unsubscribe handling.
- Recovered revenue reporting.
- Simple admin view for operational support.

## Reminder Automation Expansion Scope

Planned in the appointment reminder expansion:

- Manual or imported appointment records.
- 24-hour appointment reminder SMS.
- Optional later 2-hour reminder if the scheduled message engine supports it safely.
- YES/OUI/1 appointment confirmation replies.
- NO/NON/ANNULER/CANCEL appointment cancellation replies.
- Cancellation-to-recovery flow when merchant settings explicitly allow it.
- Durable scheduled message queue with idempotent cron processing.
- Bilingual reminder, confirmation, cancellation, and recovery templates.
- Appointment event history for state changes.
- Reminder outcome reporting.

Explicitly not part of this expansion:

- Replacing Square, Fresha, Booksy, GoRendezvous, Google Calendar, or the
  merchant's existing booking workflow.
- Complex staff calendars, recurring appointment rules, or drag-and-drop schedule UI.
- Automatic confirmation of a waitlist respondent after a cancellation.
- Sending SMS to customers whose current consent is `needs_consent` or `opted_out`.

## MVP Out of Scope

- Customer mobile app.
- Merchant mobile app.
- Replacing existing booking systems.
- Automatic booking platform integrations.
- Complex staff scheduling.
- Full CRM.
- Fully implemented AI-assisted targeting. AI is a planned product direction,
  but the current workflow must stay honest: service preferences, consent, and
  manual validation remain the live decision path until AI is actually built.
- Advanced billing automation.
- Automatic booking confirmation without merchant validation.
- Sending SMS to imported customers who have not given explicit consent.

## Core Product Rules

1. Customers never need to install an app.
2. Customers interact by SMS.
3. Merchants manage openings and replies through a web dashboard.
4. Businesses keep their existing appointment systems.
5. Last-minute offers or discounts are optional.
6. The first reply is not automatically confirmed.
7. Respondents are ordered from first reply to last reply.
8. A recovered booking exists only after merchant validation.
9. Opted-out customers must never receive cancellation-recovery SMS.
10. Imported customers without clear consent start as `needs_consent`.
11. STOP, ARRET, UNSUBSCRIBE, and equivalent opt-out replies must be processed immediately.
12. Sensitive actions must be auditable.
13. Appointment reminders must re-check current consent at send time.
14. Appointment cancellation replies can create recoverable openings only when
    configured by the merchant.
15. A recovered waitlist client is never confirmed automatically.

## Primary User Flows

### Customer Waitlist Signup

```text
Customer scans QR code
-> Public waitlist page opens for one organization
-> Customer enters name, phone, preferred language, optional service preferences
-> Customer accepts SMS consent text
-> System stores customer and consent record
-> Customer becomes eligible for relevant openings
```

### CSV/Excel Import

```text
Merchant uploads customer file
-> System validates columns and phone format
-> System creates an import batch
-> Rows with explicit consent proof may become opted_in
-> Rows without proof become needs_consent
-> Invalid rows are reported without silently discarding data
```

### Opening Creation

```text
Merchant creates opening
-> Selects service, date/time, capacity, optional offer
-> System identifies eligible opted-in waitlist customers
-> Merchant reviews audience estimate
-> System prepares the audience and message for a later send phase
```

### Reply and Validation

```text
Customer replies YES / OUI / 1
-> Inbound webhook records message
-> System links reply to opening offer
-> Dashboard shows respondents by received timestamp
-> Merchant manually validates one customer
-> Selected customer receives confirmation
-> Other respondents receive unavailable message when configured
-> Recovered revenue and commission estimate are recorded
```

### Appointment Reminder and Cancellation

```text
Merchant creates or imports appointment
-> System schedules a 24-hour reminder if enabled
-> Cron processor claims due message idempotently
-> System re-checks appointment status and current consent
-> Customer replies YES/OUI to confirm or NO/NON/ANNULER/CANCEL to cancel
-> System records the inbound message and appointment event
-> Optional configured cancellation-to-opening workflow creates a recoverable opening
-> Waitlist recovery still requires manual merchant validation
```

### Opt-Out

```text
Customer replies STOP / ARRET / UNSUBSCRIBE
-> System records inbound message
-> Consent status changes to opted_out
-> Customer is excluded from all future cancellation-recovery SMS
-> Audit log records source and timestamp
```

## Open Questions

- Which first SMS provider should be configured for production: Plivo, Twilio, or Telnyx?
- Should commission be based on gross recovered revenue, net after discount, or a configured service price?
- Which merchant roles are required at launch: owner, admin, staff, support?
- Should unavailable SMS messages be automatic after validation or merchant-controlled?
- What exact French legal consent copy should be reviewed before beta?
