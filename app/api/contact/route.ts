import { NextRequest, NextResponse } from "next/server";
import { JsonBodyError, parseJsonBodyWithLimit } from "../../../lib/json-body";

type ContactPayload = {
  name: string;
  email: string;
  company?: string;
  message: string;
};
const MAX_CONTACT_BODY_BYTES = 32 * 1024;

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  return origin === request.nextUrl.origin;
}

function validate(payload: Partial<ContactPayload>) {
  if (!payload.name || payload.name.trim().length < 2) {
    return "Please provide your name.";
  }

  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return "Please provide a valid email address.";
  }

  if (!payload.message || payload.message.trim().length < 20) {
    return "Please provide a message with at least 20 characters.";
  }

  if (payload.name.length > 200 || payload.email.length > 320 || (payload.company && payload.company.length > 200)) {
    return "One or more fields exceed allowed length.";
  }

  if (payload.message.length > 5000) {
    return "Message is too long.";
  }

  return null;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origin not allowed." }, { status: 403 });
  }

  let body: Partial<ContactPayload>;
  try {
    body = (await parseJsonBodyWithLimit(request, MAX_CONTACT_BODY_BYTES)) as Partial<ContactPayload>;
  } catch (error) {
    if (error instanceof JsonBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const error = validate(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const submission = {
    name: body.name!.trim(),
    email: body.email!.trim().toLowerCase(),
    company: body.company?.trim() || "",
    message: body.message!.trim(),
    submittedAt: new Date().toISOString()
  };

  const webhookUrl = process.env.PROVENACT_CONTACT_WEBHOOK_URL;

  if (webhookUrl) {
    try {
      const parsed = new URL(webhookUrl);
      const isLocalHttp = parsed.protocol === "http:" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
      if (!isLocalHttp && parsed.protocol !== "https:") {
        return NextResponse.json({ error: "Contact webhook URL must use https." }, { status: 500 });
      }

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(submission),
        signal: AbortSignal.timeout(5_000)
      });

      if (!webhookResponse.ok) {
        return NextResponse.json(
          {
            error: "Contact intake is temporarily unavailable. Please email support directly."
          },
          { status: 502 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          error: "Contact intake is temporarily unavailable. Please email support directly."
        },
        { status: 502 }
      );
    }
  }

  console.info("Contact submission received", {
    emailDomain: submission.email.split("@")[1] ?? "unknown",
    hasCompany: Boolean(submission.company),
    submittedAt: submission.submittedAt
  });

  return NextResponse.json({ ok: true });
}
