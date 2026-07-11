import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend-url";

const paths = {
  confirm: "/cni/rfq-assistant/confirm",
  draft: "/cni/rfq-assistant/draft",
  voice: "/cni/rfq-assistant/voice",
} as const;

type AssistantAction = keyof typeof paths;

function isAssistantAction(value: string | null): value is AssistantAction {
  return value !== null && value in paths;
}

export async function POST(request: Request) {
  const action = new URL(request.url).searchParams.get("action");
  if (!isAssistantAction(action)) {
    return NextResponse.json(
      { detail: "Aksi assistant tidak dikenali." },
      { status: 400 },
    );
  }

  try {
    const isMultipart = action === "voice";
    const body = isMultipart ? await request.formData() : await request.text();
    const response = await fetch(getBackendApiUrl(paths[action]), {
      method: "POST",
      headers: isMultipart
        ? { Accept: "application/json" }
        : { Accept: "application/json", "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error
            ? error.message
            : "Layanan asisten RFQ belum dapat dihubungi.",
      },
      { status: 503 },
    );
  }
}
