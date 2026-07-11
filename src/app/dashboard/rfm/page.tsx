"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type SortOrder = "asc" | "desc";
type SortField =
  | "customer_name"
  | "recency"
  | "frequency"
  | "monetary"
  | "last_purchase"
  | "churn_prediction"
  | "clv_prediction";

interface Recommendations {
  marketing: string;
  product: string;
  pricing: string;
  credit: string;
  relationship: string;
}

interface Segment {
  key: string;
  name: string;
  customers: number;
  percentage: number;
  avg_recency_days: number;
  avg_frequency: number;
  avg_monetary_idr: number;
  total_monetary_idr: number;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  rfm_score: string;
  customer_profiling: string;
  recommendations: Recommendations;
  churn_prediction_ge70_frequency: number;
  clv_prediction_ge70_frequency: number;
  churn_prediction_ge70_rate: number;
  clv_prediction_ge70_rate: number;
  avg_churn_prediction: number;
  avg_clv_prediction: number;
  churn_prediction_llm_analysis: string;
  clv_prediction_llm_analysis: string;
}

interface Member {
  id: string;
  customer_name: string;
  last_purchase: string | null;
  recency: number;
  frequency: number;
  monetary: number;
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  rfm_score: string;
  segment: string;
  churn_prediction: number;
  clv_prediction: number;
  churn_prediction_llm_analysis: string;
  clv_prediction_llm_analysis: string;
}

interface DashboardPayload {
  success: boolean;
  total_customers: number;
  segments: Segment[];
  detail?: string;
}

interface MembersPayload {
  success: boolean;
  items: Member[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  detail?: string;
}

interface FloatingMetric {
  label: string;
  value: ReactNode;
  icon: string;
  tone?: "primary" | "amber" | "danger" | "success";
  delay?: number;
}

type MetricTone = NonNullable<FloatingMetric["tone"]>;

const metricDescriptions: Record<string, string> = {
  "total anggota": "Jumlah seluruh anggota yang menjadi basis perhitungan segmentasi RFM aktif.",
  "segmen aktif": "Jumlah kelompok perilaku anggota yang terbentuk dari kombinasi skor Recency, Frequency, dan Monetary.",
  "avg churn": "Rata-rata probabilitas anggota dalam segmen berhenti atau tidak kembali bertransaksi.",
  "avg clv": "Rata-rata prediksi Customer Lifetime Value, yaitu potensi nilai anggota sepanjang hubungan dengan koperasi.",
  target: "Jumlah anggota pada segmen terpilih yang menjadi sasaran rekomendasi aksi.",
  rfm: "Gabungan skor Recency, Frequency, dan Monetary yang merangkum perilaku transaksi segmen.",
  avg: "Rata-rata nilai transaksi anggota pada segmen terpilih.",
  churn: "Rata-rata risiko anggota pada segmen terpilih untuk berhenti atau tidak kembali bertransaksi.",
  clv: "Rata-rata prediksi potensi nilai jangka panjang anggota pada segmen terpilih.",
  prioritas: "Jumlah anggota dengan prediksi churn minimal 70% yang perlu ditangani lebih dahulu.",
  "high clv": "Jumlah anggota dengan prediksi CLV minimal 70% yang memiliki potensi nilai tinggi.",
  recency: "Skor kebaruan transaksi. Skor 5 menunjukkan anggota bertransaksi paling baru.",
  frequency: "Skor frekuensi transaksi. Skor 5 menunjukkan anggota paling sering bertransaksi.",
  monetary: "Skor nilai transaksi. Skor 5 menunjukkan kontribusi nilai transaksi paling tinggi.",
  "nilai segmen": "Estimasi total nilai transaksi yang dihasilkan seluruh anggota pada segmen terpilih.",
  "churn prioritas": "Jumlah anggota dengan probabilitas churn minimal 70% pada segmen terpilih.",
  "clv prioritas": "Jumlah anggota dengan prediksi CLV minimal 70% pada segmen terpilih.",
  anggota: "Jumlah anggota yang termasuk dalam segmen RFM yang sedang dipilih.",
  proporsi: "Persentase anggota segmen terpilih dibandingkan seluruh anggota yang dianalisis.",
};

function DataLabel({ label, className = "" }: { label: string; className?: string }) {
  const description = metricDescriptions[label.toLocaleLowerCase("id-ID")];

  if (!description) return <span className={className}>{label}</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`inline-flex cursor-help items-center gap-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className}`} aria-label={`${label}: tampilkan penjelasan`}>
          <span>{label}</span>
          <MaterialIcon className="!text-[13px] opacity-65" aria-hidden="true">info</MaterialIcon>
        </button>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}

