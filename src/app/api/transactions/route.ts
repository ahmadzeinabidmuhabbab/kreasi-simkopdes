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
      cache: "no-store",
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
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
