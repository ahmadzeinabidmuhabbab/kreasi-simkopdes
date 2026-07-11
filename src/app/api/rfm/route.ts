import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend-url";

function backendUrl(path: string) {
  return getBackendApiUrl(path);
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
