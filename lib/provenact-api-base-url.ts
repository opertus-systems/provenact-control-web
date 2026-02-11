export function normalizeProvenactApiBaseUrl(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }
  const normalized = raw.replace(/\/+$/, "");

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return null;
  }

  const isLocalHttp =
    parsed.protocol === "http:" &&
    (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  if (!isLocalHttp && parsed.protocol !== "https:") {
    return null;
  }
  return normalized;
}

export function requireProvenactApiBaseUrl(raw: string | undefined): string {
  const normalized = normalizeProvenactApiBaseUrl(raw);
  if (!normalized) {
    throw new Error(
      "PROVENACT_API_BASE_URL must be configured and use https (or http on localhost for local development)."
    );
  }
  return normalized;
}
