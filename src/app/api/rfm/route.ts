import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KREASI_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

function backendUrl(path: string) {
  return `${BACKEND_URL.replace(/\/$/, "")}/api/v1${path}`;
}

async function proxyJson(path: string, init?: RequestInit) {
  const response = await fetch(backendUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    next: init?.method && init.method !== "GET" ? undefined : { revalidate: 300 },
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "dashboard";
  searchParams.delete("resource");

  if (resource === "members") {
    const query = searchParams.toString();
    return proxyJson(`/rfm/members${query ? `?${query}` : ""}`);
  }

  return proxyJson("/rfm/dashboard");
}

export async function POST(request: Request) {
  const body = await request.text();
  return proxyJson("/rfm/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}
