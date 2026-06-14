const reminderEligibleStatuses = new Set(["scheduled", "confirmed"]);

export function isAppointmentReminderEligibleStatus(status: string) {
  return reminderEligibleStatuses.has(status);
}

export function shouldQueueAppointmentReminder({
  appointmentStatus,
  consentStatus,
  organizationRemindersEnabled,
  sendReminder
}: {
  appointmentStatus: string;
  consentStatus: string | null | undefined;
  organizationRemindersEnabled: boolean;
  sendReminder: boolean;
}) {
  return (
    sendReminder &&
    organizationRemindersEnabled &&
    consentStatus === "opted_in" &&
    isAppointmentReminderEligibleStatus(appointmentStatus)
  );
}
