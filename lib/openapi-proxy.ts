export function buildClientResponseHeaders(upstreamHeaders: Headers): Headers {
  const responseHeaders = new Headers();
  const allowlist = ["content-type", "content-length", "cache-control", "etag", "last-modified", "vary"];
  for (const header of allowlist) {
    const value = upstreamHeaders.get(header);
    if (value) {
      responseHeaders.set(header, value);
    }
  }
  return responseHeaders;
}

const ALLOWED_PROXY_PATHS = new Set([
  "healthz",
  "v1/hash/sha256",
  "v1/verify/manifest",
  "v1/verify/receipt"
]);

export function normalizeOpenApiProxyPath(path: string[]): string | null {
  if (!path.length || path.some((segment) => segment.length === 0)) {
    return null;
  }

  const joined = path.join("/");
  if (joined.includes("..") || joined.includes("\\") || joined.includes("%")) {
    return null;
  }

  if (!ALLOWED_PROXY_PATHS.has(joined)) {
    return null;
  }
  return joined;
}
