"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type ReactNode } from "react";

const PlanogramDesigner = dynamic(
  () => import("@/components/bundle/PlanogramDesigner"),
  {
    ssr: false,
    loading: () => <PlanogramFallback />,
  }
);

type ActiveTab = "shelf" | "pricing";
type Urgency = "high" | "medium" | "low";

interface InventoryItem {
  id: number;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  reorderPoint: number;
  velocity: number;
  restock: number;
  status: string;
  category: string;
  price?: number;
  associationCount?: number;
  associationRank?: number;
}

interface Bundle {
  id: number;
  name: string;
  items: string[];
  normalPrice: number;
  bundlePrice: number;
  discount: number;
  sold: number;
  stock: number;
  impact: string;
  badge: string;
  badgeColor: string;
}

interface DynamicPrice {
  id: number;
  item: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  type: string;
  urgency: Urgency;
}

interface PlanogramSlotItem {
  scenarioId: string;
  scenarioName: string;
  slot: string;
  shelf: number;
  row: number;
  rowPosition: string;
  column: number;
  produk: string;
  kategori: string;
  hargaRupiah: number;
  weightClass: string;
  adjacentReference?: string | null;
  ruleTheme?: string | null;
  ruleConfidence: number;
  ruleLift: number;
  ruleSupportCount: number;
  sourceRule?: string | null;
  placementReason: string;
}

interface PlanogramScenario {
  scenarioId: string;
  name: string;
  objective: string;
  editable: boolean;
  layoutSlots: PlanogramSlotItem[];
}

interface PlanogramPayload {
  success: boolean;
  layoutSpec: {
    shelfCount: number;
    rowsPerShelf: number;
    columnsPerRow: number;
    slotFormat: string;
    rowMapping: Record<string, string>;
  };
  scenarios: PlanogramScenario[];
}

interface BundleApiResponse {
  success: boolean;
  inventory: InventoryItem[];
  bundles: Bundle[];
  dynamicPricing: DynamicPrice[];
  planogram?: PlanogramPayload;
}

interface KpiItem {
  label: string;
  value: ReactNode;
  helper: string;
  icon: string;
  tone?: "primary" | "sky" | "amber" | "danger" | "success";
}

const tabs: Array<{ key: ActiveTab; label: string; icon: string }> = [
  {
    key: "shelf",
    label: "Planogram",
    icon: "shelves",
  },
  {
    key: "pricing",
    label: "Bundling",
    icon: "local_offer",
  },
];

const urgencyMeta: Record<Urgency, { label: string; className: string; icon: string }> = {
  high: {
    label: "Tinggi",
    className: "border-error/25 bg-error-container/60 text-error",
    icon: "priority_high",
  },
  medium: {
    label: "Sedang",
    className: "border-secondary-container/70 bg-secondary-container/35 text-on-secondary-container",
    icon: "notifications_active",
  },
  low: {
    label: "Rendah",
    className: "border-primary/20 bg-primary/10 text-primary",
    icon: "task_alt",
  },
};

const trendTone = {
  up: {
    icon: "trending_up",
    label: "Naik",
    className: "border-error/20 bg-error-container/55 text-error",
    chip: "bg-error-container/55 text-error",
  },
  down: {
    icon: "trending_down",
    label: "Turun",
    className: "border-primary/20 bg-primary/10 text-primary",
    chip: "bg-primary/10 text-primary",
  },
};

function formatRupiah(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function MaterialIcon({
  children,
  className = "",
  filled = false,
}: {
  children: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {children}
    </span>
  );
}

function kpiToneClass(tone: KpiItem["tone"] = "primary") {
  return {
    primary: "bg-primary/10 text-primary",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-secondary-container/35 text-on-secondary-container",
    danger: "bg-error-container/65 text-error",
    success: "bg-primary-fixed/55 text-on-primary-fixed-variant",
  }[tone];
}

function PlanogramFallback() {
  return (
    <div
      className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-md shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Memuat planogram"
    >
      <div className="grid min-h-[380px] gap-md xl:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-md">
          <div className="mb-md h-5 w-32 rounded-full shimmer" />
          <div className="grid gap-xs">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-14 rounded-xl shimmer" />
            ))}
          </div>
        </div>
        <div className="grid gap-md">
          <div className="h-[180px] rounded-2xl shimmer" />
          <div className="h-[180px] rounded-2xl shimmer" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, helper, icon, tone = "primary" }: KpiItem) {
  return (
    <article className="flex min-w-0 items-center gap-sm rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm transition hover:shadow-md">
      <div className={`grid size-11 shrink-0 place-items-center rounded-xl ${kpiToneClass(tone)}`}>
        <MaterialIcon filled className="text-[22px]">
          {icon}
        </MaterialIcon>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="mt-0.5 truncate text-2xl font-extrabold text-on-surface">{value}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-on-surface-variant">{helper}</p>
      </div>
    </article>
  );
}

