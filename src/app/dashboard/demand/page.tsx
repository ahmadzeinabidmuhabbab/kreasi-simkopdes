"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type TabKey = "history" | "forecasting" | "trend";
type RfqStatus = "DIPROSES" | "DITOLAK";

interface Summary {
  totalRfq: number;
  approvedRfq: number;
  approvalRate: number;
  totalValue: number;
}

interface TopProduct {
  product: string;
  value: number;
  count: number;
}

interface RfqRecord {
  id: string;
  date: string;
  time: string;
  product: string;
  kopdesName: string;
  volume: number;
  unit: string;
  price: number;
  value: number;
  status: RfqStatus;
  source: string;
  confidence: number;
  deadline: string | null;
}

interface RfqDetail {
  id: string;
  date: string;
  time: string;
  product: string;
  category: string | null;
  kopdes: {
    id: string | null;
    name: string | null;
    address?: string | null;
    pic_name: string | null;
    pic_phone: string | null;
  };
  specifications: string[];
  volume: number;
  unit: string;
  price: number;
  value: number;
  currency: string;
  deadline: string | null;
  note: string | null;
  status: RfqStatus;
  source: string;
  confidence: number;
  conversation: Array<{
    sender_role?: string | null;
    sender_name: string | null;
    sender_phone: string | null;
    message: string;
    received_at: string;
    source: string;
  }>;
  enrichments: Array<{
    provider: string;
    summary: string | null;
    score: number | null;
    created_at: string;
  }>;
}

interface ForecastItem {
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
  }>;
  stock: {
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
  };
}

interface ForecastPayload {
  generatedAt: string;
  granularity: string;
  horizon: number;
  items: ForecastItem[];
}

interface ForecastAISummary {
  generated_at: string;
  granularity: string;
  horizon: number;
  commodities_analyzed: number;
  headline: string;
  summary: string;
  general_recommendation: string;
  priorities: Array<{
    title: string;
    detail: string;
    action: string;
    severity: "high" | "medium" | "low";
  }>;
  risks: string[];
}