interface SegmentVisual {
  color: string;
  bg: string;
  border: string;
  accent: string;
  icon: string;
}

const segmentVisuals: Record<string, SegmentVisual> = {
  champions: {
    color: "#2e591f",
    bg: "bg-primary/8",
    border: "border-primary/25",
    accent: "from-primary/12 via-surface-container-lowest to-primary/5",
    icon: "military_tech",
  },
  loyal_customers: {
    color: "#2563eb",
    bg: "bg-sky-50",
    border: "border-sky-200",
    accent: "from-sky-100/90 via-surface-container-lowest to-primary/5",
    icon: "star",
  },
  potential_loyalists: {
    color: "#795900",
    bg: "bg-secondary-container/25",
    border: "border-secondary-container/55",
    accent: "from-secondary-container/30 via-surface-container-lowest to-primary/5",
    icon: "trending_up",
  },
  new_customers: {
    color: "#7c3aed",
    bg: "bg-violet-50",
    border: "border-violet-200",
    accent: "from-violet-100/80 via-surface-container-lowest to-surface-container-low",
    icon: "person_add",
  },
  promising: {
    color: "#0d9488",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    accent: "from-cyan-100/80 via-surface-container-lowest to-primary/5",
    icon: "rocket_launch",
  },
  need_attention: {
    color: "#ca8a04",
    bg: "bg-amber-50",
    border: "border-amber-200",
    accent: "from-amber-100/85 via-surface-container-lowest to-secondary-container/15",
    icon: "notifications_active",
  },
  about_to_sleep: {
    color: "#ea580c",
    bg: "bg-orange-50",
    border: "border-orange-200",
    accent: "from-orange-100/85 via-surface-container-lowest to-secondary-container/15",
    icon: "bedtime",
  },
  at_risk: {
    color: "#ba1a1a",
    bg: "bg-error-container/55",
    border: "border-error/25",
    accent: "from-error-container/70 via-surface-container-lowest to-surface-container-low",
    icon: "warning",
  },
  cant_lose_them: {
    color: "#be123c",
    bg: "bg-rose-50",
    border: "border-rose-200",
    accent: "from-rose-100/85 via-surface-container-lowest to-error-container/25",
    icon: "workspace_premium",
  },
  lost: {
    color: "#64748b",
    bg: "bg-surface-container",
    border: "border-outline-variant/50",
    accent: "from-surface-container-high via-surface-container-lowest to-surface-container-low",
    icon: "person_off",
  },
};

const defaultVisual: SegmentVisual = {
  color: "#2e591f",
  bg: "bg-primary/5",
  border: "border-primary/20",
  accent: "from-primary/10 via-surface-container-lowest to-surface-container-low",
  icon: "groups",
};

const pillars: Array<{ key: keyof Recommendations; label: string; icon: string; goal: string }> = [
  { key: "marketing", label: "Marketing", icon: "campaign", goal: "Meningkatkan penjualan" },
  { key: "product", label: "Product", icon: "inventory_2", goal: "Meningkatkan kecocokan produk" },
  { key: "pricing", label: "Pricing", icon: "local_offer", goal: "Mengoptimalkan keuntungan" },
  { key: "credit", label: "Credit", icon: "credit_card", goal: "Mendukung pembiayaan sehat" },
  { key: "relationship", label: "Relationship", icon: "diversity_3", goal: "Meningkatkan retensi anggota" },
];

