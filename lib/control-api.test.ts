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
});
