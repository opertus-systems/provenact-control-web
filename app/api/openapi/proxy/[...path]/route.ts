import { NextRequest, NextResponse } from "next/server";
import {
  buildClientResponseHeaders,
  normalizeOpenApiProxyPath
} from "../../../../../lib/openapi-proxy";
import { normalizeProvenactApiBaseUrl } from "../../../../../lib/provenact-api-base-url";

const MAX_PROXY_BODY_BYTES = 1_000_000;
const UPSTREAM_TIMEOUT_MS = 10_000;

function getApiBaseUrl() {
  return normalizeProvenactApiBaseUrl(process.env.PROVENACT_API_BASE_URL, {
    allowPrivateHttp: process.env.PROVENACT_ALLOW_PRIVATE_HTTP === "true"
  });
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

function capRequestBody(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): ReadableStream<Uint8Array> {
  const reader = stream.getReader();
  let total = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      total += value.byteLength;
      if (total > maxBytes) {
        controller.error(new Error("request body too large"));
        await reader.cancel("request body too large");
        return;
      }

      controller.enqueue(value);
    },
    async cancel(reason) {
      await reader.cancel(reason);
    }
  });
}

async function proxyRequest(request: NextRequest, method: string, path: string[]) {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json(
      { error: "API base URL not configured", details: "Set PROVENACT_API_BASE_URL or NEXT_PUBLIC_PROVENACT_API_BASE_URL." },
      { status: 500 }
    );
  }

  const normalizedPath = normalizeOpenApiProxyPath(path);
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
  let body: ReadableStream<Uint8Array> | undefined;
  let duplex: "half" | undefined;
  if (hasBody) {
    if (!request.body) {
      body = undefined;
    } else {
      body = capRequestBody(request.body, MAX_PROXY_BODY_BYTES);
      duplex = "half";
    }
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers: upstreamHeaders,
      body,
      duplex,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    } as RequestInit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("request body too large")) {
      return NextResponse.json({ error: "Request body too large." }, { status: 413 });
    }
    return NextResponse.json({ error: "Upstream request failed." }, { status: 502 });
  }

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
