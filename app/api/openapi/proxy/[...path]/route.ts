import { NextRequest, NextResponse } from "next/server";

function getApiBaseUrl() {
  const value = process.env.PROVENACT_API_BASE_URL;
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\/+$/, "");
  const parsed = new URL(normalized);
  const isLocalHttp = parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
  if (!isLocalHttp && parsed.protocol !== "https:") {
    return null;
  }
  return normalized;
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
  if (Number.isFinite(contentLength) && contentLength > 1_000_000) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  const upstreamUrl = new URL(`${apiBase}/${normalizedPath}`);
  upstreamUrl.search = request.nextUrl.search;

  const upstreamHeaders = buildUpstreamHeaders(request);

  const hasBody = !["GET", "HEAD"].includes(method);
  const upstreamResponse = await fetch(upstreamUrl, {
    method,
    headers: upstreamHeaders,
    body: hasBody ? request.body : undefined,
    duplex: hasBody ? "half" : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000)
  } as RequestInit);

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("connection");

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
