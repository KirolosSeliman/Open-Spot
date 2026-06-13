export function normalizeAdminSearchText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

export function compactAdminSearchText(value: string | null | undefined) {
  return normalizeAdminSearchText(value).replace(/\s+/g, "");
}

export function adminSearchMatches(
  values: Array<string | number | null | undefined>,
  rawQuery: string
) {
  const query = normalizeAdminSearchText(rawQuery);
  const compactQuery = compactAdminSearchText(rawQuery);

  if (!query && !compactQuery) {
    return true;
  }

  const joined = values
    .filter((value) => value !== null && value !== undefined)
    .join(" ");
  const haystack = normalizeAdminSearchText(joined);
  const compactHaystack = compactAdminSearchText(joined);

  if (query && haystack.includes(query)) {
    return true;
  }

  if (compactQuery && compactHaystack.includes(compactQuery)) {
    return true;
  }

  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token) || compactHaystack.includes(token));
}
