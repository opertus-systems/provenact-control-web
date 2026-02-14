type NormalizeBaseUrlOptions = {
  allowPrivateHttp?: boolean;
};

function isPrivateIpv4Host(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) {
    return false;
  }
  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

function isPrivateHostnameForHttp(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (normalized === "localhost" || normalized === "::1") {
    return true;
  }
  if (isPrivateIpv4Host(normalized)) {
    return true;
  }
  // Single-label hostnames are commonly container/service-network DNS names.
  return !normalized.includes(".");
}

export function normalizeProvenactApiBaseUrl(
  raw: string | undefined,
  options: NormalizeBaseUrlOptions = {}
): string | null {
  if (!raw) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  const allowPrivateHttp = options.allowPrivateHttp === true;
  const isHttp = parsed.protocol === "http:";
  const isAllowedHttpHost =
    isHttp && (isPrivateHostnameForHttp(parsed.hostname) && (allowPrivateHttp || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"));
  if (!isAllowedHttpHost && parsed.protocol !== "https:") {
    return null;
  }
  if (parsed.username || parsed.password) {
    return null;
  }
  const normalizedPathname = parsed.pathname.replace(/\/+/g, "/");
  if (normalizedPathname !== "/" || parsed.search || parsed.hash) {
    return null;
  }
  return parsed.origin;
}

export function requireProvenactApiBaseUrl(
  raw: string | undefined,
  options: NormalizeBaseUrlOptions = {}
): string {
  const normalized = normalizeProvenactApiBaseUrl(raw, options);
  if (!normalized) {
    throw new Error(
      "PROVENACT_API_BASE_URL must be configured and use https (or http on localhost; set PROVENACT_ALLOW_PRIVATE_HTTP=true for private-network http hosts)."
    );
  }
  return normalized;
}
