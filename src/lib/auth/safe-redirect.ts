export function getSafeInternalRedirectPath(
  redirectValue: string | null | undefined
): string | null {
  const value = redirectValue?.trim();

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value, "https://open-spot.local");

    if (url.origin !== "https://open-spot.local") {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function isSafeRelativePath(path: string | null | undefined) {
  return getSafeInternalRedirectPath(path) !== null;
}