function formatRupiah(value: number) {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function visualFor(segment: Segment) {
  return segmentVisuals[segment.key] ?? defaultVisual;
}

function MaterialIcon({
  children,
  className = "",
  filled = false,
  style,
}: {
  children: string;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ ...style, fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {children}
    </span>
  );
}

function LoadingState() {
  return (
    <div
      className="flex min-h-[220px] w-full items-center justify-center rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Memuat data RFM"
    >
      <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
        <span className="size-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true" />
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-lowest p-xl text-center">
      <MaterialIcon filled className="mb-sm text-5xl text-outline">
        groups
      </MaterialIcon>
      <p className="font-bold text-on-surface">{title}</p>
      <p className="mt-xs max-w-md text-sm text-on-surface-variant">{text}</p>
    </div>
  );
}

function DonutChart({
  segments,
  selectedKey,
  onSelect,
}: {
  segments: Segment[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.customers, 0);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative grid place-items-center py-xs">
      <svg viewBox="0 0 240 240" className="size-56 2xl:size-60" role="img" aria-label="Distribusi anggota berdasarkan segmen RFM">
        <circle cx="120" cy="120" r={radius} fill="none" className="stroke-outline-variant/25" strokeWidth="22" />
        {segments.map((segment, index) => {
          const offset = segments.slice(0, index).reduce((sum, current) => sum + current.customers, 0);
          const value = total ? segment.customers / total : 0;
          const dash = value * circumference;
          const gap = circumference - dash;
          const rotation = total ? (offset / total) * 360 - 90 : -90;
          const selected = segment.key === selectedKey;

          return (
            <circle
              key={segment.key}
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke={visualFor(segment).color}
              strokeWidth={selected ? 28 : 22}
              strokeDasharray={`${dash} ${gap}`}
              strokeLinecap="butt"
              transform={`rotate(${rotation} 120 120)`}
              className="cursor-pointer transition-all focus:outline-none"
              opacity={selected ? 1 : 0.72}
              role="button"
              tabIndex={0}
              aria-label={`Pilih segmen ${segment.name}`}
              onClick={() => onSelect(segment.key)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(segment.key);
                }
              }}
            />
          );
        })}
        <circle cx="120" cy="120" r="58" className="fill-surface-container-lowest" />
      <text x="120" y="115" textAnchor="middle" className="fill-on-surface text-[16px] font-extrabold">
        {total.toLocaleString("id-ID")}
      </text>
      <text x="120" y="136" textAnchor="middle" className="fill-on-surface-variant text-[12px] font-bold">
        Total Anggota
      </text>
      </svg>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const normalizedValue = Math.max(0, Math.min(5, value));

  return (
    <div>
      <div className="mb-xs flex items-center justify-between">
        <DataLabel label={label} className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant" />
        <p className="text-xs font-extrabold text-primary">{normalizedValue}/5</p>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className={`h-2 rounded-full ${index < normalizedValue ? "bg-primary" : "bg-outline-variant/30"}`} />
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  helper: string;
  icon: string;
  tone?: "primary" | "amber" | "danger" | "success";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-secondary-container/30 text-on-secondary-container",
    danger: "bg-error-container/70 text-error",
    success: "bg-primary-fixed/55 text-on-primary-fixed-variant",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-outline-variant/25 bg-surface-container-lowest px-sm py-2 shadow-sm">
      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
        <MaterialIcon filled className="text-xl">
          {icon}
        </MaterialIcon>
      </div>
      <div className="min-w-0">
        <DataLabel label={label} className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant" />
        <p className="mt-0.5 truncate text-xl font-extrabold text-on-surface">{value}</p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{helper}</p>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-outline-variant/20 bg-white/75 px-2.5 py-1.5 text-center shadow-sm">
      <p className="whitespace-nowrap text-[clamp(1.1rem,1.45vw,1.45rem)] font-extrabold leading-none text-on-surface">{value}</p>
      <DataLabel label={label} className="mt-0.5 text-xs font-bold uppercase text-on-surface-variant" />
    </div>
  );
}

function metricToneStyles(tone: MetricTone) {
  return {
    primary: {
      surface: "border-primary/18 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-primary/5",
      floating: "border-primary/18 bg-primary/8",
      icon: "bg-primary/10 text-primary",
    },
    amber: {
      surface: "border-amber-200/70 bg-gradient-to-br from-amber-50 via-surface-container-lowest to-secondary-container/20",
      floating: "border-amber-200/70 bg-amber-50/90",
      icon: "bg-secondary-container/45 text-on-secondary-container",
    },
    danger: {
      surface: "border-error/20 bg-gradient-to-br from-error-container/45 via-surface-container-lowest to-error-container/15",
      floating: "border-error/20 bg-error-container/45",
      icon: "bg-error-container/70 text-error",
    },
    success: {
      surface: "border-primary-fixed/60 bg-gradient-to-br from-primary-fixed/40 via-surface-container-lowest to-primary/6",
      floating: "border-primary-fixed/65 bg-primary-fixed/45",
      icon: "bg-primary-fixed/60 text-on-primary-fixed-variant",
    },
  }[tone];
}

