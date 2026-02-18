import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const getServerSessionMock = vi.fn();
const controlApiFetchMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args)
}));

vi.mock("../../../../../lib/auth", () => ({
  authOptions: {}
}));

vi.mock("../../../../../lib/control-api", () => ({
  controlApiFetch: (...args: unknown[]) => controlApiFetchMock(...args)
}));

import { POST } from "./route";

afterEach(() => {
  getServerSessionMock.mockReset();
  controlApiFetchMock.mockReset();
});

describe("POST /api/packages/[package]/versions", () => {
  it("rejects oversized JSON payloads", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-123" } });

    const request = new Request("https://example.test/api/packages/demo/versions", {
      method: "POST",
      body: "{}",
      headers: {
        "content-type": "application/json",
        "content-length": "70000"
      }
    });
    const response = await POST(request as NextRequest, {
      params: Promise.resolve({ package: "demo" })
    });
    const payload = await response.json();

    expect(response.status).toBe(413);
    expect(payload).toEqual({ error: "Request body too large." });
    expect(controlApiFetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON payloads", async () => {
    getServerSessionMock.mockResolvedValueOnce({ user: { id: "user-123" } });

    const request = new Request("https://example.test/api/packages/demo/versions", {
      method: "POST",
      body: "{\"broken\":",
      headers: {
        "content-type": "application/json"
      }
    });
    const response = await POST(request as NextRequest, {
      params: Promise.resolve({ package: "demo" })
    });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Invalid JSON payload." });
    expect(controlApiFetchMock).not.toHaveBeenCalled();
  });
});
