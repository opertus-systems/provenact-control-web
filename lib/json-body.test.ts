import { describe, expect, it } from "vitest";
import { JsonBodyError, parseJsonBodyWithLimit } from "./json-body";

describe("parseJsonBodyWithLimit", () => {
  it("parses a valid JSON object body", async () => {
    const request = new Request("https://example.test/api/demo", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: { "content-type": "application/json" }
    });

    const parsed = await parseJsonBodyWithLimit(request, 1024);
    expect(parsed).toEqual({ ok: true });
  });

  it("rejects invalid JSON payloads", async () => {
    const request = new Request("https://example.test/api/demo", {
      method: "POST",
      body: "{\"broken\": ",
      headers: { "content-type": "application/json" }
    });

    await expect(parseJsonBodyWithLimit(request, 1024)).rejects.toMatchObject({
      status: 400,
      message: "Invalid JSON payload."
    } satisfies Partial<JsonBodyError>);
  });

  it("rejects oversized content-length before reading the body", async () => {
    const request = new Request("https://example.test/api/demo", {
      method: "POST",
      body: "{}",
      headers: {
        "content-type": "application/json",
        "content-length": "4096"
      }
    });

    await expect(parseJsonBodyWithLimit(request, 128)).rejects.toMatchObject({
      status: 413,
      message: "Request body too large."
    } satisfies Partial<JsonBodyError>);
  });

  it("rejects oversized chunked bodies when content-length is absent", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"message":"'));
        controller.enqueue(new TextEncoder().encode("x".repeat(256)));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      }
    });

    const request = new Request("https://example.test/api/demo", {
      method: "POST",
      body: stream,
      duplex: "half",
      headers: { "content-type": "application/json" }
    } as RequestInit);

    await expect(parseJsonBodyWithLimit(request, 64)).rejects.toMatchObject({
      status: 413,
      message: "Request body too large."
    } satisfies Partial<JsonBodyError>);
  });

  it("rejects empty bodies", async () => {
    const request = new Request("https://example.test/api/demo", {
      method: "POST",
      body: ""
    });

    await expect(parseJsonBodyWithLimit(request, 1024)).rejects.toMatchObject({
      status: 400,
      message: "Invalid JSON payload."
    } satisfies Partial<JsonBodyError>);
  });
});
