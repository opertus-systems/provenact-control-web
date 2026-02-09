import { SignJWT } from "jose";
import { randomUUID } from "crypto";

const MIN_API_AUTH_SECRET_BYTES = 32;

export async function createControlApiToken(userId: string): Promise<string> {
  const secret = process.env.PROVENACT_API_AUTH_SECRET;
  if (!secret) {
    throw new Error("PROVENACT_API_AUTH_SECRET is required.");
  }
  if (secret.trim().length < MIN_API_AUTH_SECRET_BYTES) {
    throw new Error(`PROVENACT_API_AUTH_SECRET must be at least ${MIN_API_AUTH_SECRET_BYTES} bytes.`);
  }
  if (!userId) {
    throw new Error("user id is required to create control API token.");
  }

  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer("provenact-web")
    .setAudience("provenact-control")
    .setJti(randomUUID())
    .setIssuedAt()
    .setNotBefore("0s")
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));
}
