import { getDbPool } from "./db";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 8;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;

type HeaderRecord = Record<string, unknown>;

function extractHeader(headers: unknown, name: string): string | null {
  if (!headers) {
    return null;
  }

  if (typeof headers === "object" && headers !== null) {
    const candidate = headers as { get?: (header: string) => string | null; entries?: () => Iterable<[string, string]> };
    if (typeof candidate.get === "function") {
      const value = candidate.get(name);
      if (typeof value === "string") {
        return value;
      }
    }

    const record = headers as HeaderRecord;
    const directValue = record[name] ?? record[name.toLowerCase()] ?? record[name.toUpperCase()];
    if (typeof directValue === "string") {
      return directValue;
    }
  }

  return null;
}

function normalizeEmail(email?: string): string | null {
  if (typeof email !== "string") {
    return null;
  }
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function requestIp(headers: unknown): string | null {
  const trustForwarded = process.env.TRUST_PROXY_HEADERS === "true";
  if (!trustForwarded) {
    return null;
  }

  const forwarded = extractHeader(headers, "x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const direct = (
    extractHeader(headers, "x-real-ip") ??
    extractHeader(headers, "cf-connecting-ip") ??
    null
  );
  return direct?.trim() || null;
}

export function buildRateLimitKey(headers: unknown, email?: string): string {
  const ip = requestIp(headers);
  const normalizedEmail = normalizeEmail(email);
  if (ip && normalizedEmail) {
    return `ip:${ip}|email:${normalizedEmail}`;
  }
  if (ip) {
    return `ip:${ip}`;
  }
  if (normalizedEmail) {
    return `email:${normalizedEmail}`;
  }
  return "global";
}

async function isRateLimited(
  tableName: "auth_register_attempts" | "auth_login_attempts",
  maxAttempts: number,
  headers: unknown,
  email?: string
): Promise<boolean> {
  const key = buildRateLimitKey(headers, email);
  const client = await getDbPool().connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [key]);
    await client.query(
      `DELETE FROM ${tableName} WHERE key = $1 AND ts < now() - make_interval(secs => $2::int)`,
      [key, RATE_LIMIT_WINDOW_SECONDS]
    );
    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${tableName} WHERE key = $1`,
      [key]
    );
    const attempts = Number(countResult.rows[0]?.count ?? "0");
    const limited = attempts >= maxAttempts;

    if (!limited) {
      await client.query(`INSERT INTO ${tableName} (key) VALUES ($1)`, [key]);
    }

    await client.query("COMMIT");
    return limited;
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return true;
  } finally {
    client.release();
  }
}

export async function isRegisterRateLimited(headers: unknown, email?: string): Promise<boolean> {
  return isRateLimited("auth_register_attempts", REGISTER_RATE_LIMIT_MAX_ATTEMPTS, headers, email);
}

export async function isLoginRateLimited(headers: unknown, email?: string): Promise<boolean> {
  return isRateLimited("auth_login_attempts", LOGIN_RATE_LIMIT_MAX_ATTEMPTS, headers, email);
}
