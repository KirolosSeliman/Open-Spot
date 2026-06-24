export type RecoveredBookingMetric = {
  recoveredValueCents: number;
  commissionCents: number;
};

export type AutomationAppointmentMetric = {
  id: string;
  startsAt: string;
  status: string;
  reminderStatus: string;
  confirmationStatus: string;
};

export type AutomationAppointmentEventMetric = {
  appointmentId: string;
  eventType: string;
};

export type AutomationRecoveryOpeningMetric = {
  id: string;
  sourceAppointmentId: string | null;
};

export type AutomationRecoveryAlertMetric = {
  id: string;
  openingId: string | null;
};

export type AutomationRecoveryReplyMetric = {
  id: string;
  openingId: string;
  status: string;
};

export type AutomationRecoveredBookingMetric = {
  id: string;
  openingId: string;
  status: string;
  recoveredValueCents: number | null;
};

export function calculateDashboardMetrics({
  openingsCreated,
  openingsFilled,
  smsSent,
  responsesReceived,
  recoveredBookings,
  waitlistCustomers,
  optOuts
}: {
  openingsCreated: number;
  openingsFilled: number;
  smsSent: number;
  responsesReceived: number;
  recoveredBookings: RecoveredBookingMetric[];
  waitlistCustomers: number;
  optOuts: number;
}) {
  return {
    recoveredRevenueCents: recoveredBookings.reduce(
      (total, booking) => total + booking.recoveredValueCents,
      0
    ),
    openingsCreated,
    openingsFilled,
    responseRate: smsSent === 0 ? 0 : Math.round((responsesReceived / smsSent) * 100),
    waitlistCustomers,
    smsSent,
    optOuts,
    estimatedCommissionCents: recoveredBookings.reduce(
      (total, booking) => total + booking.commissionCents,
      0
    )
  };
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value: Date, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function isWithin(value: string, fromInclusive: Date, toExclusive: Date) {
  const date = new Date(value);
  return date >= fromInclusive && date < toExclusive;
}

function countUnique<T>(items: T[], keyFor: (item: T) => string | null) {
  return new Set(items.map(keyFor).filter((key): key is string => Boolean(key)))
    .size;
}

export function calculateAutomationOutcomeMetrics({
  now,
  appointments,
  appointmentEvents,
  recoveryOpenings,
  recoveryAlerts,
  recoveryReplies,
  recoveredBookings
}: {
  now: Date;
  appointments: AutomationAppointmentMetric[];
  appointmentEvents: AutomationAppointmentEventMetric[];
  recoveryOpenings: AutomationRecoveryOpeningMetric[];
  recoveryAlerts: AutomationRecoveryAlertMetric[];
  recoveryReplies: AutomationRecoveryReplyMetric[];
  recoveredBookings: AutomationRecoveredBookingMetric[];
}) {
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const dayAfterTomorrow = addDays(today, 2);
  const nextSevenDays = addDays(today, 7);
  const recoveryOpeningIds = new Set(recoveryOpenings.map((opening) => opening.id));
  const validatedRecoveredBookings = recoveredBookings.filter(
    (booking) =>
      recoveryOpeningIds.has(booking.openingId) &&
      (booking.status === "confirmed" || booking.status === "completed")
  );

  return {
    appointmentsToday: appointments.filter((appointment) =>
      isWithin(appointment.startsAt, today, tomorrow)
    ).length,
    appointmentsTomorrow: appointments.filter((appointment) =>
      isWithin(appointment.startsAt, tomorrow, dayAfterTomorrow)
    ).length,
    appointmentsNext7Days: appointments.filter((appointment) =>
      isWithin(appointment.startsAt, today, nextSevenDays)
    ).length,
    appointmentsConfirmed: appointments.filter(
      (appointment) => appointment.status === "confirmed"
    ).length,
    appointmentsAwaitingConfirmation: appointments.filter(
      (appointment) => appointment.confirmationStatus === "pending"
    ).length,
    appointmentsCancelledBySms: countUnique(
      appointmentEvents.filter(
        (event) => event.eventType === "appointment.sms_cancelled"
      ),
      (event) => event.appointmentId
    ),
    appointmentsNoResponse: appointments.filter(
      (appointment) => appointment.confirmationStatus === "no_response"
    ).length,
    appointmentsNoShow: appointments.filter(
      (appointment) => appointment.status === "no_show"
    ).length,
    remindersScheduled: appointments.filter(
      (appointment) => appointment.reminderStatus === "scheduled"
    ).length,
    remindersSent: appointments.filter(
      (appointment) => appointment.reminderStatus === "sent"
    ).length,
    remindersFailed: appointments.filter(
      (appointment) => appointment.reminderStatus === "failed"
    ).length,
    remindersSkipped: appointments.filter(
      (appointment) => appointment.reminderStatus === "skipped"
    ).length,
    recoveryOpeningsCreated: countUnique(
      recoveryOpenings,
      (opening) => opening.id
    ),
    recoveryAlertsSent: countUnique(recoveryAlerts, (alert) => alert.id),
    recoveryRepliesReceived: recoveryReplies.filter((reply) =>
      ["responded", "selected", "rejected"].includes(reply.status)
    ).length,
    recoveredAfterCancellationCount: validatedRecoveredBookings.length,
    recoveredAfterCancellationRevenueCents: validatedRecoveredBookings.reduce(
      (total, booking) => total + (booking.recoveredValueCents ?? 0),
      0
    )
  };
}
