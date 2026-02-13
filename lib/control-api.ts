import { createControlApiToken } from "./control-api-auth";
import { requireProvenactApiBaseUrl } from "./provenact-api-base-url";

const DEFAULT_CONTROL_API_TIMEOUT_MS = 10_000;
const CONTROL_API_CONFIG_ERROR = "Control API bridge is misconfigured.";
const CONTROL_API_UPSTREAM_ERROR = "Control API request failed.";

function controlApiBaseUrl(): string {
  return requireProvenactApiBaseUrl(process.env.PROVENACT_API_BASE_URL);
}

function controlApiTimeoutMs(): number {
  const raw = Number(process.env.PROVENACT_API_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_CONTROL_API_TIMEOUT_MS;
  }
  return Math.min(Math.floor(raw), 60_000);
}

export async function controlApiFetch(path: string, userId: string, init?: RequestInit): Promise<Response> {
  let token: string;
  let baseUrl: string;

  try {
    token = await createControlApiToken(userId);
    baseUrl = controlApiBaseUrl();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Control API bridge misconfiguration", detail);
    return Response.json({ error: CONTROL_API_CONFIG_ERROR }, { status: 500 });
  }

  try {
    const headers = new Headers(init?.headers);
    headers.set("authorization", `Bearer ${token}`);
    if (!headers.has("content-type") && init?.body) {
      headers.set("content-type", "application/json");
    }

    return await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(controlApiTimeoutMs())
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Control API upstream request failed", detail);
    return Response.json({ error: CONTROL_API_UPSTREAM_ERROR }, { status: 502 });
  }
}
