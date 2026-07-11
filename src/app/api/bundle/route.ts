import { NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/backend-url";

function backendUrl(path: string) {
  return getBackendApiUrl(path);
}

function fallbackDashboard() {
  const inventory = [
    {
      id: 1,
      name: "Beras medium 5 kg",
      unit: "5 kg",
      stock: 417,
      minStock: 926,
      reorderPoint: 602,
      velocity: 462.87,
      restock: 1018,
      status: "Kritis",
      category: "Sembako",
      price: 78000,
      associationCount: 0,
      associationRank: 999,
    },
    {
      id: 2,
      name: "Minyak goreng 1 liter",
      unit: "1 liter",
      stock: 260,
      minStock: 640,
      reorderPoint: 416,
      velocity: 318.4,
      restock: 700,
      status: "Kritis",
      category: "Sembako",
      price: 22000,
      associationCount: 0,
      associationRank: 999,
    },
  ];

  return {
    success: true,
    inventory,
    bundles: [],
    dynamicPricing: [],
    associationRules: [],
    planogram: {
      success: true,
      layoutSpec: {
        shelfCount: 2,
        rowsPerShelf: 3,
        columnsPerRow: 6,
        slotFormat: "S{shelf}R{row}C{column}",
        rowMapping: { R1: "top", R2: "eye-level", R3: "bottom" },
      },
      scenarios: [
        {
          scenarioId: "CUSTOM",
          name: "Custom Manual Manager",
          objective: "Fallback manual planogram saat backend belum tersedia.",
          editable: true,
          layoutSlots: [],
        },
      ],
    },
    notes: ["Fallback frontend aktif karena backend smart-bundle belum merespons."],
  };
}

function fallbackBootstrap() {
  return {
    success: true,
    dashboard: fallbackDashboard(),
    frontendBundles: { success: true, data: [] },
    commodityPrices: {
      success: true,
      generatedAt: new Date(0).toISOString(),
      items: [],
    },
  };
}

async function proxyJson<T = unknown>(path: string, init?: RequestInit) {
  const response = await fetch(backendUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: init?.method && init.method !== "GET" ? undefined : "no-store",
  });
  const data = (await response.json()) as T;
  return NextResponse.json(data, { status: response.status });
}

function appendQuery(path: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

const resourcePath = {
  dashboard: "/smart-bundle/dashboard",
  bootstrap: "/smart-bundle/bootstrap",
  products: "/smart-bundle/products",
  bundles: "/smart-bundle/bundles",
  "frontend-bundles": "/smart-bundle/frontend-bundles",
  "commodity-prices": "/smart-bundle/commodity-prices",
  "dynamic-pricing": "/smart-bundle/dynamic-pricing",
  "association-rules": "/smart-bundle/association-rules",
  "planogram-scenarios": "/smart-bundle/planogram/scenarios",
  "planogram-suggestions": "/smart-bundle/planogram/suggestions",
  "planogram-llm-context": "/smart-bundle/planogram/llm-context",
} as const satisfies Record<string, `/${string}`>;

type BundleResource = keyof typeof resourcePath;

function isBundleResource(resource: string): resource is BundleResource {
  return resource in resourcePath;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "dashboard";
  searchParams.delete("resource");

  if (!isBundleResource(resource)) {
    return NextResponse.json(
      { success: false, detail: `Unknown bundle resource: ${resource}` },
      { status: 400 },
    );
  }
  const path = resourcePath[resource];

  try {
    return await proxyJson(appendQuery(path, searchParams));
  } catch (error) {
    if (resource === "bootstrap") {
      return NextResponse.json(fallbackBootstrap());
    }
    if (resource === "dashboard") {
      return NextResponse.json(fallbackDashboard());
    }
    return NextResponse.json(
      {
        success: false,
        detail: error instanceof Error ? error.message : "Backend bundle service unavailable",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") ?? "validate-planogram-drop";

  if (resource === "refresh-commodity-prices") {
    const body = await request.text();
    try {
      return await proxyJson("/smart-bundle/commodity-prices/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body || JSON.stringify({ limit: 20 }),
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          detail: error instanceof Error ? error.message : "Backend commodity price refresh unavailable",
        },
        { status: 503 },
      );
    }
  }

  if (resource !== "validate-planogram-drop") {
    return NextResponse.json(
      { success: false, detail: `Unknown bundle action: ${resource}` },
      { status: 400 },
    );
  }

  const body = await request.text();
  try {
    return await proxyJson("/smart-bundle/planogram/drop-validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        detail: error instanceof Error ? error.message : "Backend drop validation unavailable",
      },
      { status: 503 },
    );
  }
}
