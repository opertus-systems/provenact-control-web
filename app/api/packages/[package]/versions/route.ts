import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../../../lib/auth";
import { controlApiFetch } from "../../../../../lib/control-api";
import {
  JsonBodyError,
  parseJsonBodyWithLimit
} from "../../../../../lib/json-body";

const MAX_PACKAGE_VERSIONS_POST_BODY_BYTES = 64 * 1024;

type RouteParams = {
  params: Promise<{
    package: string;
  }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { package: packageParam } = await params;
  const packageName = encodeURIComponent(packageParam);
  const response = await controlApiFetch(`/v1/packages/${packageName}/versions`, session.user.id, {
    method: "GET"
  });
  const payload = await response.json().catch(() => ({ error: "Unexpected response" }));
  return NextResponse.json(payload, { status: response.status });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await parseJsonBodyWithLimit(request, MAX_PACKAGE_VERSIONS_POST_BODY_BYTES);
  } catch (error) {
    if (error instanceof JsonBodyError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { package: packageParam } = await params;
  const packageName = encodeURIComponent(packageParam);
  const response = await controlApiFetch(`/v1/packages/${packageName}/versions`, session.user.id, {
    method: "POST",
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({ error: "Unexpected response" }));
  return NextResponse.json(payload, { status: response.status });
}