function FloatingMetricCard({
  label,
  value,
  icon,
  tone = "primary",
  delay = 0,
  className = "",
}: FloatingMetric & { className?: string }) {
  const toneStyle = metricToneStyles(tone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: [0, -7, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.35, delay },
        scale: { duration: 0.35, delay },
        y: { duration: 3.4, repeat: Infinity, ease: "easeInOut", delay },
      }}
      className={`rounded-xl border px-2.5 py-1.5 shadow-[0_18px_38px_-28px_rgba(26,28,23,0.65)] backdrop-blur ${toneStyle.floating} ${className}`}
    >
      <div className="flex items-center gap-xs">
        <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${toneStyle.icon}`}>
          <MaterialIcon filled className="text-[18px]">
            {icon}
          </MaterialIcon>
        </span>
        <div className="min-w-0">
          <DataLabel label={label} className="text-[10px] font-extrabold uppercase leading-tight text-on-surface-variant" />
          <p className="truncate text-base font-extrabold leading-tight text-on-surface">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function InlineMetricRow({ metrics }: { metrics: FloatingMetric[] }) {
  if (metrics.length === 0) return null;

  return (
    <div className="mt-sm grid gap-xs sm:hidden">
      {metrics.map((metric) => (
        <FloatingMetricCard key={metric.label} {...metric} className="w-full" />
      ))}
    </div>
  );
}

function InsightCard({
  title,
  icon,
  metrics = [],
  children,
}: {
  title: string;
  icon: string;
  metrics?: FloatingMetric[];
  children: ReactNode;
}) {
  const toneStyle = metricToneStyles(metrics[0]?.tone ?? "primary");

  return (
    <div className={`relative overflow-visible rounded-2xl border p-xs shadow-sm sm:px-sm sm:pb-sm sm:pt-14 ${toneStyle.surface}`}>
      {metrics.length > 0 ? (
        <div className="absolute -top-4 right-md hidden gap-xs sm:flex">
          {metrics.map((metric) => (
            <FloatingMetricCard key={metric.label} {...metric} className="min-w-32" />
          ))}
        </div>
      ) : null}
      <div className="mb-xs flex items-center gap-xs">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${toneStyle.icon}`}>
          <MaterialIcon filled className="text-[20px]">
            {icon}
          </MaterialIcon>
        </span>
        <p className="text-sm font-extrabold text-on-surface">{title}</p>
      </div>
      <div className="rounded-xl border border-outline-variant/18 bg-white px-sm py-xs text-sm leading-normal text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        {children}
      </div>
      <InlineMetricRow metrics={metrics} />
    </div>
  );
}

function SortButton({
  field,
  active,
  order,
  onSort,
  children,
}: {
  field: SortField;
  active: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
  children: ReactNode;
}) {
  const activeField = active === field;

  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center gap-xs rounded-lg text-[13px] font-extrabold uppercase text-current transition hover:text-white/90 focus:outline-none focus:ring-2 focus:ring-white/45"
      onClick={() => onSort(field)}
      aria-label={`Urutkan berdasarkan ${String(children)}`}
    >
      {children}
      <MaterialIcon className="text-[16px]">
        {activeField ? (order === "asc" ? "keyboard_arrow_up" : "keyboard_arrow_down") : "unfold_more"}
      </MaterialIcon>
    </button>
  );
}

function ProbabilityBadge({ value, priority, kind }: { value: number; priority: boolean; kind: "churn" | "clv" }) {
  const className = priority
    ? kind === "churn"
      ? "border-error/25 bg-error-container/60 text-error"
      : "border-primary/25 bg-primary/10 text-primary"
    : "border-outline-variant/25 bg-surface-container text-on-surface";

  return <span className={`inline-flex rounded-lg border px-2 py-1 text-xs font-extrabold ${className}`}>{formatPercent(value)}</span>;
}

function paginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages];
  if (currentPage >= totalPages - 2) return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];

  return [1, "ellipsis", currentPage, "ellipsis", totalPages];
}

