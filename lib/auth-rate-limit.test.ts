import { afterEach, describe, expect, it } from "vitest";
import { buildRateLimitKey } from "./auth-rate-limit";

const originalTrustProxy = process.env.TRUST_PROXY_HEADERS;
const originalTrustProxyHops = process.env.TRUST_PROXY_HOPS;

afterEach(() => {
  if (typeof originalTrustProxy === "undefined") {
    delete process.env.TRUST_PROXY_HEADERS;
  } else {
    process.env.TRUST_PROXY_HEADERS = originalTrustProxy;
  }
  if (typeof originalTrustProxyHops === "undefined") {
    delete process.env.TRUST_PROXY_HOPS;
  } else {
    process.env.TRUST_PROXY_HOPS = originalTrustProxyHops;
  }
});

describe("buildRateLimitKey", () => {
  it("does not vary by user-agent when proxy headers are untrusted", () => {
    process.env.TRUST_PROXY_HEADERS = "false";
    const keyA = buildRateLimitKey({ "user-agent": "UA-A" }, "alice@example.com");
    const keyB = buildRateLimitKey({ "user-agent": "UA-B" }, "alice@example.com");

    expect(keyA).toBe("email:alice@example.com");
    expect(keyB).toBe("email:alice@example.com");
  });

  it("uses right-most forwarded ip for one trusted proxy hop", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const key = buildRateLimitKey(
      { "x-forwarded-for": "203.0.113.9, 198.51.100.12", "x-real-ip": "198.51.100.7" },
      "alice@example.com"
    );

    expect(key).toBe("ip:198.51.100.12|email:alice@example.com");
  });

  it("respects configured proxy hop count when reading forwarded chain", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    process.env.TRUST_PROXY_HOPS = "2";
    const key = buildRateLimitKey(
      { "x-forwarded-for": "203.0.113.9, 198.51.100.12, 192.0.2.3" },
      "alice@example.com"
    );

    expect(key).toBe("ip:198.51.100.12|email:alice@example.com");
  });

  it("normalizes ip:port from forwarded headers", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const key = buildRateLimitKey(
      { "x-forwarded-for": "203.0.113.9:43120, 198.51.100.12" },
      "alice@example.com"
    );

    expect(key).toBe("ip:198.51.100.12|email:alice@example.com");
  });

  it("ignores invalid forwarded values and falls back to other trusted ip headers", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const key = buildRateLimitKey(
      { "x-forwarded-for": "definitely-not-an-ip", "x-real-ip": "198.51.100.7" },
      "alice@example.com"
    );

    expect(key).toBe("ip:198.51.100.7|email:alice@example.com");
  });

  it("falls back to a stable global bucket when no trusted ip and no email exist", () => {
    process.env.TRUST_PROXY_HEADERS = "false";
    const key = buildRateLimitKey({ "user-agent": "UA-A" });

    expect(key).toBe("global");
  });
});
