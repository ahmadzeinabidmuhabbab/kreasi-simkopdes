import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KREASI_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

function backendUrl(path: string) {
  return `${BACKEND_URL.replace(/\/$/, "")}/api/v1${path}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();

  try {
    const response = await fetch(backendUrl(`/stock${query ? `?${query}` : ""}`), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        success: false,
        detail: "Backend stok tidak dapat dihubungi.",
      },
      { status: 502 },
    );
  }
}