export default function RfmSegmentation() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [selectedKey, setSelectedKey] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersTotalPages, setMembersTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortField>("customer_name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [error, setError] = useState<string | null>(null);

  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.key === selectedKey) ?? segments[0],
    [segments, selectedKey],
  );

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rfm", { cache: "no-store" });
      const data = (await response.json()) as DashboardPayload;
      if (!response.ok || !data.success) throw new Error(data.detail ?? "Gagal memuat RFM dashboard");

      setSegments(data.segments);
      setTotalCustomers(data.total_customers);
      setSelectedKey((current) => current || data.segments[0]?.key || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat RFM dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);

    try {
      const params = new URLSearchParams({
        resource: "members",
        page: String(page),
        page_size: String(pageSize),
        sort_by: sortBy,
        order: sortOrder,
      });
      if (search.trim()) params.set("search", search.trim());
      if (selectedKey) params.set("segment", selectedKey);

      const response = await fetch(`/api/rfm?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as MembersPayload;
      if (!response.ok || !data.success) throw new Error(data.detail ?? "Gagal memuat daftar anggota");

      setMembers(data.items);
      setMembersTotal(data.total);
      setMembersTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat daftar anggota");
    } finally {
      setMembersLoading(false);
    }
  }, [page, pageSize, search, selectedKey, sortBy, sortOrder]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedKey) void fetchMembers();
  }, [fetchMembers, selectedKey]);

  const handleSelectSegment = (key: string) => {
    setSelectedKey(key);
    setPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      setPage(1);
      return;
    }

    setSortBy(field);
    setSortOrder("asc");
    setPage(1);
  };

  if (loading) return <LoadingState />;

  if (error && segments.length === 0) {
    return (
      <div className="dashboard-page mx-auto max-w-[1280px] rounded-2xl border border-error/25 bg-error-container/55 p-lg text-error">
        <p className="font-extrabold">RFM dashboard gagal dimuat</p>
        <p className="mt-xs text-sm">{error}</p>
      </div>
    );
  }

  if (!selectedSegment) {
    return <EmptyState title="Segmentasi belum tersedia" text="Data RFM akan muncul setelah backend mengirim daftar segmen anggota." />;
  }

  const visual = visualFor(selectedSegment);
  const totalSegmentValue = selectedSegment.total_monetary_idr || selectedSegment.avg_monetary_idr * selectedSegment.customers;
  const avgChurn = formatPercent(selectedSegment.avg_churn_prediction);
  const avgClv = formatPercent(selectedSegment.avg_clv_prediction);
  const segmentShare = `${selectedSegment.percentage.toFixed(1)}%`;
  const firstVisibleMember = membersTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisibleMember = Math.min(page * pageSize, membersTotal);
  const currentPaginationItems = paginationItems(page, membersTotalPages);
  const recommendationMetrics: Record<keyof Recommendations, FloatingMetric> = {
    marketing: {
      label: "target",
      value: selectedSegment.customers.toLocaleString("id-ID"),
      icon: "groups",
      tone: "primary",
      delay: 0,
    },
    product: {
      label: "RFM",
      value: selectedSegment.rfm_score,
      icon: "bar_chart",
      tone: "success",
      delay: 0.12,
    },
    pricing: {
      label: "avg",
      value: formatRupiah(selectedSegment.avg_monetary_idr),
      icon: "payments",
      tone: "amber",
      delay: 0.24,
    },
    credit: {
      label: "churn",
      value: avgChurn,
      icon: "warning",
      tone: "danger",
      delay: 0.36,
    },
    relationship: {
      label: "CLV",
      value: avgClv,
      icon: "workspace_premium",
      tone: "success",
      delay: 0.48,
    },
  };
  const churnInsightMetrics: FloatingMetric[] = [
    {
      label: "prioritas",
      value: selectedSegment.churn_prediction_ge70_frequency.toLocaleString("id-ID"),
      icon: "person_alert",
      tone: "danger",
      delay: 0.08,
    },
    {
      label: "avg churn",
      value: avgChurn,
      icon: "trending_up",
      tone: "amber",
      delay: 0.22,
    },
  ];
  const clvInsightMetrics: FloatingMetric[] = [
    {
      label: "high CLV",
      value: selectedSegment.clv_prediction_ge70_frequency.toLocaleString("id-ID"),
      icon: "diamond",
      tone: "success",
      delay: 0.12,
    },
    {
      label: "avg CLV",
      value: avgClv,
      icon: "monitoring",
      tone: "primary",
      delay: 0.28,
    },
  ];

  return (
    <TooltipProvider>
    <div className="dashboard-page dashboard-page-rfm mx-auto w-full max-w-[1440px] space-y-lg pb-2xl">
      {error ? (
        <div className="rounded-xl border border-error/25 bg-error-container/55 p-md text-sm font-semibold text-error">{error}</div>
      ) : null}

      <header className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-lg shadow-sm">
        <div className="flex flex-col gap-md xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-md">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MaterialIcon filled className="text-3xl">
                groups
              </MaterialIcon>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                Customer intelligence
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-on-surface">Behavioral Segmentation RFM</h1>
              <p className="mt-xs max-w-3xl text-sm text-on-surface-variant">
                Profil anggota berbasis Recency, Frequency, Monetary, churn risk, dan CLV untuk prioritas aksi koperasi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchDashboard()}
            className="inline-flex min-h-12 self-start items-center justify-center gap-xs rounded-xl border border-outline-variant/25 bg-surface-container px-md py-2 text-sm font-extrabold text-on-surface transition hover:bg-surface-container-high xl:self-auto"
          >
            <MaterialIcon className="text-[20px]">sync</MaterialIcon>
            Refresh
          </button>
        </div>
      </header>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-sm">
        <KpiCard label="Total Anggota" value={totalCustomers.toLocaleString("id-ID")} helper="basis segmentasi aktif" icon="groups" />
        <KpiCard label="Segmen Aktif" value={segments.length} helper="cluster perilaku anggota" icon="hub" tone="amber" />
        <KpiCard label="Avg Churn" value={avgChurn} helper="rata-rata risiko segmen" icon="warning" tone="danger" />
        <KpiCard label="Avg CLV" value={avgClv} helper="rata-rata potensi nilai" icon="workspace_premium" tone="success" />
      </section>

      <section className="grid gap-gutter lg:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-sm shadow-sm">
          <div className="flex items-center justify-between gap-sm">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">Distribusi Segmen</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">Pilih segmen untuk membaca profil dan rekomendasi.</p>
            </div>
            <span className="rounded-lg bg-surface-container px-2 py-1 text-xs font-extrabold text-on-surface-variant">
              {segments.length} segmen
            </span>
          </div>

          <DonutChart segments={segments} selectedKey={selectedKey} onSelect={handleSelectSegment} />

          <div className="mt-sm flex flex-col gap-1">
            {segments.map((segment) => {
              const segmentVisual = visualFor(segment);
              const active = selectedKey === segment.key;

              return (
                <button
                  key={segment.key}
                  type="button"
                  onClick={() => handleSelectSegment(segment.key)}
                className={`flex min-h-10 items-center justify-between gap-sm rounded-xl border px-sm py-1.5 text-left transition ${
                  active ? `${segmentVisual.bg} ${segmentVisual.border} shadow-sm` : "border-transparent hover:bg-surface-container"
                }`}
                >
                  <div className="flex min-w-0 items-center gap-sm">
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: segmentVisual.color }} />
                    <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-on-surface">{segment.name}</p>
                    <p className="text-xs text-on-surface-variant">RFM {segment.rfm_score}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                  <p className="text-sm font-extrabold text-on-surface">{segment.customers.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-on-surface-variant">{segment.percentage.toFixed(1)}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-md">
          <section className={`rounded-2xl border bg-gradient-to-br p-md shadow-sm ${visual.accent} ${visual.border}`}>
            <div className="grid gap-md xl:grid-cols-[auto_minmax(0,1fr)_minmax(15rem,18rem)] xl:items-start">
              <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-white/75 shadow-[0_14px_34px_-24px_rgba(26,28,23,0.58)] sm:size-24">
                <MaterialIcon filled className="!text-[3.4rem] leading-none sm:!text-[4rem]" style={{ color: visual.color }}>
                  {visual.icon}
                </MaterialIcon>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">
                  RFM {selectedSegment.rfm_score}
                </p>
                <h2 className="mt-0.5 text-2xl font-extrabold text-on-surface">{selectedSegment.name}</h2>
                <p className="mt-sm max-w-4xl text-sm leading-relaxed text-on-surface-variant">{selectedSegment.customer_profiling}</p>
              </div>

              <div className="grid w-full grid-cols-2 gap-xs">
                <MetricPill label="Anggota" value={selectedSegment.customers.toLocaleString("id-ID")} />
                <MetricPill label="Proporsi" value={segmentShare} />
              </div>
            </div>

            <div className="mt-sm grid gap-sm md:grid-cols-3">
              <ScoreBar label="Recency" value={selectedSegment.recency_score} />
              <ScoreBar label="Frequency" value={selectedSegment.frequency_score} />
              <ScoreBar label="Monetary" value={selectedSegment.monetary_score} />
            </div>
          </section>

          <section className="grid gap-sm lg:grid-cols-3">
            <KpiCard
              label="Nilai Segmen"
              value={formatRupiah(totalSegmentValue)}
              helper="estimasi total transaksi"
              icon="payments"
            />
            <KpiCard
              label="Churn Prioritas"
              value={selectedSegment.churn_prediction_ge70_frequency.toLocaleString("id-ID")}
              helper={`${formatPercent(selectedSegment.churn_prediction_ge70_rate)} anggota berisiko tinggi`}
              icon="report"
              tone="danger"
            />
            <KpiCard
              label="CLV Prioritas"
              value={selectedSegment.clv_prediction_ge70_frequency.toLocaleString("id-ID")}
              helper={`${formatPercent(selectedSegment.clv_prediction_ge70_rate)} anggota bernilai tinggi`}
              icon="diamond"
              tone="success"
            />
          </section>

          <section className="space-y-sm">
            <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-primary-fixed/35 px-sm py-xs shadow-sm">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
              <div className="flex items-center gap-sm pl-xs">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                  <MaterialIcon filled className="text-[20px]">
                    recommend
                  </MaterialIcon>
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold leading-tight text-on-surface">Profil & Rekomendasi</h3>
                  <p className="text-sm leading-snug text-on-surface-variant">Aksi per fungsi untuk segmen {selectedSegment.name}.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-sm md:grid-cols-2 xl:grid-cols-5">
            {pillars.map((pillar) => {
              const metric = recommendationMetrics[pillar.key];
              const toneStyle = metricToneStyles(metric.tone ?? "primary");

              return (
                <motion.article
                  key={pillar.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: metric.delay ?? 0 }}
                  className={`relative mt-sm min-h-32 overflow-visible rounded-2xl border px-sm pb-sm pt-16 shadow-sm ${toneStyle.surface}`}
                >
                  <FloatingMetricCard
                    {...metric}
                    className="absolute -right-2 -top-3 min-w-28 max-w-[9.25rem]"
                  />
                  <div className="mb-xs flex items-center gap-xs">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${toneStyle.icon}`}>
                      <MaterialIcon filled className="text-[18px]">
                        {pillar.icon}
                      </MaterialIcon>
                    </span>
                    <p className="min-w-0 text-sm font-extrabold text-on-surface">{pillar.label}</p>
                  </div>
                  <p className="rounded-xl border border-outline-variant/18 bg-white px-xs py-2 text-[13px] leading-snug text-on-surface-variant shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                    {selectedSegment.recommendations[pillar.key]}
                  </p>
                </motion.article>
              );
            })}
            </div>
          </section>

          <section className="grid gap-md lg:grid-cols-2">
            <InsightCard title="Analisis Churn" icon="person_alert" metrics={churnInsightMetrics}>
              <p>{selectedSegment.churn_prediction_llm_analysis}</p>
            </InsightCard>
            <InsightCard title="Analisis CLV" icon="monitoring" metrics={clvInsightMetrics}>
              <p>{selectedSegment.clv_prediction_llm_analysis}</p>
            </InsightCard>
          </section>
        </div>
      </section>

      <section className="relative isolate flex min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm">
        <div className="shrink-0 flex flex-col gap-md border-b border-outline-variant/20 p-md lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-on-surface">Daftar Anggota</h3>
            <p className="text-sm text-on-surface-variant">
              {membersTotal.toLocaleString("id-ID")} anggota pada segmen {selectedSegment.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            <label className="flex min-h-11 items-center gap-xs rounded-xl border border-outline-variant/25 bg-surface-container px-md py-2">
              <span className="sr-only">Cari anggota</span>
              <MaterialIcon className="text-[18px] text-on-surface-variant">search</MaterialIcon>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama, skor, segmen..."
                className="w-56 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
            </label>
          </div>
        </div>

          <div className="overflow-x-auto overscroll-x-contain" style={{ minHeight: "50rem" }}>
            <table className="w-full text-sm">
              <thead className="shadow-[0_12px_24px_rgba(47,63,38,0.18)]">
                <tr className="border-y" style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}>
                  <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">
                    <SortButton field="customer_name" active={sortBy} order={sortOrder} onSort={toggleSort}>
                      Nama
                    </SortButton>
                  </th>
                  <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">RFM</th>
                  <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">
                    <SortButton field="recency" active={sortBy} order={sortOrder} onSort={toggleSort}>
                      Recency
                    </SortButton>
                  </th>
                  <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">
                    <SortButton field="frequency" active={sortBy} order={sortOrder} onSort={toggleSort}>
                      Frequency
                    </SortButton>
                  </th>
                  <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">
                    <SortButton field="monetary" active={sortBy} order={sortOrder} onSort={toggleSort}>
                      Monetary
                    </SortButton>
                  </th>
                  <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">
                    <SortButton field="churn_prediction" active={sortBy} order={sortOrder} onSort={toggleSort}>
                      Churn
                    </SortButton>
                  </th>
                  <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">
                    <SortButton field="clv_prediction" active={sortBy} order={sortOrder} onSort={toggleSort}>
                      CLV
                    </SortButton>
                  </th>
                  <th className="min-w-[360px] px-md py-3 text-left text-[13px] font-extrabold uppercase text-white">
                    Insight
                  </th>
                </tr>
              </thead>
            <tbody>
              {membersLoading ? (
                <tr>
                  <td colSpan={8}>
                    <LoadingState />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-md py-xl">
                    <EmptyState title="Tidak ada anggota" text="Tidak ada anggota yang cocok dengan filter aktif." />
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="border-b border-outline-variant/10 transition hover:bg-surface-container-low">
                    <td className="px-md py-3">
                      <p className="font-extrabold text-on-surface">{member.customer_name}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        {member.id} - {member.last_purchase ?? "-"}
                      </p>
                    </td>
                    <td className="px-md py-3">
                      <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-extrabold text-primary">{member.rfm_score}</span>
                      <p className="mt-xs text-[10px] text-on-surface-variant">
                        {member.recency_score}-{member.frequency_score}-{member.monetary_score}
                      </p>
                    </td>
                    <td className="px-md py-3 font-bold text-on-surface">{member.recency}h</td>
                    <td className="px-md py-3 font-bold text-on-surface">{member.frequency}x</td>
                    <td className="px-md py-3 font-extrabold text-primary">{formatRupiah(member.monetary)}</td>
                    <td className="px-md py-3">
                      <ProbabilityBadge value={member.churn_prediction} priority={member.churn_prediction >= 0.7} kind="churn" />
                    </td>
                    <td className="px-md py-3">
                      <ProbabilityBadge value={member.clv_prediction} priority={member.clv_prediction >= 0.7} kind="clv" />
                    </td>
                    <td className="px-md py-3 text-xs leading-relaxed text-on-surface-variant">
                      <p>{member.churn_prediction_llm_analysis}</p>
                      <p className="mt-xs">{member.clv_prediction_llm_analysis}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 flex flex-col gap-md border-t border-outline-variant/20 bg-gradient-to-r from-primary/5 via-surface-container-lowest to-sky-50/45 p-md lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-on-surface-variant">
            Menampilkan <span className="font-extrabold text-on-surface">{firstVisibleMember.toLocaleString("id-ID")}</span> sampai{" "}
            <span className="font-extrabold text-on-surface">{lastVisibleMember.toLocaleString("id-ID")}</span> dari{" "}
            <span className="font-extrabold text-on-surface">{membersTotal.toLocaleString("id-ID")}</span> anggota
          </p>

          <div className="flex flex-wrap items-center justify-center gap-xs">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || membersLoading}
              aria-label="Halaman sebelumnya"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MaterialIcon className="text-[17px]">chevron_left</MaterialIcon>
            </button>
            {currentPaginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex size-11 items-center justify-center rounded-xl text-sm font-extrabold text-on-surface-variant"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  disabled={membersLoading || item === page}
                  aria-current={item === page ? "page" : undefined}
                  className={`inline-flex size-11 items-center justify-center rounded-xl border text-sm font-extrabold shadow-sm transition ${
                    item === page
                      ? "border-secondary-container bg-secondary-container text-on-secondary-container"
                      : "border-outline-variant/20 bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  } disabled:cursor-not-allowed`}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(membersTotalPages, current + 1))}
              disabled={page >= membersTotalPages || membersLoading}
              aria-label="Halaman berikutnya"
              className="inline-flex size-11 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MaterialIcon className="text-[17px]">chevron_right</MaterialIcon>
            </button>
          </div>

          <label className="flex items-center gap-sm text-sm font-semibold text-on-surface-variant">
            Tampilkan:
            <select
              id="rfm-page-size"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="min-h-11 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-md py-2 text-sm font-extrabold text-on-surface shadow-sm outline-none"
            >
              {[10, 20, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
    </TooltipProvider>
  );
}
