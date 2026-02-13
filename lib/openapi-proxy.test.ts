import { describe, expect, it } from "vitest";
import { buildClientResponseHeaders, normalizeOpenApiProxyPath } from "./openapi-proxy";

describe("buildClientResponseHeaders", () => {
  it("keeps only allowlisted response headers", () => {
    const upstream = new Headers({
      "content-type": "application/json",
      "content-length": "123",
      "cache-control": "no-store",
      etag: "\"abc\"",
      "last-modified": "Wed, 21 Oct 2015 07:28:00 GMT",
      vary: "accept",
      "set-cookie": "session=secret",
      "x-powered-by": "upstream",
      "content-security-policy": "default-src 'none'"
    });

    const out = buildClientResponseHeaders(upstream);

    expect(out.get("content-type")).toBe("application/json");
    expect(out.get("content-length")).toBe("123");
    expect(out.get("cache-control")).toBe("no-store");
    expect(out.get("etag")).toBe("\"abc\"");
    expect(out.get("last-modified")).toBe("Wed, 21 Oct 2015 07:28:00 GMT");
    expect(out.get("vary")).toBe("accept");

    expect(out.get("set-cookie")).toBeNull();
    expect(out.get("x-powered-by")).toBeNull();
    expect(out.get("content-security-policy")).toBeNull();
  });
});

describe("normalizeOpenApiProxyPath", () => {
  it("allows only explicit safe control API paths", () => {
    expect(normalizeOpenApiProxyPath(["healthz"])).toBe("healthz");
    expect(normalizeOpenApiProxyPath(["v1", "hash", "sha256"])).toBe("v1/hash/sha256");
    expect(normalizeOpenApiProxyPath(["v1", "verify", "manifest"])).toBe("v1/verify/manifest");
    expect(normalizeOpenApiProxyPath(["v1", "verify", "receipt"])).toBe("v1/verify/receipt");
  });

  it("rejects traversal and non-allowlisted paths", () => {
    expect(normalizeOpenApiProxyPath([])).toBeNull();
    expect(normalizeOpenApiProxyPath(["v1", "verify", "admin"])).toBeNull();
    expect(normalizeOpenApiProxyPath(["v1", "verify", ".."])).toBeNull();
    expect(normalizeOpenApiProxyPath(["v1", "verify", "%2e%2e"])).toBeNull();
    expect(normalizeOpenApiProxyPath(["v1\\verify\\manifest"])).toBeNull();
  });
});
