import { NextRequest, NextResponse } from "next/server";
import { buildClientResponseHeaders } from "../../../../../lib/openapi-proxy";
import { normalizeProvenactApiBaseUrl } from "../../../../../lib/provenact-api-base-url";

const MAX_PROXY_BODY_BYTES = 1_000_000;

function getApiBaseUrl() {
  return normalizeProvenactApiBaseUrl(process.env.PROVENACT_API_BASE_URL);
}

function normalizePath(path: string[]): string | null {
  if (!path.length) {
    return null;
  }
  const joined = path.join("/");
  if (joined.includes("..")) {
    return null;
  }
  if (joined === "healthz") {
    return joined;
  }
  if (!joined.startsWith("v1/")) {
    return null;
  }
  const segments = joined.split("/");
  const allowedRoots = new Set(["hash", "verify"]);
  if (!allowedRoots.has(segments[1] ?? "")) {
    return null;
  }
  return joined;
}

function buildUpstreamHeaders(request: NextRequest): Headers {
  const upstreamHeaders = new Headers();
  const allowlist = ["accept", "content-type"];
  for (const header of allowlist) {
    const value = request.headers.get(header);
    if (value) {
      upstreamHeaders.set(header, value);
    }
  }
  return upstreamHeaders;
}

async function proxyRequest(request: NextRequest, method: string, path: string[]) {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json(
      { error: "API base URL not configured", details: "Set PROVENACT_API_BASE_URL or NEXT_PUBLIC_PROVENACT_API_BASE_URL." },
      { status: 500 }
    );
  }

  const normalizedPath = normalizePath(path);
  if (!normalizedPath) {
    return NextResponse.json({ error: "Path is not allowed for this proxy route." }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_PROXY_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  const upstreamUrl = new URL(`${apiBase}/${normalizedPath}`);
  upstreamUrl.search = request.nextUrl.search;

  const upstreamHeaders = buildUpstreamHeaders(request);

  const hasBody = !["GET", "HEAD"].includes(method);
  let body: Uint8Array | undefined;
  if (hasBody) {
    const raw = new Uint8Array(await request.arrayBuffer());
    if (raw.byteLength > MAX_PROXY_BODY_BYTES) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }
    body = raw;
  }

  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: upstreamHeaders,
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  } as RequestInit);

  const responseHeaders = buildClientResponseHeaders(upstreamResponse.headers);

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders
  });
}

type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "GET", path);
}

export async function POST(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return proxyRequest(request, "POST", path);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
