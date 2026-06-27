"use client";

import { useMemo, useState } from "react";

import {
  MAX_RECURRENCE_OCCURRENCES,
  previewRecurrenceOccurrences,
  type RecurrenceEndType,
  type RecurrenceFrequency
} from "@/lib/appointments/recurrence";
import { formatRecurrencePreviewDate } from "@/lib/appointments/date-format";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import type { Locale } from "@/lib/i18n/types";

const WEEKDAY_OPTIONS = [
  { value: 0, fr: "Lun", en: "Mon" },
  { value: 1, fr: "Mar", en: "Tue" },
  { value: 2, fr: "Mer", en: "Wed" },
  { value: 3, fr: "Jeu", en: "Thu" },
  { value: 4, fr: "Ven", en: "Fri" },
  { value: 5, fr: "Sam", en: "Sat" },
  { value: 6, fr: "Dim", en: "Sun" }
] as const;

const inputClassName =
  "min-h-11 w-full rounded-xl border border-[#e3eaf5] bg-white px-3 text-sm text-[#0b1328]";

export function RecurrenceFields({
  locale,
  timezone,
  startsAt,
  endsAt
}: {
  locale: Locale;
  timezone: string;
  startsAt: string;
  endsAt: string;
}) {
  const copy = getDashboardCopy(locale);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("none");
  const [intervalCount, setIntervalCount] = useState(1);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [monthlyPattern, setMonthlyPattern] = useState<"day_of_month" | "nth_weekday">(
    "day_of_month"
  );
  const [endType, setEndType] = useState<RecurrenceEndType>("never");
  const [endAfterCount, setEndAfterCount] = useState(10);
  const [endDate, setEndDate] = useState("");

  const preview = useMemo(() => {
    if (!startsAt || frequency === "none") {
      return { ok: true as const, count: 1, preview: [] };
    }

    return previewRecurrenceOccurrences({
      startsAt,
      endsAt: endsAt || null,
      timezone,
      recurrence: {
        frequency,
        intervalCount,
        weekdays,
        monthlyPattern,
        endType,
        endAfterCount: endType === "after" ? endAfterCount : null,
        endDate: endType === "until" ? endDate : null
      }
    });
  }, [
    startsAt,
    endsAt,
    timezone,
    frequency,
    intervalCount,
    weekdays,
    monthlyPattern,
    endType,
    endAfterCount,
    endDate
  ]);

  function toggleWeekday(value: number) {
    setWeekdays((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value].sort((left, right) => left - right)
    );
  }

  const showWeekdays =
    frequency === "weekly" || frequency === "custom" || frequency === "monthly";
  const showMonthlyPattern = frequency === "monthly";
  const showAdvanced = frequency !== "none";

  return (
    <div className="grid gap-3 rounded-xl border border-[#e3eaf5] bg-[#f8fbff] p-4">
      <p className="text-sm font-bold text-[#0b1328]">{copy.appointments.recurrence.title}</p>

      <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
        <select
          className={inputClassName}
          name="recurrenceFrequency"
          onChange={(event) =>
            setFrequency(event.target.value as RecurrenceFrequency)
          }
          value={frequency}
        >
          <option value="none">{copy.appointments.recurrence.none}</option>
          <option value="daily">{copy.appointments.recurrence.daily}</option>
          <option value="weekly">{copy.appointments.recurrence.weekly}</option>
          <option value="monthly">{copy.appointments.recurrence.monthly}</option>
          <option value="yearly">{copy.appointments.recurrence.yearly}</option>
          <option value="custom">{copy.appointments.recurrence.custom}</option>
        </select>
      </label>

      {showAdvanced ? (
        <>
          <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
            {copy.appointments.recurrence.repeatEvery}
            <input
              className={inputClassName}
              max={99}
              min={1}
              name="recurrenceInterval"
              onChange={(event) => setIntervalCount(Number(event.target.value))}
              type="number"
              value={intervalCount}
            />
          </label>

          {showWeekdays ? (
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-[#0b1328]">
                {copy.appointments.recurrence.weekdays}
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_OPTIONS.map((option) => (
                  <button
                    className={`rounded-lg px-3 py-2 text-xs font-bold ${
                      weekdays.includes(option.value)
                        ? "bg-[#2563eb] text-white"
                        : "border border-[#e3eaf5] bg-white text-[#64748b]"
                    }`}
                    key={option.value}
                    onClick={() => toggleWeekday(option.value)}
                    type="button"
                  >
                    {locale === "fr" ? option.fr : option.en}
                  </button>
                ))}
              </div>
              <input
                name="recurrenceWeekdays"
                type="hidden"
                value={weekdays.join(",")}
              />
            </div>
          ) : (
            <input name="recurrenceWeekdays" type="hidden" value="" />
          )}

          {showMonthlyPattern ? (
            <label className="grid gap-2 text-sm font-semibold text-[#0b1328]">
              {copy.appointments.recurrence.monthlyPattern}
              <select
                className={inputClassName}
                name="recurrenceMonthlyPattern"
                onChange={(event) =>
                  setMonthlyPattern(
                    event.target.value as "day_of_month" | "nth_weekday"
                  )
                }
                value={monthlyPattern}
              >
                <option value="day_of_month">
                  {copy.appointments.recurrence.dayOfMonth}
                </option>
                <option value="nth_weekday">
                  {copy.appointments.recurrence.nthWeekday}
                </option>
              </select>
            </label>
          ) : (
            <input
              name="recurrenceMonthlyPattern"
              type="hidden"
              value="day_of_month"
            />
          )}

          <div className="grid gap-2">
            <p className="text-sm font-semibold text-[#0b1328]">
              {copy.appointments.recurrence.endTitle}
            </p>
            <select
              className={inputClassName}
              name="recurrenceEndType"
              onChange={(event) =>
                setEndType(event.target.value as RecurrenceEndType)
              }
              value={endType}
            >
              <option value="never">{copy.appointments.recurrence.never}</option>
              <option value="after">{copy.appointments.recurrence.after}</option>
              <option value="until">{copy.appointments.recurrence.until}</option>
            </select>
            {endType === "after" ? (
              <input
                className={inputClassName}
                max={MAX_RECURRENCE_OCCURRENCES}
                min={1}
                name="recurrenceEndAfterCount"
                onChange={(event) => setEndAfterCount(Number(event.target.value))}
                type="number"
                value={endAfterCount}
              />
            ) : (
              <input name="recurrenceEndAfterCount" type="hidden" value="" />
            )}
            {endType === "until" ? (
              <input
                className={inputClassName}
                name="recurrenceEndDate"
                onChange={(event) => setEndDate(event.target.value)}
                type="date"
                value={endDate}
              />
            ) : (
              <input name="recurrenceEndDate" type="hidden" value="" />
            )}
          </div>
        </>
      ) : (
        <>
          <input name="recurrenceInterval" type="hidden" value="1" />
          <input name="recurrenceWeekdays" type="hidden" value="" />
          <input
            name="recurrenceMonthlyPattern"
            type="hidden"
            value="day_of_month"
          />
          <input name="recurrenceEndType" type="hidden" value="never" />
          <input name="recurrenceEndAfterCount" type="hidden" value="" />
          <input name="recurrenceEndDate" type="hidden" value="" />
        </>
      )}

      <div className="rounded-xl bg-white p-3 text-sm text-[#64748b]">
        {!preview.ok ? (
          <p className="font-semibold text-[#b42318]">{preview.error}</p>
        ) : frequency === "none" ? (
          <p>{copy.appointments.recurrence.previewSingle}</p>
        ) : (
          <>
            <p className="font-semibold text-[#0b1328]">
              {copy.appointments.recurrence.previewMultiple(preview.count)}
            </p>
            {preview.count >= 20 ? (
              <p className="mt-1 text-[#b45309]">
                {copy.appointments.recurrence.previewWarning(preview.count)}
              </p>
            ) : null}
            <ul className="mt-2 grid gap-1">
              {preview.preview.map((occurrence) => (
                <li key={occurrence.startsAt}>
                  {formatRecurrencePreviewDate(
                    occurrence.startsAt,
                    locale,
                    timezone
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