interface TrendItem {
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

interface DemandPayload {
success: boolean;
message?: string;
summary?: Summary;
topProducts?: TopProduct[];
rfqHistory?: RfqRecord[];
forecast?: ForecastPayload;
trend?: TrendItem[];
}

function formatRupiah(value: number) {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("id-ID");
}

const statusMeta: Record<RfqStatus, { label: string; className: string; icon: string }> = {
  DIPROSES: {
    label: "Diproses",
    className: "bg-sky-100 text-sky-700 border-sky-200",
    icon: "hourglass_top",
  },
  DITOLAK: {
    label: "Ditolak",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: "cancel",
  },
};

function trendTone(value: string) {
  const text = value.toLowerCase();
  if (text.includes("up") || text.includes("increas") || text.includes("rising")) {
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  }
  if (text.includes("down") || text.includes("decreas")) {
    return "text-red-700 bg-red-50 border-red-200";
  }
  return "text-amber-700 bg-amber-50 border-amber-200";
}

function actionLabel(value: string) {
  const labels: Record<string, string> = {
    increase_procurement: "Naikkan pengadaan",
    increase_procurement_priority: "Naikkan prioritas pengadaan",
    monitor: "Monitor ketat",
    monitor_only: "Pantau rutin",
    monitor_stock_and_prepare_rfq: "Pantau stok dan siapkan RFQ",
    maintain_stock: "Jaga stok",
    review_supplier_availability: "Cek kesiapan pemasok",
    review_manually: "Review manual",
    manual_review: "Review manual",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function trendDirectionLabel(value: string) {
  const labels: Record<string, string> = {
    increasing: "Meningkat",
    decreasing: "Menurun",
    stable: "Stabil",
    volatile: "Fluktuatif",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function riskLevelLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Rendah",
    watchlist: "Perlu dipantau",
    high: "Tinggi",
    urgent: "Mendesak",
    normal: "Normal",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-sm rounded-xl border px-md py-sm text-sm font-semibold shadow-2xl ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="material-symbols-outlined text-[20px]">
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-xl text-center">
      <span className="material-symbols-outlined mb-sm text-5xl text-outline">inbox</span>
      <p className="font-bold text-on-surface">{title}</p>
<p className="mt-xs max-w-md text-sm text-on-surface-variant">{text}</p>
</div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-container ${className}`} aria-hidden="true" />;
}

function ForecastAISummarySkeleton() {
  return (
    <div className="mt-lg border-t border-white/15 pt-lg" role="status" aria-live="polite">
      <span className="sr-only">Membuat AI summary forecasting</span>
      <SkeletonBlock className="h-7 w-full max-w-xl bg-white/20" />
      <SkeletonBlock className="mt-md h-4 w-full bg-white/15" />
      <SkeletonBlock className="mt-xs h-4 w-11/12 bg-white/15" />
      <SkeletonBlock className="mt-xs h-4 w-4/5 bg-white/15" />
      <div className="mt-lg grid gap-md lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-sm">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border-t border-white/10 pt-sm first:border-t-0 first:pt-0">
              <SkeletonBlock className="h-4 w-36 bg-white/20" />
              <SkeletonBlock className="mt-xs h-3 w-full bg-white/15" />
              <SkeletonBlock className="mt-xs h-3 w-3/4 bg-white/15" />
            </div>
          ))}
        </div>
        <div className="border-l border-white/10 pl-md">
          <SkeletonBlock className="h-4 w-32 bg-white/20" />
          <SkeletonBlock className="mt-sm h-3 w-full bg-white/15" />
          <SkeletonBlock className="mt-xs h-3 w-5/6 bg-white/15" />
        </div>
      </div>
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4"
      role="status"
      aria-live="polite"
      aria-label="Memuat ringkasan demand"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex min-h-[92px] items-center gap-md rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm">
          <SkeletonBlock className="size-12 shrink-0 rounded-xl bg-surface-container-high" />
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="mt-sm h-7 w-24 rounded-lg bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TopProductsSkeleton() {
  const barHeights = ["h-16", "h-24", "h-32", "h-20", "h-28"];

  return (
    <div
      className="grid gap-md md:grid-cols-5"
      role="status"
      aria-live="polite"
      aria-label="Memuat produk paling banyak RFQ"
    >
      {barHeights.map((height, index) => (
        <div key={index} className="flex min-h-44 flex-col justify-end rounded-xl bg-surface-container-low p-sm">
          <SkeletonBlock className={`${height} rounded-t-lg bg-primary/20`} />
          <SkeletonBlock className="mx-auto mt-sm h-3 w-4/5 rounded-full" />
          <SkeletonBlock className="mx-auto mt-xs h-3 w-3/5 rounded-full bg-primary/15" />
        </div>
      ))}
    </div>
  );
}

function HistoryRowsSkeleton() {
  return (
    <div className="flex flex-col gap-sm" role="status" aria-live="polite" aria-label="Memuat history RFQ">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-md">
          <div className="flex flex-col gap-sm sm:flex-row sm:items-center">
            <SkeletonBlock className="h-4 w-28 rounded-full" />
            <SkeletonBlock className="h-4 w-44 rounded-full bg-surface-container-high" />
            <SkeletonBlock className="h-4 w-32 rounded-full" />
            <SkeletonBlock className="h-7 w-24 rounded-full bg-primary/15 sm:ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ForecastSkeleton() {
  return (
    <div className="grid gap-gutter lg:grid-cols-2" role="status" aria-live="polite" aria-label="Memuat data forecasting">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="rounded-2xl border border-primary/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary/5 p-md shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-md">
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-4 w-32 rounded-full bg-primary/15" />
              <SkeletonBlock className="mt-sm h-6 w-3/4 rounded-lg bg-surface-container-high" />
              <SkeletonBlock className="mt-xs h-4 w-44 rounded-full" />
            </div>
            <SkeletonBlock className="h-7 w-24 rounded-full bg-primary/10" />
          </div>
          <SkeletonBlock className="mt-md h-44 w-full rounded-2xl bg-surface-container" />
          <div className="mt-sm grid gap-xs sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, metricIndex) => (
              <div key={metricIndex} className="rounded-xl bg-surface-container-low p-sm">
                <SkeletonBlock className="h-3 w-16 rounded-full" />
                <SkeletonBlock className="mt-xs h-5 w-20 rounded-md bg-surface-container-high" />
              </div>
            ))}
          </div>
          <SkeletonBlock className="mt-sm h-4 w-full rounded-full" />
          <SkeletonBlock className="mt-xs h-4 w-4/5 rounded-full" />
        </article>
      ))}
    </div>
  );
}

function TrendSkeleton() {
  return (
    <div className="grid gap-gutter lg:grid-cols-2" role="status" aria-live="polite" aria-label="Memuat analisis trend">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-md">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-xs">
                <SkeletonBlock className="h-6 w-20 rounded-full bg-primary/15" />
                <SkeletonBlock className="h-6 w-24 rounded-full" />
              </div>
              <SkeletonBlock className="mt-sm h-6 w-56 max-w-full rounded-lg bg-surface-container-high" />
            </div>
            <SkeletonBlock className="h-20 w-44 rounded-xl bg-primary/10" />
          </div>
          <SkeletonBlock className="mt-md h-5 w-4/5 rounded-lg bg-surface-container-high" />
          <SkeletonBlock className="mt-sm h-4 w-full rounded-full" />
          <SkeletonBlock className="mt-xs h-4 w-5/6 rounded-full" />
          <div className="mt-md grid gap-sm sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, metricIndex) => (
              <div key={metricIndex} className="rounded-xl bg-surface-container-low p-sm">
                <SkeletonBlock className="h-3 w-14 rounded-full" />
                <SkeletonBlock className="mt-xs h-5 w-20 rounded-md bg-surface-container-high" />
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function trendDisplayName(value: string) {
  const labels: Record<string, string> = {
    increasing: "Naik",
    decreasing: "Turun",
    stable: "Stabil",
    flat: "Stabil",
  };
  return labels[value] ?? value;
}

function riskDisplayName(value: string) {
  const labels: Record<string, string> = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
    urgent: "Mendesak",
  };
  return labels[value] ?? value;
}

function forecastMonthlyTotal(item: ForecastItem) {
  if (item.forecast_average_qty !== null) return item.forecast_average_qty * 30;
  if (item.horizon > 0) return (item.forecast_total_qty / item.horizon) * 30;
  return item.forecast_total_qty;
}

function forecastInsightText(item: ForecastItem) {
  const methodCount = item.method_series.length || 1;
  const averageText =
    item.forecast_average_qty !== null
      ? `${formatNumber(item.forecast_average_qty)} ${item.stock.unit} per hari`
      : "belum tersedia";
  return (
    item.llm_recommendation.summary ||
      `Analisis memakai ${methodCount} metode perhitungan untuk membaca kebutuhan ${item.product_name}. ` +
      `Proyeksi total mencapai ${formatNumber(item.forecast_total_qty)} ${item.stock.unit}, ` +
      `dengan rata-rata ${averageText}. Angka ini membantu koperasi melihat apakah stok ` +
      `masih cukup untuk penjualan berikutnya, termasuk pola hari ramai dan perubahan mingguan. ` +
      `Stok tersedia saat ini ` +
      `${formatNumber(item.stock.available_quantity)} ${item.stock.unit} dengan cakupan ` +
      `${item.stock.coverage_days ?? 0} hari.`
  );
}

function MiniLineChart({ item }: { item: ForecastItem }) {
  const colors = ["#2e591f", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#64748b"];
  const series =
    item.method_series?.length > 0
      ? item.method_series.filter((entry) => entry.points.length > 0)
      : [
          {
            method: item.method,
            points: item.forecast_points,
            forecast_total_qty: item.forecast_total_qty,
            forecast_average_qty: item.forecast_average_qty,
            trend: item.trend,
            confidence: item.confidence,
            risk: item.risk,
          },
        ];
  const allValues = series.flatMap((entry) => entry.points.map((point) => point.forecast_quantity));
  const fallbackValue = item.forecast_average_qty ?? item.last_observed_total_qty;
  const min = Math.min(...(allValues.length ? allValues : [fallbackValue]));
  const max = Math.max(...(allValues.length ? allValues : [fallbackValue]));
  const range = max - min || Math.max(max, 1);
  const width = 420;
  const height = 168;
  const padding = { top: 14, right: 14, bottom: 22, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const yTicks = [max, min + range / 2, min];

  const pathFor = (points: Array<{ forecast_quantity: number }>) =>
    points
      .map((point, index) => {
        const x =
          padding.left +
          (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
        const y = padding.top + plotHeight - ((point.forecast_quantity - min) / range) * plotHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-44 w-full"
        role="img"
        aria-label={`Grafik forecasting multi metode ${item.product_name}`}
      >
        {yTicks.map((tick, index) => {
          const y = padding.top + plotHeight - ((tick - min) / range) * plotHeight;
          return (
            <g key={`${tick.toFixed(2)}-${index}`}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#d8ded0"
                strokeWidth="1"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-on-surface-variant text-[10px]">
                {formatNumber(tick)}
              </text>
            </g>
          );
        })}
        {series.map((entry, index) => (
          <path
            key={`${entry.method}-${index}-line`}
            d={pathFor(entry.points)}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth={entry.method === item.method ? 3.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={entry.method === item.method ? 1 : 0.72}
          />
        ))}
      </svg>
      <div className="mt-xs flex flex-wrap gap-xs">
        {series.map((entry, index) => (
          <span key={`${entry.method}-${index}-legend`} className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
        {entry.method}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrendSparkline({ item }: { item: TrendItem }) {
  const values =
    item.trend_points && item.trend_points.length > 1
      ? item.trend_points.map((point) => point.value)
      : fallbackTrendValues(item);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 150;
  const height = 56;
  const path = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const changePct =
    item.trend_change_pct ??
    (values[0] ? ((values[values.length - 1] - values[0]) / Math.max(values[0], 1)) * 100 : 0);
  const positive = changePct >= 0;

  return (
    <div className="min-w-[180px] rounded-xl border border-primary/10 bg-gradient-to-br from-primary/8 via-secondary-container/15 to-sky-100/70 p-sm">
      <div className="flex items-center justify-between gap-sm">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Tren 30 hari</p>
        <span className={`text-xs font-extrabold ${positive ? "text-primary" : "text-error"}`}>
          {positive ? "+" : ""}
          {changePct.toFixed(1)}%
        </span>
      </div>
      <svg className="mt-xs h-14 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Grafik tren ${item.commodity_name}`}>
        <path d={path} fill="none" stroke={positive ? "#2e591f" : "#ba1a1a"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={positive ? "rgba(46,89,31,0.12)" : "rgba(186,26,26,0.10)"} />
      </svg>
    </div>
  );
}

function fallbackTrendValues(item: TrendItem) {
  const base = Math.max(8, item.display_score);
  const direction = item.trend_direction;
  return Array.from({ length: 30 }, (_, index) => {
    const progress = index / 29;
    const wave = Math.sin(index / 3) * 4;
    if (direction === "increasing") return Math.max(0, base * (0.55 + progress * 0.65) + wave);
    if (direction === "decreasing") return Math.max(0, base * (1.15 - progress * 0.5) + wave);
    return Math.max(0, base + wave);
  });
}

function RfqDrawer({
  detail,
  loading,
  onClose,
}: {
  detail: RfqDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!loading && !detail) return null;
  if (typeof document === "undefined") return null;

  const drawer = (
    <div className="dashboard-demand-drawer fixed inset-0 z-[100]">
 <button className="dashboard-demand-drawer__scrim absolute inset-0 bg-black/55" aria-label="Tutup detail RFQ" onClick={onClose} />
      <aside className="dashboard-demand-drawer__panel absolute right-0 top-0 flex h-dvh w-[min(40rem,100vw)] max-w-full flex-col overflow-hidden border-l border-outline-variant/35 bg-surface-container-lowest shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-md border-b border-primary/10 bg-gradient-to-br from-primary/8 via-surface-container-lowest to-secondary-container/20 p-md">
 <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">Detail RFQ</p>
            <h2 className="mt-xs text-2xl font-extrabold leading-tight text-on-surface">
              {detail?.product ?? "Memuat detail..."}
            </h2>
 <p className="mt-xs break-words text-sm text-on-surface-variant">{detail?.id}</p>
          </div>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-outline-variant/30 bg-white/70 text-on-surface shadow-sm transition hover:bg-surface-container" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-md p-lg">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : detail ? (
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-md">
          <div className="grid gap-xs sm:grid-cols-3">
              {[
                ["Kopdes", detail.kopdes.name ?? "-"],
                ["PIC", detail.kopdes.pic_name ?? "-"],
                ["Jumlah", `${formatNumber(detail.volume)} ${detail.unit}`],
                ["Target Harga", formatRupiah(detail.price)],
                ["Nilai", formatRupiah(detail.value)],
                ["Sumber", detail.source],
              ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-outline-variant/25 bg-gradient-to-br from-surface-container-low to-white/70 p-sm shadow-[0_10px_26px_-22px_rgba(26,28,23,0.45)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
                  <p className="mt-xs text-sm font-bold text-on-surface">{value}</p>
                </div>
              ))}
            </div>

        <section className="mt-md">
          <div className="flex items-center justify-between gap-sm">
            <h3 className="text-sm font-extrabold text-on-surface">Data Riwayat Pesan</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase text-primary">
              WhatsApp
            </span>
          </div>
          <div className="dashboard-demand-drawer__chat mt-sm space-y-sm rounded-2xl border border-primary/10 bg-[#e7f5df] p-sm">
                {detail.conversation.length === 0 ? (
            <p className="rounded-xl bg-surface-container-low p-md text-sm text-on-surface-variant">
              Belum ada data riwayat pesan yang tersimpan untuk RFQ ini.
                  </p>
                ) : (
            detail.conversation.map((chat, index) => {
              const isBot = chat.sender_role === "bot";
              return (
                <div
                  key={`${chat.received_at}-${index}`}
                  className={`dashboard-demand-drawer__bubble max-w-[86%] rounded-2xl p-sm shadow-sm ring-1 ${
                    isBot
                      ? "mr-auto rounded-tl-sm bg-[#f7fff3] ring-primary/10"
                      : "ml-auto rounded-tr-sm bg-white ring-primary/15"
                  }`}
                >
                  <div className="mb-xs flex items-center justify-between gap-sm">
                    <p className={`text-[11px] font-extrabold ${isBot ? "text-secondary" : "text-primary"}`}>
                      {chat.sender_name ?? (isBot ? "Bot WhatsApp Koperasi" : "Pengirim")}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">
                      {new Date(chat.received_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-on-surface">{chat.message}</p>
                </div>
              );
            })
                )}
              </div>
            </section>

        <section className="mt-md">
          <h3 className="text-sm font-extrabold text-on-surface">Catatan</h3>
          <p className="mt-sm rounded-xl border border-outline-variant/20 bg-surface-container-low px-md py-sm text-sm leading-relaxed text-on-surface-variant">
                {detail.note ?? "Tidak ada catatan tambahan."}
              </p>
              {detail.enrichments.length > 0 && (
                <div className="mt-sm space-y-sm">
                  {detail.enrichments.map((item, index) => (
                    <div key={`${item.provider}-${item.created_at ?? "unknown"}-${index}`} className="rounded-xl border border-outline-variant/30 p-md">
                      <p className="text-xs font-bold uppercase text-primary">{item.provider}</p>
                      <p className="mt-xs text-sm text-on-surface-variant">{item.summary ?? "Tidak ada ringkasan."}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default function DemandIntelligence() {
  const [activeTab, setActiveTab] = useState<TabKey>("history");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [rfqHistory, setRfqHistory] = useState<RfqRecord[]>([]);
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
const [trend, setTrend] = useState<TrendItem[]>([]);
const [loading, setLoading] = useState(true);
const [forecastLoading, setForecastLoading] = useState(false);
const [trendLoading, setTrendLoading] = useState(false);
const [aiSummary, setAiSummary] = useState<ForecastAISummary | null>(null);
const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
const [aiSummaryError, setAiSummaryError] = useState<string | null>(null);
const [filterStatus, setFilterStatus] = useState<"SEMUA" | RfqStatus>("SEMUA");
  const [selectedRfq, setSelectedRfq] = useState<RfqDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3600);
  }, []);

const fetchRfqDashboard = useCallback(async () => {
setLoading(true);
try {
      const response = await fetch("/api/demand?scope=rfq", { cache: "no-store" });
      const data = (await response.json()) as DemandPayload;
      if (!response.ok || !data.success) {
        throw new Error(data.message ?? "Gagal memuat demand dashboard");
      }
      setSummary(data.summary ?? null);
      setTopProducts(data.topProducts ?? []);
setRfqHistory(data.rfqHistory ?? []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

const fetchForecastData = useCallback(async () => {
setForecastLoading(true);
try {
const response = await fetch("/api/demand?scope=forecast");
const data = (await response.json()) as DemandPayload;
if (!response.ok || !data.success || !data.forecast) {
throw new Error(data.message ?? "Gagal memuat data forecasting");
}
setForecast(data.forecast);
} catch (error) {
showToast(error instanceof Error ? error.message : "Gagal memuat data forecasting", "error");
} finally {
setForecastLoading(false);
}
}, [showToast]);

const fetchTrendData = useCallback(async () => {
if (trend.length > 0) return;
setTrendLoading(true);
try {
const response = await fetch("/api/demand?scope=trend");
const data = (await response.json()) as DemandPayload;
if (!response.ok || !data.success || !data.trend) {
throw new Error(data.message ?? "Gagal memuat data trend");
}
setTrend(data.trend);
} catch (error) {
showToast(error instanceof Error ? error.message : "Gagal memuat data trend", "error");
} finally {
setTrendLoading(false);
}
}, [showToast, trend.length]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRfqDashboard();
  }, [fetchRfqDashboard]);

useEffect(() => {
if (activeTab === "forecasting" && !forecast && !forecastLoading) {
// eslint-disable-next-line react-hooks/set-state-in-effect
void fetchForecastData();
}
if (activeTab === "trend" && trend.length === 0 && !trendLoading) {
void fetchTrendData();
}
}, [activeTab, fetchForecastData, fetchTrendData, forecast, forecastLoading, trend.length, trendLoading]);

  const filteredHistory = useMemo(() => {
    return filterStatus === "SEMUA"
      ? rfqHistory
      : rfqHistory.filter((item) => item.status === filterStatus);
  }, [filterStatus, rfqHistory]);

  const openDetail = async (rfqId: string) => {
    setDrawerLoading(true);
    setSelectedRfq(null);
    try {
      const response = await fetch(`/api/demand?rfqId=${encodeURIComponent(rfqId)}`, { cache: "no-store" });
      const data = (await response.json()) as { success: boolean; detail?: RfqDetail; message?: string };
      if (!response.ok || !data.success || !data.detail) {
        throw new Error(data.message ?? "Detail RFQ tidak ditemukan");
      }
      setSelectedRfq(data.detail);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Gagal membuka detail RFQ", "error");
      setSelectedRfq(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  const generateAISummary = async () => {
    setAiSummaryLoading(true);
    setAiSummaryError(null);
    try {
      const response = await fetch("/api/forecast-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granularity: forecast?.granularity ?? "daily", horizon: forecast?.horizon ?? 14 }),
      });
      const data = (await response.json()) as {
        success: boolean;
        summary?: ForecastAISummary;
        message?: string;
      };
      if (!response.ok || !data.success || !data.summary) {
        throw new Error(data.message ?? "AI summary belum dapat dibuat");
      }
      setAiSummary(data.summary);
    } catch (error) {
      setAiSummaryError(error instanceof Error ? error.message : "AI summary belum dapat dibuat");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const topTrendItems = trend.slice(0, 20);

  return (
    <div className="dashboard-page dashboard-page-demand mx-auto w-full max-w-[1440px] space-y-lg pb-2xl">
      {toast && <Toast message={toast.message} type={toast.type} />}
      <RfqDrawer detail={selectedRfq} loading={drawerLoading} onClose={() => setSelectedRfq(null)} />

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm">
        <div className="flex flex-col gap-md lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-md">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-on-surface">AI Demand Intelligence</h1>
              <p className="mt-xs text-sm text-on-surface-variant">
                RFQ database, forecasting statistik, dan analisis trend eksternal DKI Jakarta.
              </p>
            </div>
          </div>
          <button
onClick={() => fetchRfqDashboard()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-xs rounded-xl border border-outline-variant/40 bg-surface-container-low px-md py-2 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container hover:text-primary disabled:opacity-60"
          >
          <span className="material-symbols-outlined text-[18px]">sync</span>
            Refresh Data
          </button>
        </div>
      </div>

      {loading && !summary ? (
        <SummaryCardsSkeleton />
      ) : summary ? (
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total RFQ Diajukan", value: summary.totalRfq, icon: "receipt_long", color: "bg-primary/10 text-primary" },
 { label: "RFQ Diproses", value: summary.approvedRfq, icon: "hourglass_top", color: "bg-sky-100 text-sky-700" },
 { label: "Rasio Diproses", value: `${summary.approvalRate}%`, icon: "percent", color: "bg-secondary-container/35 text-on-secondary-container" },
            { label: "Total Nilai RFQ", value: formatRupiah(summary.totalValue), icon: "payments", color: "bg-amber-100 text-amber-700" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-md rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm">
              <div className={`grid h-12 w-12 place-items-center rounded-xl ${item.color}`}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {item.icon}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">{item.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-on-surface">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <section className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm">
        <p className="mb-md text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">Produk Paling Banyak RFQ</p>
        {loading && topProducts.length === 0 ? (
          <TopProductsSkeleton />
        ) : topProducts.length === 0 ? (
          <EmptyState title="Belum ada produk RFQ" text="Produk teratas akan muncul setelah RFQ tersimpan di database." />
        ) : (
          <div className="grid gap-md md:grid-cols-5">
            {topProducts.map((item, index) => {
              const maxCount = Math.max(...topProducts.map((product) => product.count), 1);
              const height = Math.max(30, (item.count / maxCount) * 120);
              return (
                <div key={item.product} className="flex min-h-44 flex-col justify-end rounded-xl bg-surface-container-low p-sm">
                  <div
                    className="rounded-t-lg bg-primary transition-all"
                    style={{ height, opacity: Math.max(0.42, 1 - index * 0.12) }}
                    aria-hidden="true"
                  />
                  <p className="mt-sm line-clamp-2 text-center text-xs font-extrabold text-on-surface">{item.product}</p>
                  <p className="mt-1 text-center text-[11px] font-bold text-primary">
                    {item.count} RFQ · {formatRupiah(item.value)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <nav
        className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-low p-1 shadow-sm"
        aria-label="Navigasi fitur demand"
      >
        <div className="inline-flex max-w-full flex-wrap gap-xs">
          {[
            { key: "history", label: "History RFQ", icon: "history" },
            { key: "forecasting", label: "Forecasting", icon: "monitoring" },
            { key: "trend", label: "Analisis Trend", icon: "travel_explore" },
          ].map((tab) => {
            const selected = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabKey)}
                aria-pressed={selected}
                className={`inline-flex min-h-11 items-center gap-xs rounded-xl px-md py-2 text-left transition ${
                  selected
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                    selected ? "bg-white/15 text-white" : "bg-surface-container-lowest text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                </span>
                <span className="whitespace-nowrap text-sm font-extrabold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === "history" && (
        <section className="space-y-md">
          <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-on-surface">History RFQ</h2>
              <p className="text-sm text-on-surface-variant">Data RFQ langsung dari tabel database backend.</p>
            </div>
            <div className="flex flex-wrap gap-xs">
{(["SEMUA", "DIPROSES", "DITOLAK"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-xl px-md py-2 text-[11px] font-extrabold transition ${
                    filterStatus === status ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {status === "SEMUA" ? "Semua" : statusMeta[status].label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
          <HistoryRowsSkeleton />
          ) : filteredHistory.length === 0 ? (
            <EmptyState title="Belum ada RFQ" text="Data RFQ akan muncul setelah ada request yang diproses dari backend." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/25 bg-surface-container">
                    {["Tanggal", "Produk", "Kopdes", "Volume", "Harga Satuan", "Total Nilai", "Sumber", "Status", "Detail"].map((header) => (
                      <th key={header} className="px-sm py-2 text-left text-[11px] font-extrabold uppercase tracking-wide text-on-surface-variant">
                        {header}
                      </th>
                    ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((rfq) => {
                      const meta = statusMeta[rfq.status];
                      return (
                      <tr key={rfq.id} className="border-b border-outline-variant/10 transition hover:bg-surface-container-low">
                        <td className="px-sm py-2.5 whitespace-nowrap">
                          <p className="text-xs font-bold text-on-surface">{rfq.date}</p>
                          <p className="text-[10px] text-on-surface-variant">{rfq.time}</p>
                        </td>
                        <td className="px-sm py-2.5 font-bold text-on-surface">{rfq.product}</td>
                        <td className="px-sm py-2.5 text-on-surface-variant">{rfq.kopdesName}</td>
                        <td className="px-sm py-2.5 font-semibold text-on-surface whitespace-nowrap">
                          {formatNumber(rfq.volume)} {rfq.unit}
                        </td>
                        <td className="px-sm py-2.5 font-semibold text-on-surface whitespace-nowrap">{formatRupiah(rfq.price)}</td>
                        <td className="px-sm py-2.5 font-extrabold text-primary whitespace-nowrap">{formatRupiah(rfq.value)}</td>
                        <td className="px-sm py-2.5">
                          <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">{rfq.source}</span>
                        </td>
                        <td className="px-sm py-2.5">
                          <span className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold ${meta.className}`}>
                            <span className="material-symbols-outlined text-[15px] leading-none">{meta.icon}</span>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-sm py-2.5">
                          <button
                            onClick={() => openDetail(rfq.id)}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-extrabold text-white transition hover:bg-primary/90"
                          >
                            <span className="material-symbols-outlined text-[15px] leading-none">open_in_new</span>
                            Detail
                          </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "forecasting" && (
        <section className="space-y-lg">
        <div className="grid gap-gutter">
            <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-[#2f5d25] to-[#18350f] p-lg text-white shadow-[0_18px_48px_-30px_rgba(24,53,15,0.85)]">
              <div className="flex flex-col gap-md md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-white/70">Ringkasan AI</p>
                  <h2 className="mt-xs text-xl font-extrabold">Forecasting Seluruh Komoditas</h2>
                </div>
                <button
                  onClick={generateAISummary}
                  disabled={aiSummaryLoading || forecastLoading || !forecast}
                  className="inline-flex min-h-12 items-center justify-center gap-xs rounded-xl bg-white px-md py-2 text-sm font-extrabold text-primary shadow-sm transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-primary disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Generate AI summary forecasting"
                >
                  <span className={`material-symbols-outlined text-[20px] ${aiSummaryLoading ? "animate-spin" : ""}`}>
                    {aiSummaryLoading ? "autorenew" : "auto_awesome"}
                  </span>
                  {aiSummaryLoading ? "Menganalisis" : aiSummary ? "Generate Ulang" : "Generate AI Summary"}
                </button>
              </div>

              {aiSummaryLoading && <ForecastAISummarySkeleton />}

              {!aiSummaryLoading && aiSummaryError && (
                <div className="mt-lg flex flex-col gap-sm border-t border-red-200/25 pt-lg sm:flex-row sm:items-center sm:justify-between" role="alert">
                  <div className="flex items-start gap-sm">
                    <span className="material-symbols-outlined mt-0.5 text-[20px] text-red-200">error</span>
                    <p className="text-sm font-semibold text-white">{aiSummaryError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={generateAISummary}
                    className="inline-flex min-h-11 items-center justify-center gap-xs border border-white/30 px-md py-2 text-sm font-extrabold text-white transition hover:bg-white/10"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Coba Lagi
                  </button>
                </div>
              )}

              {!aiSummaryLoading && aiSummary && (
                <div className="mt-lg border-t border-white/15 pt-lg">
                  <div className="flex flex-col gap-xs sm:flex-row sm:items-end sm:justify-between">
                    <h3 className="max-w-3xl text-xl font-extrabold leading-tight text-white">{aiSummary.headline}</h3>
                    <p className="shrink-0 text-xs font-semibold text-white/65">
                      {aiSummary.commodities_analyzed} komoditas · {aiSummary.horizon} periode
                    </p>
                  </div>
                  <p className="mt-md max-w-5xl text-sm leading-relaxed text-white">{aiSummary.summary}</p>

                  <div className="mt-lg grid gap-lg lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-white/65">Prioritas Tindakan</p>
                      <div className="mt-sm divide-y divide-white/10">
                        {aiSummary.priorities.map((priority, index) => (
                          <div key={`${priority.title}-${index}`} className="grid gap-xs py-sm first:pt-0 sm:grid-cols-[28px_1fr]">
                            <span className="grid size-7 place-items-center rounded-lg bg-white/12 text-xs font-extrabold text-white">
                              {index + 1}
                            </span>
                            <div>
                              <div className="flex flex-wrap items-center gap-xs">
                                <h4 className="text-sm font-extrabold text-white">{priority.title}</h4>
                                <span className={`size-2 rounded-full ${priority.severity === "high" ? "bg-amber-300" : priority.severity === "medium" ? "bg-sky-300" : "bg-emerald-300"}`} aria-label={`Prioritas ${priority.severity}`} />
                              </div>
                              <p className="mt-xs text-sm leading-relaxed text-white">{priority.detail}</p>
                              <p className="mt-xs text-sm font-bold text-lime-200">{priority.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-md lg:border-l lg:border-t-0 lg:pl-lg lg:pt-0">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-white/65">Rekomendasi Umum</p>
                      <p className="mt-sm text-sm font-semibold leading-relaxed text-white">{aiSummary.general_recommendation}</p>
                      {aiSummary.risks.length > 0 && (
                        <div className="mt-md border-t border-white/10 pt-md">
                          <p className="text-xs font-extrabold uppercase tracking-wider text-white/65">Perlu Diperhatikan</p>
                          <ul className="mt-sm space-y-sm">
                            {aiSummary.risks.map((risk, index) => (
                              <li key={`${risk}-${index}`} className="flex gap-xs text-sm leading-relaxed text-white">
                                <span className="material-symbols-outlined mt-0.5 text-[17px] text-amber-300">warning</span>
                                <span>{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
</div>

          {forecastLoading ? (
            <ForecastSkeleton />
          ) : (
            <div className="grid gap-gutter lg:grid-cols-2">
              {(forecast?.items ?? []).slice(0, 6).map((item, index) => (
                <article
                  key={`${item.product_name}-${item.method}-${index}`}
                  className="rounded-2xl border border-primary/10 bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-primary/5 p-md shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <h3 className="font-extrabold text-on-surface">{item.product_name}</h3>
                      <p className="mt-xs text-xs text-on-surface-variant">
                        Ringkasan kebutuhan barang, stok tersedia, dan tindakan restock.
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${trendTone(item.trend)}`}>{trendDisplayName(item.trend)}</span>
                  </div>
                  <div className="mt-md">
                    <MiniLineChart item={item} />
                  </div>
                  <div className="mt-sm grid gap-xs sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-primary/10 bg-primary/8 p-sm">
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant">Prediksi 1 Bulan</p>
                      <p className="mt-xs font-extrabold text-on-surface">
                        {formatNumber(forecastMonthlyTotal(item))} {item.stock.unit}
                      </p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-sm">
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant">Stok</p>
                      <p className="mt-xs font-extrabold text-on-surface">{formatNumber(item.stock.available_quantity)} {item.stock.unit}</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-sm">
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant">Cakupan</p>
                      <p className="mt-xs font-extrabold text-on-surface">{item.stock.coverage_days ?? 0} hari</p>
                    </div>
                    <div className="rounded-xl bg-surface-container-low p-sm">
                      <p className="text-[10px] font-bold uppercase text-on-surface-variant">Risiko</p>
                      <p className="mt-xs font-extrabold text-on-surface">{riskDisplayName(item.llm_recommendation.risk_level)}</p>
                    </div>
                  </div>
                  <p className="mt-sm text-sm leading-relaxed text-on-surface-variant">{forecastInsightText(item)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "trend" && (
        <section className="space-y-md">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Analisis Trend</h2>
            <p className="text-sm text-on-surface-variant">
              Ringkasan Google Trends 30 hari dan Google Search/news untuk 10-20 komoditas utama DKI Jakarta.
            </p>
          </div>

{topTrendItems.length === 0 ? (
            trendLoading ? (
              <TrendSkeleton />
) : (
<EmptyState
title="Summary trend belum tersedia"
text="Jalankan fetch external demand dan LLM summary di backend untuk menampilkan analisis trend komoditas."
/>
) 
) : (
            <div className="grid gap-gutter lg:grid-cols-2">
              {topTrendItems.map((item, index) => (
                <article key={`${item.commodity_id}-${index}`} className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm">
 <div className="flex flex-wrap items-start justify-between gap-md">
 <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-xs">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold uppercase text-primary">
                          {item.source_badge.toUpperCase()}
                        </span>
                        <span className="rounded-full bg-surface-container px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">
                          {item.region}
                        </span>
                      </div>
                      <h3 className="mt-sm text-lg font-extrabold text-on-surface">{item.commodity_name}</h3>
 </div>
 <TrendSparkline item={item} />
</div>
                  <h4 className="mt-md font-extrabold text-on-surface">{item.headline}</h4>
                  <p className="mt-sm text-sm leading-relaxed text-on-surface-variant">{item.summary_text}</p>
                  <div className="mt-md grid gap-sm sm:grid-cols-3">
 <div className="rounded-xl bg-primary/8 p-sm">
<p className="text-[10px] font-bold uppercase text-on-surface-variant">Pertumbuhan</p>
 <p className="mt-xs font-extrabold text-on-surface">{trendDirectionLabel(item.trend_direction)}</p>
</div>
 <div className="rounded-xl bg-secondary-container/20 p-sm">
 <p className="text-[10px] font-bold uppercase text-on-surface-variant">Tingkat Risiko</p>
 <p className="mt-xs font-extrabold text-on-surface">{riskLevelLabel(item.risk_level)}</p>
</div>
 <div className="rounded-xl bg-sky-100/80 p-sm">
<p className="text-[10px] font-bold uppercase text-on-surface-variant">Rekomendasi</p>
<p className="mt-xs font-extrabold text-on-surface">{actionLabel(item.recommended_action)}</p>
                    </div>
                  </div>
                  {item.citations.length > 0 && (
                    <div className="mt-md border-t border-outline-variant/20 pt-sm">
                      <p className="mb-xs text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">Sumber berita</p>
                      <div className="space-y-xs">
                        {item.citations.slice(0, 3).map((citation, index) => (
                          <a
                            key={`${citation.url || citation.title || "citation"}-${index}`}
                            href={citation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-start gap-xs text-xs font-semibold text-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-[14px]">article</span>
                            <span>{citation.title || citation.source_domain || citation.url}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

