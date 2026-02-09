import { createControlApiToken } from "./control-api-auth";

function controlApiBaseUrl(): string {
  const value = process.env.PROVENACT_API_BASE_URL;
  if (!value) {
    throw new Error("PROVENACT_API_BASE_URL is required.");
  }
  const normalized = value.replace(/\/+$/, "");
  const parsed = new URL(normalized);
  const isLocalHttp = parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  if (!isLocalHttp && parsed.protocol !== "https:") {
    throw new Error("PROVENACT_API_BASE_URL must use https (or http on localhost for local development).");
  }
  return normalized;
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
