import { NextResponse } from "next/server";

import { getBackendApiUrl } from "@/lib/backend-url";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      granularity?: string;
      horizon?: number;
    };
    const response = await fetch(getBackendApiUrl("/cni/forecast/ai-summary"), {
      method: "POST",
      cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        granularity: body.granularity ?? "daily",
        horizon: body.horizon ?? 14,
      }),
    });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: data?.detail ?? "AI summary belum dapat dibuat",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true, summary: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Layanan AI summary tidak tersedia";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
