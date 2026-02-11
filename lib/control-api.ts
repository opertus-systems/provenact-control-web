import { createControlApiToken } from "./control-api-auth";
import { requireProvenactApiBaseUrl } from "./provenact-api-base-url";

function controlApiBaseUrl(): string {
  return requireProvenactApiBaseUrl(process.env.PROVENACT_API_BASE_URL);
}

export async function controlApiFetch(path: string, userId: string, init?: RequestInit): Promise<Response> {
  const token = await createControlApiToken(userId);
  const headers = new Headers(init?.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (!headers.has("content-type") && init?.body) {
    headers.set("content-type", "application/json");
  }

  return fetch(`${controlApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });
}
