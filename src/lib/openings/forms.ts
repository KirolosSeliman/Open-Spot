export type OpeningCreateInput = {
  title: string;
  serviceId: string | null;
  startTime: string;
  endTime: string;
  offerLabel: string | null;
  internalNote: string | null;
};

type FormResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      errors: string[];
    };

function cleanOptionalText(input: unknown) {
  const value = String(input ?? "").trim();
  return value || null;
}

function isValidDateTime(input: string) {
  return Boolean(input) && !Number.isNaN(new Date(input).getTime());
}

export function buildOpeningCreateInput(input: {
  title?: unknown;
  serviceId?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  offerLabel?: unknown;
  internalNote?: unknown;
  organizationId?: unknown;
}): FormResult<OpeningCreateInput> {
  const errors: string[] = [];
  const title = String(input.title ?? "").trim();
  const startTime = String(input.startTime ?? "").trim();
  const endTime = String(input.endTime ?? "").trim();

  if (!title) {
    errors.push("Opening title is required.");
  }

  if (!isValidDateTime(startTime)) {
    errors.push("Start time is required.");
  }

  if (!isValidDateTime(endTime)) {
    errors.push("End time is required.");
  }

  if (
    isValidDateTime(startTime) &&
    isValidDateTime(endTime) &&
    new Date(endTime).getTime() <= new Date(startTime).getTime()
  ) {
    errors.push("End time must be after start time.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      title,
      serviceId: cleanOptionalText(input.serviceId),
      startTime,
      endTime,
      offerLabel: cleanOptionalText(input.offerLabel),
      internalNote: cleanOptionalText(input.internalNote)
    }
  };
}
