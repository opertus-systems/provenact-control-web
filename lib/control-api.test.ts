import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createControlApiTokenMock = vi.fn();
const requireProvenactApiBaseUrlMock = vi.fn();

vi.mock("./control-api-auth", () => ({
  createControlApiToken: (...args: unknown[]) => createControlApiTokenMock(...args)
}));

vi.mock("./provenact-api-base-url", () => ({
  requireProvenactApiBaseUrl: (...args: unknown[]) => requireProvenactApiBaseUrlMock(...args)
}));

import { controlApiFetch } from "./control-api";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  createControlApiTokenMock.mockReset();
  requireProvenactApiBaseUrlMock.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("controlApiFetch", () => {
  it("returns a generic configuration error without leaking secret details", async () => {
    createControlApiTokenMock.mockRejectedValueOnce(
      new Error("PROVENACT_API_AUTH_SECRET is required.")
    );

    const response = await controlApiFetch("/v1/packages", "user-123", { method: "GET" });
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Control API bridge is misconfigured." });
    expect(JSON.stringify(payload)).not.toContain("PROVENACT_API_AUTH_SECRET");
  });

  it("returns a generic upstream error without leaking network internals", async () => {
    createControlApiTokenMock.mockResolvedValueOnce("token-abc");
    requireProvenactApiBaseUrlMock.mockReturnValueOnce("https://api.example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(
        new Error("connect ECONNREFUSED 10.0.0.25:8080")
      )
    );

    const response = await controlApiFetch("/v1/packages", "user-123", { method: "GET" });
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toEqual({ error: "Control API request failed." });
    expect(JSON.stringify(payload)).not.toContain("10.0.0.25");
  });

  it("rejects non-path control API targets", async () => {
    createControlApiTokenMock.mockResolvedValueOnce("token-abc");
    requireProvenactApiBaseUrlMock.mockReturnValueOnce("https://api.example.test");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await controlApiFetch("https://evil.example.test/v1/packages", "user-123", {
      method: "GET"
    });
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toEqual({ error: "Control API request failed." });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects traversal and encoding tricks in control API targets", async () => {
    const blockedPaths = [
      "/v1//packages",
      "/v1/../packages",
      "/v1/%2e%2e/packages",
      "/v1/packages?debug=true",
      "/v1/packages#frag",
      "/v1\\packages"
    ];

    for (const blockedPath of blockedPaths) {
      createControlApiTokenMock.mockResolvedValueOnce("token-abc");
      requireProvenactApiBaseUrlMock.mockReturnValueOnce("https://api.example.test");
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      const response = await controlApiFetch(blockedPath, "user-123", { method: "GET" });
      const payload = await response.json();

      expect(response.status).toBe(502);
      expect(payload).toEqual({ error: "Control API request failed." });
      expect(fetchSpy).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    }
  });
});
