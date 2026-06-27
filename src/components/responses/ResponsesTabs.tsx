import Link from "next/link";

import { buildResponsesHref } from "@/lib/responses/filters";
import type { ExtendedOpeningFilters } from "@/lib/responses/filters";
import type { CalendarInterval } from "@/lib/responses/types";
import { formatCalendarAnchorKey } from "@/lib/responses/calendar-utils";

export function ResponsesTabs({
  activeTab,
  openingsLabel,
  appointmentsLabel,
  openingFilters,
  calendarAnchor,
  calendarInterval
}: {
  activeTab: "openings" | "appointments";
  openingsLabel: string;
  appointmentsLabel: string;
  openingFilters: ExtendedOpeningFilters;
  calendarAnchor: Date;
  calendarInterval: CalendarInterval;
}) {
  const openingsHref = buildResponsesHref(openingFilters, "openings");
  const appointmentsHref = buildResponsesHref(openingFilters, "appointments", {
    interval: calendarInterval,
    date: formatCalendarAnchorKey(calendarAnchor)
  });

  return (
    <nav
      aria-label="Sections de la page Réponses"
      className="flex flex-wrap gap-6 border-b border-[var(--line)]"
      role="tablist"
    >
      <Link
        aria-selected={activeTab === "openings"}
        className={`-mb-px border-b-2 pb-3 text-sm font-black transition ${
          activeTab === "openings"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        href={openingsHref}
        role="tab"
      >
        {openingsLabel}
      </Link>
      <Link
        aria-selected={activeTab === "appointments"}
        className={`-mb-px border-b-2 pb-3 text-sm font-black transition ${
          activeTab === "appointments"
            ? "border-[var(--primary)] text-[var(--primary)]"
            : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
        href={appointmentsHref}
        role="tab"
      >
        {appointmentsLabel}
      </Link>
    </nav>
  );
}
