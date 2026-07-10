import { NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KREASI_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

type BackendRFQStatus = "open" | "in_review" | "closed" | "cancelled";
type UiRFQStatus = "DIPROSES" | "DITOLAK";

interface BackendRFQItem {
  rfq_id: string;
  kopdes_name: string | null;
  item_produk: string;
  jumlah: number | null;
  satuan: string | null;
  target_harga: number | null;
  batas_akhir: string | null;
  status: BackendRFQStatus;
  source: string;
  confidence_score: number;
  created_at: string;
}

interface BackendRFQDetail {
  rfq_id: string;
  kopdes: {
    id: string | null;
    name: string | null;
    address?: string | null;
    pic_name: string | null;
    pic_phone: string | null;
  };
  item: {
    kategori: string | null;
    nama: string;
    spesifikasi: string[];
    jumlah: number | null;
    satuan: string | null;
    target_harga: number | null;
    mata_uang: string;
  };
  batas_akhir: string | null;
  catatan: string | null;
  conversation?: Array<{
    sender_role?: string | null;
    sender_name: string | null;
    sender_phone: string | null;
    message: string;
    received_at: string;
    source: string;
  }>;
  source: string;
  confidence_score: number;
  status: BackendRFQStatus;
  enrichments: Array<{
    provider: string;
    summary: string | null;
    score: number | null;
    payload: Record<string, unknown>;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface BackendLLMForecastItem {
  product_name: string;
  granularity: string;
  horizon: number;
  method: string;
  demand_type: string;
  forecast_total_qty: number;
  forecast_average_qty: number | null;
  last_observed_total_qty: number;
  change_pct_vs_recent: number | null;
  trend: string;
  seasonality: string;
  confidence: string;
  risk: string;
  recommended_action: string;
  statistical_reason: string;
  model_notes: string[];
  metrics: Record<string, number | null>;
  forecast_points: Array<{
    date: string;
    forecast_quantity: number;
    lower_bound: number | null;
    upper_bound: number | null;
  }>;
  method_series: Array<{
    method: string;
    forecast_total_qty: number;
    forecast_average_qty: number | null;
    trend: string;
    confidence: string;
    risk: string;
    points: Array<{
      date: string;
      forecast_quantity: number;
      lower_bound: number | null;
      upper_bound: number | null;
    }>;
    metrics: Record<string, number | null>;
  }>;
  stock: {
    product_name: string;
    region: string;
    unit: string;
    on_hand_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    reorder_point: number;
    safety_stock: number;
    avg_daily_sales: number | null;
    coverage_days: number | null;
    status: string;
    source: string;
  };
  llm_recommendation: {
    headline: string;
    summary: string;
    recommendation: string;
    recommended_action: string;
    risk_level: string;
    stock_action: string;
    prompt_context: Record<string, unknown>;
  };
}

interface BackendProductForecast {
  product_name: string;
  recommended_method: string;
  forecast_points: Array<{
    date: string;
    forecast_quantity: number;
    lower_bound: number | null;
    upper_bound: number | null;
  }>;
}

interface BackendTrendItem {
  commodity_id: string;
  commodity_name: string;
  category: string;
  region: string;
  source_badge: string;
  display_score: number;
  display_score_label: string;
  headline: string;
  summary_text: string;
  trend_direction: string;
  risk_level: string;
  recommended_action: string;
  confidence: number;
  citations: Array<{ title: string; url: string; source_domain: string | null }>;
  trend_points?: Array<{ date: string; value: number }>;
  trend_change_pct?: number | null;
  created_at: string | null;
}

interface BackendExternalDemandItem {
  commodity_id: string;
  commodity_name: string;
  category: string;
  region: string;
  trend_score: number;
  news_severity_score: number;
  external_demand_score: number;
  signal_category: string;
  trend_direction: string;
  news_risk: string;
  created_at: string | null;
}

interface DashboardPayload {
success: true;
summary?: {
totalRfq: number;
approvedRfq: number;
approvalRate: number;
totalValue: number;
};
topProducts?: Array<{ product: string; value: number; count: number }>;
rfqHistory?: Array<ReturnType<typeof mapRfqItem>>;
forecast?: Awaited<ReturnType<typeof getForecast>>;
trend?: Awaited<ReturnType<typeof getTrendSummaries>>;
}

function apiUrl(path: string) {
  return `${BACKEND_URL.replace(/\/$/, "")}/api/v1${path}`;
}

async function fetchJson<T>(path: string, revalidate = 300): Promise<T> {
const response = await fetch(apiUrl(path), {
next: { revalidate },
headers: { Accept: "application/json" },
});
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

function mapStatus(status: BackendRFQStatus): UiRFQStatus {
  if (status === "cancelled") return "DITOLAK";
  return "DIPROSES";
}

function mapSource(source: string) {
  const normalized = source.replaceAll("_", " ").trim();
  if (normalized.toLowerCase().includes("whatsapp")) return "WhatsApp";
  if (normalized.toLowerCase().includes("voice")) return "Voice";
  if (normalized.toLowerCase().includes("trend")) return "Google Trends";
  return normalized || "Input Manual";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: `${date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })} WIB`,
  };
}

function mapRfqItem(item: BackendRFQItem) {
  const dateTime = formatDateTime(item.created_at);
  const volume = Number(item.jumlah ?? 0);
  const price = Number(item.target_harga ?? 0);
  return {
    id: item.rfq_id,
    date: dateTime.date,
    time: dateTime.time,
    product: item.item_produk,
    kopdesName: item.kopdes_name ?? "-",
    volume,
    unit: item.satuan ?? "-",
    price,
    value: volume * price,
    status: mapStatus(item.status),
    source: mapSource(item.source),
    confidence: Math.round(Number(item.confidence_score ?? 0) * 100),
    deadline: item.batas_akhir,
  };
}

function mapRfqDetail(detail: BackendRFQDetail) {
  const dateTime = formatDateTime(detail.created_at);
  return {
    id: detail.rfq_id,
    date: dateTime.date,
    time: dateTime.time,
    product: detail.item.nama,
    category: detail.item.kategori,
    kopdes: detail.kopdes,
    specifications: detail.item.spesifikasi,
    volume: detail.item.jumlah ?? 0,
    unit: detail.item.satuan ?? "-",
    price: detail.item.target_harga ?? 0,
    value: (detail.item.jumlah ?? 0) * (detail.item.target_harga ?? 0),
    currency: detail.item.mata_uang,
    deadline: detail.batas_akhir,
    note: detail.catatan,
    status: mapStatus(detail.status),
    source: mapSource(detail.source),
    confidence: Math.round(detail.confidence_score * 100),
    conversation: detail.conversation ?? [],
    enrichments: detail.enrichments,
  };
}

async function getRfqs() {
  const data = await fetchJson<{
    data: BackendRFQItem[];
    pagination: { total: number };
  }>("/cni/rfq?per_page=100&sort=created_at&order=desc");
  return data.data.map(mapRfqItem);
}

function actionLabelFromBackend(value: string) {
  const labels: Record<string, string> = {
    increase_procurement: "Naikkan pengadaan",
    maintain_stock: "Pertahankan stok",
    reduce_procurement: "Kurangi pengadaan",
    review_manually: "Tinjau manual",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

async function getForecast() {
  try {
    const context = await fetchJson<{
      generated_at: string;
      granularity: string;
      horizon: number;
      items: BackendLLMForecastItem[];
    }>("/cni/forecast/dashboard-context?granularity=daily&limit=8");

    return {
      generatedAt: context.generated_at,
      granularity: context.granularity,
      horizon: context.horizon,
      items: context.items,
    };
  } catch {
    return getForecastFallback();
  }
}

async function getForecastFallback() {
  try {
    const context = await fetchJson<{
      generated_at: string;
      granularity: string;
      horizon: number;
      items: Array<Omit<BackendLLMForecastItem, "forecast_points" | "method_series" | "stock" | "llm_recommendation">>;
    }>("/cni/forecast/llm-context?granularity=daily&limit=8");

    const details = await Promise.allSettled(
      context.items.map((item) =>
        fetchJson<BackendProductForecast>(
          `/cni/forecast/products/${encodeURIComponent(item.product_name)}?granularity=daily`
        )
      )
    );

    return {
      generatedAt: context.generated_at,
      granularity: context.granularity,
      horizon: context.horizon,
      items: context.items.map((item, index) => {
        const detail = details[index];
        const forecastPoints =
          detail.status === "fulfilled" ? detail.value.forecast_points : [];
        const availableStock = Math.max(item.last_observed_total_qty * 1.6, item.forecast_total_qty * 0.8);

        return {
          ...item,
          forecast_points: forecastPoints,
          method_series: [
            {
              method: item.method,
              forecast_total_qty: item.forecast_total_qty,
              forecast_average_qty: item.forecast_average_qty,
              trend: item.trend,
              confidence: item.confidence,
              risk: item.risk,
              points: forecastPoints,
              metrics: item.metrics,
            },
          ],
          stock: {
            product_name: item.product_name,
            region: "DKI Jakarta",
            unit: "pcs",
            on_hand_quantity: availableStock,
            reserved_quantity: 0,
            available_quantity: availableStock,
            reorder_point: Math.max(item.forecast_total_qty * 0.45, 1),
            safety_stock: Math.max(item.forecast_total_qty * 0.2, 1),
            avg_daily_sales: item.forecast_average_qty,
            coverage_days: item.forecast_average_qty
              ? Number((availableStock / item.forecast_average_qty).toFixed(1))
              : null,
            status: "preview",
            source: "llm_context_fallback",
          },
          llm_recommendation: {
            headline: `${item.product_name}: konteks demand tersedia`,
            summary: item.statistical_reason,
            recommendation: actionLabelFromBackend(item.recommended_action),
            recommended_action: item.recommended_action,
            risk_level: item.risk,
            stock_action: item.recommended_action,
            prompt_context: {},
          },
        } satisfies BackendLLMForecastItem;
      }),
    };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      granularity: "daily",
      horizon: 7,
      items: [] as BackendLLMForecastItem[],
    };
  }
}

async function getTrendSummaries() {
  let llmItems: BackendTrendItem[] = [];
  try {
    const data = await fetchJson<{ items: BackendTrendItem[] }>(
      "/cni/external-demand/llm-summaries/latest?region=DKI%20Jakarta&limit=20"
    );
    llmItems = data.items;
    if (llmItems.length >= 10) return enrichTrendItems(llmItems);
  } catch {
    // Fall through to raw external demand summary when LLM cards are not generated yet.
  }

  try {
    const raw = await fetchJson<{ items: BackendExternalDemandItem[] }>(
      "/cni/external-demand/summary?region=DKI%20Jakarta&limit=20"
    );
    const llmIds = new Set(llmItems.map((item) => item.commodity_id));
    const fallbackItems: BackendTrendItem[] = raw.items
      .filter((item) => !llmIds.has(item.commodity_id))
      .map((item) => ({
      commodity_id: item.commodity_id,
      commodity_name: item.commodity_name,
      category: item.category,
      region: item.region,
      source_badge: "Google Trends + News",
      display_score: item.external_demand_score,
      display_score_label: "Trend & News Signal",
      headline:
        item.trend_direction === "increasing"
          ? `Minat pencarian ${item.commodity_name} meningkat`
          : item.trend_direction === "decreasing"
            ? `Minat pencarian ${item.commodity_name} mulai menurun`
            : `Sinyal kebutuhan ${item.commodity_name} relatif stabil`,
      summary_text: [
        `Google Trends menunjukkan arah ${item.trend_direction} untuk ${item.commodity_name} di ${item.region}.`,
        `Sinyal Google Search/news berada pada risiko ${item.news_risk}, terutama terkait isu kebutuhan, stok, harga, atau kelangkaan komoditas.`,
        "Koperasi dapat memakai sinyal ini sebagai bahan monitoring stok dan persiapan pengadaan jika indikasi permintaan terus menguat.",
      ].join(" "),
      trend_direction: item.trend_direction,
      risk_level: item.news_risk,
      recommended_action:
        item.external_demand_score >= 65
          ? "increase_procurement"
          : item.external_demand_score >= 45
            ? "monitor"
            : "maintain_stock",
      confidence: Math.min(1, Math.max(0.35, item.external_demand_score / 100)),
      citations: [],
      created_at: item.created_at,
    }));
    return enrichTrendItems([...llmItems, ...fallbackItems].slice(0, 20));
  } catch {
    return enrichTrendItems(llmItems);
  }
}

async function enrichTrendItems(items: BackendTrendItem[]) {
return items.map((item) => {
const trendPoints = item.trend_points?.length
? item.trend_points.map((point) => ({
date: point.date,
value: Number(point.value),
}))
: fallbackTrendPoints(item);

return {
...item,
trend_points: trendPoints,
trend_change_pct: trendChangePct(trendPoints),
};
});
}

function trendChangePct(points: Array<{ value: number }>) {
  if (points.length < 2) return 0;
  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;
  return first ? Number((((last - first) / Math.max(first, 1)) * 100).toFixed(1)) : 0;
}

function fallbackTrendPoints(item: BackendTrendItem) {
  const base = Math.max(8, Number(item.display_score || 0));
  return Array.from({ length: 30 }, (_, index) => {
    const progress = index / 29;
    const wave = Math.sin(index / 3) * 4;
    const value =
      item.trend_direction === "increasing"
        ? base * (0.55 + progress * 0.65) + wave
        : item.trend_direction === "decreasing"
          ? base * (1.15 - progress * 0.5) + wave
          : base + wave;
    return {
      date: new Date(Date.now() - (29 - index) * 86_400_000).toISOString().slice(0, 10),
      value: Number(Math.max(0, value).toFixed(2)),
    };
  });
}

function topProductsFromRfqs(rfqs: Array<ReturnType<typeof mapRfqItem>>) {
  const productMap = new Map<string, { product: string; value: number; count: number }>();
  for (const item of rfqs) {
    const existing = productMap.get(item.product) ?? {
      product: item.product,
      value: 0,
      count: 0,
    };
    existing.value += item.value;
    existing.count += 1;
    productMap.set(item.product, existing);
  }
return [...productMap.values()]
.sort((a, b) => b.count - a.count || b.value - a.value)
.slice(0, 5);
}

function buildRfqPayload(rfqHistory: Array<ReturnType<typeof mapRfqItem>>) {
const totalRfq = rfqHistory.length;
const approvedRfq = rfqHistory.filter((item) => item.status === "DIPROSES").length;
const approvalRate = totalRfq ? Math.round((approvedRfq / totalRfq) * 100) : 0;
const totalValue = rfqHistory.reduce((total, item) => total + item.value, 0);

return {
summary: { totalRfq, approvedRfq, approvalRate, totalValue },
topProducts: topProductsFromRfqs(rfqHistory),
rfqHistory,
};
}

export async function GET(request: Request) {
const { searchParams } = new URL(request.url);
const rfqId = searchParams.get("rfqId");
const scope = searchParams.get("scope") ?? "rfq";

  try {
    if (rfqId) {
      const detail = await fetchJson<BackendRFQDetail>(`/cni/rfq/${encodeURIComponent(rfqId)}`);
      return NextResponse.json({ success: true, detail: mapRfqDetail(detail) });
    }

if (scope === "forecast") {
return NextResponse.json({ success: true, forecast: await getForecast() } satisfies DashboardPayload);
}

if (scope === "trend") {
return NextResponse.json({ success: true, trend: await getTrendSummaries() } satisfies DashboardPayload);
}

if (scope === "all") {
const [rfqHistory, forecast, trend] = await Promise.all([getRfqs(), getForecast(), getTrendSummaries()]);
return NextResponse.json({
success: true,
...buildRfqPayload(rfqHistory),
forecast,
trend,
} satisfies DashboardPayload);
}

const rfqHistory = await getRfqs();
return NextResponse.json({ success: true, ...buildRfqPayload(rfqHistory) } satisfies DashboardPayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown demand API error";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string; productNames?: string[] };
    if (body.action !== "generateForecast") {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const response = await fetch(apiUrl("/cni/forecast/runs"), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        granularity: "daily",
        horizon: 14,
        product_names: body.productNames?.length ? body.productNames : undefined,
        methods: ["MA_3", "MA_5", "MA_7", "ETS", "PROPHET_STYLE", "SBA"],
        persist: true,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data?.detail ?? "Forecast generation failed" },
        { status: response.status }
      );
    }
    return NextResponse.json({ success: true, forecastRun: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown forecast generation error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
