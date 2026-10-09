const STORAGE_KEY = "naje-care-destination";

export function safeCareDestination(
  value: string | null | undefined,
): string | null {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  )
    return null;
  try {
    const url = new URL(value, "https://naje.invalid");
    if (url.origin !== "https://naje.invalid") return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function rememberCareDestination(value: string) {
  const next = safeCareDestination(value);
  if (!next || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ next, expires: Date.now() + 86400000 }),
    );
  } catch {
    /* Storage may be unavailable in private browsing. */
  }
}

export function pendingCareDestination(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    return saved?.expires > Date.now() ? safeCareDestination(saved.next) : null;
  } catch {
    return null;
  }
}

export function clearCareDestination() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}
