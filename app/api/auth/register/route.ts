import { hash } from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { isRegisterRateLimited } from "../../../../lib/auth-rate-limit";
import { getDbPool } from "../../../../lib/db";
import { JsonBodyError, parseJsonBodyWithLimit } from "../../../../lib/json-body";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REGISTER_BODY_BYTES = 8 * 1024;

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  return origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  let body: { email?: string; password?: string } | null;
  try {
    body = (await parseJsonBodyWithLimit(request, MAX_REGISTER_BODY_BYTES)) as {
      email?: string;
      password?: string;
    };
  } catch (error) {
    if (error instanceof JsonBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (await isRegisterRateLimited(request.headers, email)) {
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
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    throw error;
  } finally {
    client.release();
  }
}