function SectionHeading({
  icon,
  eyebrow,
  title,
  description,
  action,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-md flex flex-col gap-md rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-md shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-sm">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <MaterialIcon filled className="text-[22px]">
            {icon}
          </MaterialIcon>
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            {eyebrow}
          </p>
          <h2 className="mt-0.5 text-lg font-extrabold text-on-surface">{title}</h2>
          <p className="mt-xs max-w-3xl text-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export default function SmartBundle() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("shelf");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPrice[]>([]);
  const [planogram, setPlanogram] = useState<PlanogramPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/bundle", { signal: controller.signal })
      .then((response) => response.json() as Promise<BundleApiResponse>)
      .then((data) => {
        if (data.success) {
          setInventory(data.inventory);
          setBundles(data.bundles);
          setDynamicPricing(data.dynamicPricing);
          setPlanogram(data.planogram ?? null);
        }
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setLoading(false);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const stats = useMemo<KpiItem[]>(() => {
    const criticalCount = inventory.filter((item) => item.status === "Kritis").length;
    const categoryCount = new Set(inventory.map((item) => item.category)).size;
    const highUrgencyCount = dynamicPricing.filter((price) => price.urgency === "high").length;

    return [
      {
        label: "Total Produk",
        value: inventory.length,
        helper: `${categoryCount} kategori komoditas`,
        icon: "inventory_2",
        tone: "sky",
      },
      {
        label: "Slot Planogram",
        value: "36",
        helper: `${planogram?.scenarios.length ?? 4} skenario penataan`,
        icon: "view_comfy",
        tone: "primary",
      },
      {
        label: "SKU Kritis",
        value: criticalCount,
        helper: "prioritas stok toko",
        icon: "warning",
        tone: criticalCount > 0 ? "danger" : "success",
      },
      {
        label: "Review Harga",
        value: dynamicPricing.length,
        helper: `${highUrgencyCount} urgensi tinggi`,
        icon: "price_change",
        tone: "amber",
      },
      {
        label: "Bundle Aktif",
        value: bundles.length,
        helper: "paket rekomendasi AI",
        icon: "inventory_2",
        tone: "success",
      },
    ];
  }, [bundles.length, dynamicPricing, inventory, planogram?.scenarios.length]);

  const pricingSummary = useMemo(() => {
    const revenue = bundles.reduce((total, bundle) => total + bundle.bundlePrice * bundle.sold, 0);
    const averageDiscount =
      bundles.length === 0
        ? 0
        : Math.round(bundles.reduce((total, bundle) => total + bundle.discount, 0) / bundles.length);
    const priceDrops = dynamicPricing.filter((price) => price.suggestedPrice < price.currentPrice).length;

    return { revenue, averageDiscount, priceDrops };
  }, [bundles, dynamicPricing]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  return (
    <div className="dashboard-page dashboard-page-bundle mx-auto w-full max-w-[1280px] space-y-lg pb-2xl">
      {toast && (
        <div
          className="anim-fade-in-up fixed bottom-6 right-6 z-50 flex items-center gap-sm rounded-2xl border border-primary/20 bg-primary-fixed px-md py-sm text-sm font-semibold text-on-primary-fixed shadow-2xl"
          role="status"
          aria-live="polite"
        >
          <MaterialIcon filled className="text-[20px]">
            check_circle
          </MaterialIcon>
          {toast}
        </div>
      )}

      <header className="anim-fade-in-up overflow-hidden rounded-2xl border border-outline-variant/25 bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary-container/25 p-lg shadow-sm">
        <div className="flex flex-col gap-md xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-md">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <MaterialIcon filled className="text-3xl">
                inventory_2
              </MaterialIcon>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
                AI Smart Predictive Bundle
              </p>
              <h1 className="mt-0.5 text-2xl font-extrabold text-on-surface">
                Planogram, Dynamic Pricing, dan Bundling
              </h1>
              <p className="mt-xs max-w-4xl text-sm leading-relaxed text-on-surface-variant">
                Dashboard operasional untuk mengatur penempatan barang toko kelontong, membaca
                peluang harga, dan mengaktifkan paket komoditas berbasis pola transaksi.
              </p>
            </div>
          </div>

          <div className="grid min-w-[min(100%,24rem)] gap-xs sm:grid-cols-2">
            <div className="rounded-xl border border-primary/15 bg-white/75 px-md py-sm shadow-sm">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                Status Mesin AI
              </p>
              <div className="mt-xs flex items-center gap-xs text-sm font-extrabold text-primary">
                <MaterialIcon filled className="text-[18px]">
                  auto_awesome
                </MaterialIcon>
                Siap rekomendasi
              </div>
            </div>
            <div className="rounded-xl border border-outline-variant/25 bg-white/75 px-md py-sm shadow-sm">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                Layout Rak
              </p>
              <div className="mt-xs flex items-center gap-xs text-sm font-extrabold text-on-surface">
                <MaterialIcon className="text-[18px] text-primary">view_agenda</MaterialIcon>
                Rak A dan Rak B
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="anim-fade-in-up grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-gutter">
        {stats.map((stat) => (
          <KpiCard key={stat.label} {...stat} />
        ))}
      </section>

      <nav
        className="w-full rounded-2xl border border-outline-variant/25 bg-surface-container-low p-1 shadow-sm"
        aria-label="Navigasi fitur bundle"
      >
        <div className="inline-flex max-w-full flex-wrap gap-xs">
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
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
                  <MaterialIcon filled className="text-[18px]">
                    {tab.icon}
                  </MaterialIcon>
                </span>
                <span className="whitespace-nowrap text-sm font-extrabold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === "shelf" && (
        <PlanogramDesigner
          inventory={inventory}
          loading={loading}
          onToast={showToast}
          planogram={planogram}
        />
      )}

      {activeTab === "pricing" && (
        <div className="space-y-lg">
          <section className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-primary-fixed/35 p-md shadow-sm">
            <div className="grid gap-md lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex min-w-0 items-center gap-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <MaterialIcon filled className="text-[22px]">
                    insights
                  </MaterialIcon>
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                    Ringkasan Komersial
                  </p>
                  <h2 className="mt-0.5 text-lg font-extrabold text-on-surface">
                    Optimasi harga dan paket untuk perputaran barang
                  </h2>
                </div>
              </div>

              <div className="grid gap-xs sm:grid-cols-3 lg:min-w-[32rem]">
                <SummaryPill label="Revenue Bundle" value={formatRupiah(pricingSummary.revenue)} icon="payments" />
                <SummaryPill label="Avg Diskon" value={`${pricingSummary.averageDiscount}%`} icon="sell" />
                <SummaryPill label="Harga Turun" value={pricingSummary.priceDrops} icon="trending_down" />
              </div>
            </div>
          </section>

          <section>
            <SectionHeading
              icon="price_change"
              eyebrow="Dynamic Pricing"
              title="Rekomendasi Penyesuaian Harga"
              description="Prioritaskan komoditas yang stoknya menekan margin, demand berubah cepat, atau perlu percepatan sell-through."
            />

            {loading ? (
              <div className="grid gap-gutter md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-48 rounded-2xl shimmer" />
                ))}
              </div>
            ) : (
              <div className="grid gap-gutter lg:grid-cols-2">
                {dynamicPricing.map((price) => (
                  <PricingCard
                    key={price.id}
                    price={price}
                    onApply={() => showToast(`Harga ${price.item} dijadwalkan untuk review.`)}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeading
              icon="inventory_2"
              eyebrow="Bundling AI"
              title="Paket Bundle Rekomendasi"
              description="Paket disusun dari pola transaksi agar produk pelengkap bisa bergerak bersama tanpa mengganggu margin utama."
            />

            {loading ? (
              <div className="grid gap-gutter md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-64 rounded-2xl shimmer" />
                ))}
              </div>
            ) : (
              <div className="grid gap-gutter xl:grid-cols-3">
                {bundles.map((bundle) => (
                  <BundleCard
                    key={bundle.id}
                    bundle={bundle}
                    onActivate={() => showToast(`Bundle "${bundle.name}" diaktifkan.`)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value, icon }: { label: string; value: ReactNode; icon: string }) {
  return (
    <div className="flex min-h-14 items-center gap-xs rounded-xl border border-outline-variant/20 bg-white/75 px-sm py-xs shadow-sm">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <MaterialIcon filled className="text-[18px]">
          {icon}
        </MaterialIcon>
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase text-on-surface-variant">{label}</p>
        <p className="truncate text-base font-extrabold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function PricingCard({ price, onApply }: { price: DynamicPrice; onApply: () => void }) {
  const isUp = price.suggestedPrice > price.currentPrice;
  const diff = Math.abs(price.suggestedPrice - price.currentPrice);
  const pct = Math.round((diff / price.currentPrice) * 100);
  const tone = isUp ? trendTone.up : trendTone.down;
  const urgency = urgencyMeta[price.urgency];

  return (
    <article className={`overflow-hidden rounded-2xl border bg-surface-container-lowest shadow-sm transition hover:shadow-md ${tone.className}`}>
      <div className="flex flex-col gap-md border-b border-outline-variant/20 bg-gradient-to-r from-surface-container-lowest via-surface-container-lowest to-primary/5 p-md sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-xs flex flex-wrap items-center gap-xs">
            <span className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-extrabold ${urgency.className}`}>
              <MaterialIcon className="text-[15px]">{urgency.icon}</MaterialIcon>
              Urgensi {urgency.label}
            </span>
            <span className="rounded-full border border-outline-variant/20 bg-surface-container px-2.5 py-1 text-[11px] font-bold text-on-surface-variant">
              {price.type}
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-on-surface">{price.item}</h3>
        </div>

        <div className={`inline-flex min-h-10 items-center gap-xs rounded-xl border px-sm py-xs text-sm font-extrabold ${tone.chip}`}>
          <MaterialIcon filled className="text-[18px]">
            {tone.icon}
          </MaterialIcon>
          {tone.label} {pct}%
        </div>
      </div>

      <div className="p-md">
        <div className="grid gap-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <PriceBox label="Harga Saat Ini" value={formatRupiah(price.currentPrice)} muted />
          <span className="hidden size-10 place-items-center rounded-full bg-surface-container text-on-surface-variant sm:grid">
            <MaterialIcon className="text-[18px]">arrow_forward</MaterialIcon>
          </span>
          <PriceBox label="Rekomendasi" value={formatRupiah(price.suggestedPrice)} />
        </div>

        <div className="mt-md rounded-xl border border-outline-variant/20 bg-surface-container-low px-md py-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Alasan AI
          </p>
          <p className="mt-xs text-sm leading-relaxed text-on-surface-variant">{price.reason}</p>
        </div>

        <button
          type="button"
          onClick={onApply}
          className="mt-md inline-flex min-h-11 w-full items-center justify-center gap-xs rounded-xl bg-primary px-md py-2 text-sm font-extrabold text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/35"
        >
          <MaterialIcon className="text-[18px]">check</MaterialIcon>
          Terapkan Rekomendasi
        </button>
      </div>
    </article>
  );
}

function PriceBox({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`rounded-xl border px-md py-sm ${muted ? "border-outline-variant/20 bg-surface-container" : "border-primary/18 bg-primary/8"}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className={`mt-xs text-xl font-extrabold ${muted ? "text-on-surface" : "text-primary"}`}>
        {value}
      </p>
    </div>
  );
}

function BundleCard({ bundle, onActivate }: { bundle: Bundle; onActivate: () => void }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm transition hover:shadow-md">
      <div className="border-b border-outline-variant/20 bg-gradient-to-r from-primary/8 via-surface-container-lowest to-secondary-container/25 p-md">
        <div className="flex items-start justify-between gap-sm">
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              Paket Rekomendasi
            </p>
            <h3 className="mt-xs text-lg font-extrabold text-on-surface">{bundle.name}</h3>
          </div>
          <span
            className={`shrink-0 rounded-full border border-current/20 px-2.5 py-1 text-[11px] font-extrabold ${bundle.badgeColor}`}
          >
            {bundle.badge}
          </span>
        </div>
      </div>

      <div className="p-md">
        <div className="grid gap-xs">
          {bundle.items.map((item) => (
            <div
              key={item}
              className="flex min-h-9 items-center gap-xs rounded-lg border border-outline-variant/15 bg-surface-container-low px-sm py-xs text-xs font-semibold text-on-surface-variant"
            >
              <MaterialIcon filled className="text-[15px] text-primary">
                check_circle
              </MaterialIcon>
              {item}
            </div>
          ))}
        </div>

        <div className="mt-md grid grid-cols-[1fr_auto] gap-sm">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container px-md py-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              Harga Normal
            </p>
            <p className="mt-xs text-sm font-bold text-on-surface-variant line-through">
              {formatRupiah(bundle.normalPrice)}
            </p>
            <p className="mt-xs text-xl font-extrabold text-primary">
              {formatRupiah(bundle.bundlePrice)}
            </p>
          </div>
          <div className="grid size-16 place-items-center rounded-2xl bg-primary text-sm font-extrabold text-white shadow-md">
            -{bundle.discount}%
          </div>
        </div>

        <div className="mt-md grid grid-cols-2 gap-xs">
          <SummaryPill label="Terjual" value={bundle.sold} icon="shopping_cart" />
          <SummaryPill label="Stok" value={bundle.stock} icon="inventory" />
        </div>

        <p className="mt-md rounded-xl border border-primary/10 bg-primary/8 px-md py-sm text-sm leading-relaxed text-on-surface-variant">
          {bundle.impact}
        </p>

        <button
          type="button"
          onClick={onActivate}
          className="mt-md inline-flex min-h-11 w-full items-center justify-center gap-xs rounded-xl border border-primary/15 bg-primary/10 px-md py-2 text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/35"
        >
          <MaterialIcon className="text-[18px]">rocket_launch</MaterialIcon>
          Aktifkan Bundle
        </button>
      </div>
    </article>
  );
}
