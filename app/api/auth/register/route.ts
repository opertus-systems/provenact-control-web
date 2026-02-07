import { hash } from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { getDbPool } from "../../../../lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_ATTEMPTS = 8;

type RateLimitState = {
  attemptsByKey: Map<string, number[]>;
};

const globalForRateLimit = globalThis as unknown as {
  registerRateLimitState?: RateLimitState;
};

function getRateLimitState(): RateLimitState {
  if (globalForRateLimit.registerRateLimitState) {
    return globalForRateLimit.registerRateLimitState;
  }
  const state: RateLimitState = {
    attemptsByKey: new Map()
  };
  globalForRateLimit.registerRateLimitState = state;
  return state;
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  return origin === request.nextUrl.origin;
}

function requestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function rateLimitKey(request: NextRequest, email?: string): string {
  const ip = requestIp(request);
  return `${ip}:${email ?? "unknown"}`;
}

function isRateLimited(request: NextRequest, email?: string): boolean {
  const state = getRateLimitState();
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const key = rateLimitKey(request, email);
  const attempts = state.attemptsByKey.get(key) ?? [];
  const recent = attempts.filter((ts) => ts >= cutoff);
  recent.push(now);
  state.attemptsByKey.set(key, recent);
  return recent.length > RATE_LIMIT_MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (isRateLimited(request, email)) {
    return NextResponse.json({ error: "Too many signup attempts. Please try again shortly." }, { status: 429 });
  }

  if (!email || !password || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 10) {
    return NextResponse.json({ error: "Password must be at least 10 characters." }, { status: 400 });
  }
  if (email.length > 320 || password.length > 512) {
    return NextResponse.json({ error: "Email or password exceeds allowed length." }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);
  const client = await getDbPool().connect();

  try {
    await client.query("BEGIN");
    const userResult = await client.query<{ id: string }>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id::text",
      [email, passwordHash]
    );
    await client.query("INSERT INTO owners (kind, user_id) VALUES ('user', $1::uuid)", [userResult.rows[0].id]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }
    throw error;
  } finally {
    client.release();
  }
}
