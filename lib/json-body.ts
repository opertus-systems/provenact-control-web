export class JsonBodyError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "JsonBodyError";
    this.status = status;
  }
}

function parseContentLength(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.floor(parsed);
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export async function parseJsonBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<unknown> {
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("maxBytes must be a positive integer");
  }

  const contentLength = parseContentLength(request.headers.get("content-length"));
  if (contentLength !== null && contentLength > maxBytes) {
    throw new JsonBodyError(413, "Request body too large.");
  }

  if (!request.body) {
    throw new JsonBodyError(400, "Invalid JSON payload.");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel("request body too large");
      throw new JsonBodyError(413, "Request body too large.");
    }
    chunks.push(value);
  }

  if (total === 0) {
    throw new JsonBodyError(400, "Invalid JSON payload.");
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(decodeUtf8(body));
  } catch {
    throw new JsonBodyError(400, "Invalid JSON payload.");
  }
}
