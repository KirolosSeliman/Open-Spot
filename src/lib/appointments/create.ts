import { shouldQueueAppointmentReminder } from "@/lib/appointments/reminders";
import type { RecurrenceInput } from "@/lib/appointments/recurrence";
import { generateRecurrenceOccurrences } from "@/lib/appointments/recurrence";
import { utcToZonedLocalString } from "@/lib/appointments/timezone";
import type { AppointmentCreateInput } from "@/lib/dashboard/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function createSingleAppointmentRecord({
  supabase,
  organizationId,
  input,
  shouldScheduleReminder,
  requestConfirmation,
  recurrenceSeriesId,
  recurrenceInstanceIndex,
  recurrenceOriginalStart
}: {
  supabase: SupabaseClient;
  organizationId: string;
  input: AppointmentCreateInput;
  shouldScheduleReminder: boolean;
  requestConfirmation: boolean;
  recurrenceSeriesId?: string | null;
  recurrenceInstanceIndex?: number | null;
  recurrenceOriginalStart?: string | null;
}) {
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      organization_id: organizationId,
      customer_id: input.customerId,
      service_id: input.serviceId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      timezone: input.timezone,
      status: "scheduled",
      reminder_status: shouldScheduleReminder ? "scheduled" : "not_scheduled",
      confirmation_status: requestConfirmation ? "pending" : "no_response",
      reminder_24h_enabled: input.sendReminder,
      confirmation_request_enabled: requestConfirmation,
      source: "manual",
      notes: input.notes,
      recurrence_series_id: recurrenceSeriesId ?? null,
      recurrence_instance_index: recurrenceInstanceIndex ?? null,
      recurrence_original_start: recurrenceOriginalStart ?? null
    })
    .select("id, starts_at")
    .single();

  if (error || !appointment) {
    throw new Error(error?.message ?? "Appointment creation failed.");
  }

  return appointment;
}

export async function createRecurringAppointments({
  supabase,
  organizationId,
  input,
  recurrence,
  reminderSettings,
  consentStatus,
  actorProfileId
}: {
  supabase: SupabaseClient;
  organizationId: string;
  input: AppointmentCreateInput;
  recurrence: RecurrenceInput;
  reminderSettings: {
    defaultReminderDelayHours: number;
    organizationRemindersEnabled: boolean;
  };
  consentStatus: string | null | undefined;
  actorProfileId: string | null;
}) {
  const generated = generateRecurrenceOccurrences({
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    timezone: input.timezone,
    recurrence
  });

  if (!generated.ok) {
    throw new Error(generated.error);
  }

  const durationMinutes = input.endsAt
    ? Math.max(
        1,
        Math.round(
          (new Date(input.endsAt).getTime() - new Date(input.startsAt).getTime()) /
            60_000
        )
      )
    : 60;

  const { data: series, error: seriesError } = await supabase
    .from("appointment_recurrence_series")
    .insert({
      organization_id: organizationId,
      customer_id: input.customerId,
      service_id: input.serviceId,
      timezone: input.timezone,
      frequency: recurrence.frequency,
      interval_count: recurrence.intervalCount,
      weekdays:
        recurrence.weekdays.length > 0
          ? recurrence.weekdays.map(String)
          : null,
      monthly_pattern: recurrence.monthlyPattern,
      end_type: recurrence.endType,
      end_after_count: recurrence.endAfterCount,
      end_date: recurrence.endDate
        ? new Date(`${recurrence.endDate}T23:59:59`).toISOString()
        : null,
      max_occurrences: generated.occurrences.length,
      starts_at_local: utcToZonedLocalString(new Date(input.startsAt), input.timezone),
      duration_minutes: durationMinutes,
      notes: input.notes,
      send_reminder: input.sendReminder,
      request_confirmation: input.requestConfirmation,
      created_by_profile_id: actorProfileId
    })
    .select("id")
    .single();

  if (seriesError || !series) {
    throw new Error(seriesError?.message ?? "Recurrence series creation failed.");
  }

  const createdIds: string[] = [];

  for (const occurrence of generated.occurrences) {
    const occurrenceInput: AppointmentCreateInput = {
      ...input,
      startsAt: occurrence.startsAt,
      endsAt: occurrence.endsAt
    };
    const shouldScheduleReminder = shouldQueueAppointmentReminder({
      appointmentStatus: "scheduled",
      consentStatus,
      organizationRemindersEnabled: reminderSettings.organizationRemindersEnabled,
      sendReminder: input.sendReminder
    });

    const appointment = await createSingleAppointmentRecord({
      supabase,
      organizationId,
      input: occurrenceInput,
      shouldScheduleReminder,
      requestConfirmation: input.requestConfirmation,
      recurrenceSeriesId: series.id,
      recurrenceInstanceIndex: occurrence.instanceIndex,
      recurrenceOriginalStart: occurrence.startsAt
    });

    createdIds.push(appointment.id);

    await supabase.from("appointment_events").insert({
      organization_id: organizationId,
      appointment_id: appointment.id,
      event_type: "appointment.created",
      metadata: {
        source: "dashboard",
        reminder_requested: input.sendReminder,
        confirmation_requested: input.requestConfirmation,
        recurrence_series_id: series.id,
        recurrence_instance_index: occurrence.instanceIndex
      }
    });

    if (shouldScheduleReminder && new Date(occurrence.startsAt) > new Date()) {
      const scheduledFor = new Date(occurrence.startsAt);
      scheduledFor.setHours(
        scheduledFor.getHours() - reminderSettings.defaultReminderDelayHours
      );

      if (!Number.isNaN(scheduledFor.getTime()) && scheduledFor > new Date()) {
        const { error } = await supabase.rpc("schedule_appointment_reminder", {
          target_organization_id: organizationId,
          target_appointment_id: appointment.id,
          target_customer_id: input.customerId,
          target_scheduled_for: scheduledFor.toISOString(),
          target_template_key: "appointment_reminder_24h"
        });

        if (error) {
          throw new Error(error.message);
        }
      }
    }
  }

  return {
    seriesId: series.id,
    createdCount: createdIds.length,
    createdIds
  };
}
