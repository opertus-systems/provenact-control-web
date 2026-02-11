import { describe, expect, it } from "vitest";
import { normalizeProvenactApiBaseUrl, requireProvenactApiBaseUrl } from "./provenact-api-base-url";

describe("normalizeProvenactApiBaseUrl", () => {
  it("accepts https urls and trims trailing slashes", () => {
    expect(normalizeProvenactApiBaseUrl("https://api.example.test///")).toBe("https://api.example.test");
  });

  it("accepts localhost http for development", () => {
    expect(normalizeProvenactApiBaseUrl("http://localhost:8080/")).toBe("http://localhost:8080");
    expect(normalizeProvenactApiBaseUrl("http://127.0.0.1:3000")).toBe("http://127.0.0.1:3000");
  });

  it("rejects invalid or insecure remote urls", () => {
    expect(normalizeProvenactApiBaseUrl(undefined)).toBeNull();
    expect(normalizeProvenactApiBaseUrl("not-a-url")).toBeNull();
    expect(normalizeProvenactApiBaseUrl("http://api.example.test")).toBeNull();
  });
});

describe("requireProvenactApiBaseUrl", () => {
  it("throws when url is invalid", () => {
    expect(() => requireProvenactApiBaseUrl("http://api.example.test")).toThrow(
      "PROVENACT_API_BASE_URL must be configured and use https"
    );
  });
});
