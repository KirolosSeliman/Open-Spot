export type PlatformAdminRole = "platform_owner" | "support" | "readonly";

export type PlatformBusinessHealth = "ok" | "warning" | "problem";
export type PlatformBusinessActivity = "active" | "inactive";
export type PlatformBusinessHealthFilter =
  | "all"
  | PlatformBusinessHealth;
export type PlatformBusinessActivityFilter =
  | "all"
  | PlatformBusinessActivity;
export type PlatformBusinessSort = "created_desc" | "activity_desc";

export type PlatformBusinessFilters = {
  q: string;
  health: PlatformBusinessHealthFilter;
  activity: PlatformBusinessActivityFilter;
  sort: PlatformBusinessSort;
};

export type PlatformBusinessFilterable = {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string | null;
  createdAt: string;
  lastActivityAt: string | null;
  health: PlatformBusinessHealth;
  activityStatus: PlatformBusinessActivity;
};

const healthFilters = new Set<PlatformBusinessHealthFilter>([
  "all",
  "ok",
  "warning",
  "problem"
]);
const activityFilters = new Set<PlatformBusinessActivityFilter>([
  "all",
  "active",
  "inactive"
]);
const sortOptions = new Set<PlatformBusinessSort>([
  "created_desc",
  "activity_desc"
]);

export function normalizeAdminSearchText(
  value: string | null | undefined
): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

export function compactAdminSearchText(
  value: string | null | undefined
): string {
  return normalizeAdminSearchText(value).replace(/\s+/g, "");
}

export function adminSearchMatches(
  haystackValues: Array<string | null | undefined>,
  rawQuery: string
): boolean {
  const query = normalizeAdminSearchText(rawQuery);
  const compactQuery = compactAdminSearchText(rawQuery);

  if (!query && !compactQuery) {
    return true;
  }

  const rawHaystack = haystackValues.filter(Boolean).join(" ");
  const haystack = normalizeAdminSearchText(rawHaystack);
  const compactHaystack = compactAdminSearchText(rawHaystack);

  if (haystack.includes(query)) {
    return true;
  }

  if (compactQuery && compactHaystack.includes(compactQuery)) {
    return true;
  }

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every(
      (token) => haystack.includes(token) || compactHaystack.includes(token)
    );
}

export function normalizePlatformBusinessFilters(params: {
  q?: string;
  health?: string;
  activity?: string;
  sort?: string;
}): PlatformBusinessFilters {
  const q = (params.q ?? "").trim().slice(0, 80);
  const health = healthFilters.has(params.health as PlatformBusinessHealthFilter)
    ? (params.health as PlatformBusinessHealthFilter)
    : "all";
  const activity = activityFilters.has(
    params.activity as PlatformBusinessActivityFilter
  )
    ? (params.activity as PlatformBusinessActivityFilter)
    : "all";
  const sort = sortOptions.has(params.sort as PlatformBusinessSort)
    ? (params.sort as PlatformBusinessSort)
    : "created_desc";

  return {
    q,
    health,
    activity,
    sort
  };
}

export function filterPlatformBusinesses<T extends PlatformBusinessFilterable>(
  rows: T[],
  filters: PlatformBusinessFilters
): T[] {
  return [...rows]
    .filter((row) => {
      const matchesHealth =
        filters.health === "all" || row.health === filters.health;
      const matchesActivity =
        filters.activity === "all" || row.activityStatus === filters.activity;
      const matchesSearch = adminSearchMatches(
        [row.name, row.slug, row.ownerEmail],
        filters.q
      );

      return matchesHealth && matchesActivity && matchesSearch;
    })
    .sort((a, b) => {
      if (filters.sort === "activity_desc") {
        return (
          Date.parse(b.lastActivityAt ?? "") -
          Date.parse(a.lastActivityAt ?? "")
        );
      }

      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
}

export function getBusinessHealth(input: {
  failedSmsThisMonth: number;
  undeliveredSmsThisMonth: number;
  outboundSmsThisMonth: number;
  openingsAwaitingValidation: number;
  daysSinceLastActivity: number | null;
}): PlatformBusinessHealth {
  const deliveryProblems =
    input.failedSmsThisMonth + input.undeliveredSmsThisMonth;
  const failureRate =
    input.outboundSmsThisMonth > 0
      ? deliveryProblems / input.outboundSmsThisMonth
      : 0;

  if (
    deliveryProblems >= 5 ||
    failureRate >= 0.2 ||
    (input.daysSinceLastActivity !== null && input.daysSinceLastActivity > 30)
  ) {
    return "problem";
  }

  if (
    deliveryProblems > 0 ||
    input.openingsAwaitingValidation >= 5 ||
    (input.daysSinceLastActivity !== null && input.daysSinceLastActivity > 14)
  ) {
    return "warning";
  }

  return "ok";
}

export function formatAdminCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) {
    return "Non disponible";
  }

  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) {
    return "Non disponible";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function daysBetween(now: Date, value: string | null): number | null {
  if (!value) {
    return null;
  }

  return Math.floor((now.getTime() - Date.parse(value)) / 86_400_000);
}
