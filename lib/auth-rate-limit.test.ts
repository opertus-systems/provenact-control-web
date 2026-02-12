import { afterEach, describe, expect, it } from "vitest";
import { buildRateLimitKey } from "./auth-rate-limit";

const originalTrustProxy = process.env.TRUST_PROXY_HEADERS;

afterEach(() => {
  if (typeof originalTrustProxy === "undefined") {
    delete process.env.TRUST_PROXY_HEADERS;
  } else {
    process.env.TRUST_PROXY_HEADERS = originalTrustProxy;
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

  it("uses first forwarded ip when proxy headers are trusted", () => {
    process.env.TRUST_PROXY_HEADERS = "true";
    const key = buildRateLimitKey(
      { "x-forwarded-for": "203.0.113.9, 198.51.100.12", "x-real-ip": "198.51.100.7" },
      "alice@example.com"
    );

    expect(key).toBe("ip:203.0.113.9|email:alice@example.com");
  });

  it("falls back to a stable global bucket when no trusted ip and no email exist", () => {
    process.env.TRUST_PROXY_HEADERS = "false";
    const key = buildRateLimitKey({ "user-agent": "UA-A" });

    expect(key).toBe("global");
  });
});
