import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend-url";

function backendUrl(path: string) {
  return getBackendApiUrl(path);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  try {
    const response = await fetch(backendUrl(`/transactions${query ? `?${query}` : ""}`), {
      headers: { Accept: "application/json" },
      next: { revalidate: 10 },
    });
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: response.ok
        ? { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" }
        : undefined,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        detail: "Backend transaksi tidak dapat dihubungi.",
      },
      { status: 502 },
    );
  }
}
