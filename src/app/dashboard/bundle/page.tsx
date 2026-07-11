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
type CommodityTrend = "up" | "down" | "stable";

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
  planogram?: PlanogramPayload;
}

interface SmartBundleFrontendRow {
  id: number;
  bundleId: string;
  packageName: string;
  theme: string;
  bundleItems: string[];
  recommendedItem: string;
  hargaNormal: number;
  hargaBundle: number;
  diskonPersen: number;
  totalHargaModal: number;
  estimasiMarginRupiah: number;
  estimasiMarginPersen: number;
  marginMinimumPersen: number;
  stokBundleTersedia: number;
  demandVelocityMingguan: number;
  batasHargaRegulasiTotal: number;
  support: number;
  confidence: number;
  lift: number;
  supportCount: number;
  frontendBadge: string;
  bundleStatus: string;
  recommendationReason: string;
}

interface SmartBundleFrontendResponse {
  success: boolean;
  data: SmartBundleFrontendRow[];
  detail?: string;
}

interface CommodityPriceSource {
  title: string;
  url: string;
  publisher?: string | null;
}

interface CommodityPriceItem {
  commodityName: string;
  unit: string;
  currentPrice: number | null;
  previousPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string;
  changeRupiah: number | null;
  changePercent: number | null;
  trend: CommodityTrend;
  summary: string;
  currentPeriod: string;
  previousPeriod: string;
  sources: CommodityPriceSource[];
  refreshedAt?: string | null;
}

interface CommodityPriceResponse {
  success: boolean;
  generatedAt: string;
  items: CommodityPriceItem[];
  refreshedCount?: number;
  detail?: string;
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

function paginationItems(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) return [1, 2, 3, "ellipsis", totalPages];
  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", currentPage, "ellipsis", totalPages];
}

function formatRupiah(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatMaybeRupiah(value: number | null) {
  return value === null ? "Belum tersedia" : formatRupiah(value);
}

function formatPercent(value: number, fractionDigits = 0) {
  return `${value.toFixed(fractionDigits)}%`;
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
  const [frontendBundles, setFrontendBundles] = useState<SmartBundleFrontendRow[]>([]);
  const [commodityPrices, setCommodityPrices] = useState<CommodityPriceItem[]>([]);
  const [planogram, setPlanogram] = useState<PlanogramPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(true);
  const [bundlePage, setBundlePage] = useState(1);
  const [bundlePageSize, setBundlePageSize] = useState(9);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceRefreshing, setPriceRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/bundle", { signal: controller.signal })
      .then((response) => response.json() as Promise<BundleApiResponse>)
      .then((data) => {
        if (data.success) {
          setInventory(data.inventory);
          setBundles(data.bundles);
          setPlanogram(data.planogram ?? null);
        }
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") setLoading(false);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/bundle?resource=frontend-bundles&limit=200", { signal: controller.signal })
      .then((response) => response.json() as Promise<SmartBundleFrontendResponse>)
      .then((data) => {
        if (data.success) setFrontendBundles(data.data);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setToast("Rekomendasi bundle belum dapat ditampilkan.");
        }
      })
      .finally(() => setBundleLoading(false));

    return () => controller.abort();
  }, []);

  const bundleTotalPages = Math.max(1, Math.ceil(frontendBundles.length / bundlePageSize));
  const firstVisibleBundle = frontendBundles.length === 0 ? 0 : (bundlePage - 1) * bundlePageSize + 1;
  const lastVisibleBundle = Math.min(bundlePage * bundlePageSize, frontendBundles.length);
  const visibleBundles = useMemo(
    () => frontendBundles.slice((bundlePage - 1) * bundlePageSize, bundlePage * bundlePageSize),
    [bundlePage, bundlePageSize, frontendBundles],
  );
  const currentBundlePaginationItems = paginationItems(bundlePage, bundleTotalPages);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/bundle?resource=commodity-prices&limit=20", { signal: controller.signal })
      .then((response) => response.json() as Promise<CommodityPriceResponse>)
      .then((data) => {
        if (data.success) setCommodityPrices(data.items);
      })
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setToast("Harga komoditas belum dapat ditampilkan.");
        }
      })
      .finally(() => setPriceLoading(false));

    return () => controller.abort();
  }, []);

  const stats = useMemo<KpiItem[]>(() => {
    const criticalCount = inventory.filter((item) => item.status === "Kritis").length;
    const categoryCount = new Set(inventory.map((item) => item.category)).size;
    const activeBundleCount = frontendBundles.length || bundles.length;

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
        label: "Bundle Aktif",
        value: activeBundleCount,
        helper: "paket rekomendasi AI",
        icon: "inventory_2",
        tone: "success",
      },
    ];
  }, [bundles.length, frontendBundles.length, inventory, planogram?.scenarios.length]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const refreshCommodityPrices = async () => {
    setPriceRefreshing(true);
    try {
      const response = await fetch("/api/bundle?resource=refresh-commodity-prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 20 }),
      });
      const data = (await response.json()) as CommodityPriceResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.detail ?? "Refresh harga komoditas gagal.");
      }

      setCommodityPrices(data.items);
      showToast(`${data.refreshedCount ?? data.items.length} harga komoditas diperbarui.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Refresh harga komoditas gagal.");
    } finally {
      setPriceRefreshing(false);
    }
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
        <div className="flex flex-col gap-md">
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
                Planogram dan Bundling AI
              </h1>
              <p className="mt-xs max-w-4xl text-sm leading-relaxed text-on-surface-variant">
                Optimalkan susunan rak, temukan kombinasi produk potensial, dan pantau harga
                komoditas untuk mendukung keputusan penjualan.
              </p>
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
          <section>
            <SectionHeading
              icon="inventory_2"
              eyebrow="Bundling AI"
              title="Paket Bundle Rekomendasi"
              description="Temukan kombinasi produk potensial dengan harga menarik dan ketersediaan stok yang siap ditawarkan."
            />

            {bundleLoading ? (
              <BundleSkeletonGrid />
            ) : frontendBundles.length > 0 ? (
              <>
                <div className="grid gap-gutter xl:grid-cols-3">
                  {visibleBundles.map((bundle) => (
                    <FrontendBundleCard
                      key={bundle.bundleId}
                      bundle={bundle}
                      onActivate={() => showToast(`Bundle "${bundle.packageName}" diaktifkan.`)}
                    />
                  ))}
                </div>

                <BundlePagination
                  currentPage={bundlePage}
                  firstItem={firstVisibleBundle}
                  items={currentBundlePaginationItems}
                  lastItem={lastVisibleBundle}
                  onPageChange={setBundlePage}
                  onPageSizeChange={(size) => {
                    setBundlePageSize(size);
                    setBundlePage(1);
                  }}
                  pageSize={bundlePageSize}
                  totalItems={frontendBundles.length}
                  totalPages={bundleTotalPages}
                />
              </>
            ) : (
              <EmptyState
                icon="inventory_2"
                title="Rekomendasi bundle belum tersedia"
                description="Rekomendasi paket akan muncul setelah kombinasi produk yang sesuai ditemukan."
              />
            )}
          </section>

          <section>
            <SectionHeading
              icon="travel_explore"
              eyebrow="Harga Komoditas"
              title="Harga Jual Komoditas Indonesia"
              description="Harga jual per satuan di Indonesia untuk minggu ini dan minggu lalu."
              action={
                <button
                  type="button"
                  onClick={refreshCommodityPrices}
                  disabled={priceRefreshing}
                  className="inline-flex min-h-10 items-center justify-center gap-xs rounded-xl bg-primary px-md py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-65"
                >
                  <MaterialIcon className={`text-[18px] ${priceRefreshing ? "animate-spin" : ""}`}>
                    {priceRefreshing ? "progress_activity" : "sync"}
                  </MaterialIcon>
                  {priceRefreshing ? "Memperbarui" : "Refresh Harga"}
                </button>
              }
            />

            {priceLoading ? (
              <CommoditySkeletonGrid />
            ) : commodityPrices.length > 0 ? (
              <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-5">
                {commodityPrices.map((item) => (
                  <CommodityPriceCard key={item.commodityName} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="travel_explore"
                title="Harga komoditas belum tersedia"
                description="Pilih Refresh Harga untuk memperbarui perbandingan harga minggu ini dan minggu lalu."
              />
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

function BundlePagination({
  currentPage,
  firstItem,
  items,
  lastItem,
  onPageChange,
  onPageSizeChange,
  pageSize,
  totalItems,
  totalPages,
}: {
  currentPage: number;
  firstItem: number;
  items: Array<number | "ellipsis">;
  lastItem: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}) {
  return (
    <div className="mt-gutter flex flex-col gap-md rounded-2xl border border-outline-variant/20 bg-gradient-to-r from-primary/5 via-surface-container-lowest to-sky-50/45 p-md lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-on-surface-variant">
        Menampilkan <span className="font-extrabold text-on-surface">{firstItem.toLocaleString("id-ID")}</span> sampai{" "}
        <span className="font-extrabold text-on-surface">{lastItem.toLocaleString("id-ID")}</span> dari{" "}
        <span className="font-extrabold text-on-surface">{totalItems.toLocaleString("id-ID")}</span> bundle
      </p>

      <div className="flex flex-wrap items-center justify-center gap-xs">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Halaman bundle sebelumnya"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MaterialIcon className="text-[17px]">chevron_left</MaterialIcon>
        </button>

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`bundle-ellipsis-${index}`}
              className="inline-flex size-11 items-center justify-center rounded-xl text-sm font-extrabold text-on-surface-variant"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={item === currentPage}
              aria-current={item === currentPage ? "page" : undefined}
              aria-label={`Halaman bundle ${item}`}
              className={`inline-flex size-11 items-center justify-center rounded-xl border text-sm font-extrabold shadow-sm transition ${
                item === currentPage
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
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          aria-label="Halaman bundle berikutnya"
          className="inline-flex size-11 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-surface-container hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <MaterialIcon className="text-[17px]">chevron_right</MaterialIcon>
        </button>
      </div>

      <label className="flex items-center gap-sm text-sm font-semibold text-on-surface-variant">
        Tampilkan:
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Jumlah bundle per halaman"
          className="min-h-11 rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-md py-2 text-sm font-extrabold text-on-surface shadow-sm outline-none focus:ring-2 focus:ring-primary/35"
        >
          {[9, 18, 36].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function FrontendBundleCard({
  bundle,
  onActivate,
}: {
  bundle: SmartBundleFrontendRow;
  onActivate: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-outline-variant/20 bg-gradient-to-r from-primary/8 via-surface-container-lowest to-secondary-container/25 p-md">
        <div className="flex items-start justify-between gap-sm">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-on-surface">{bundle.packageName}</h3>
          </div>
          <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-extrabold text-primary">
            {bundle.frontendBadge}
          </span>
        </div>
      </div>

      <div className="space-y-md p-md">
        <div className="grid gap-xs">
          {bundle.bundleItems.map((item) => (
            <div
              key={item}
              className="flex min-h-9 items-center gap-xs rounded-lg border border-outline-variant/15 bg-surface-container-low px-sm py-xs text-xs font-semibold text-on-surface-variant"
            >
              <MaterialIcon filled className="text-[15px] text-primary">
                check_circle
              </MaterialIcon>
              <span className="min-w-0 truncate">{item}</span>
            </div>
          ))}
          <div className="flex min-h-9 items-center gap-xs rounded-lg border border-secondary-container/60 bg-secondary-container/25 px-sm py-xs text-xs font-extrabold text-on-secondary-container">
            <MaterialIcon filled className="text-[15px]">
              add_circle
            </MaterialIcon>
            <span className="min-w-0 truncate">{bundle.recommendedItem}</span>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_4rem] gap-sm">
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container px-md py-sm">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              Harga Bundle
            </p>
            <p className="mt-xs text-sm font-bold text-on-surface-variant line-through">
              {formatRupiah(bundle.hargaNormal)}
            </p>
            <p className="mt-xs text-xl font-extrabold text-primary">
              {formatRupiah(bundle.hargaBundle)}
            </p>
          </div>
          <div className="grid place-items-center rounded-2xl bg-primary text-sm font-extrabold text-white shadow-md">
            -{formatPercent(bundle.diskonPersen)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-xs">
          <SummaryPill label="Margin" value={formatRupiah(bundle.estimasiMarginRupiah)} icon="payments" />
          <SummaryPill label="Stok" value={bundle.stokBundleTersedia} icon="inventory" />
        </div>

        <button
          type="button"
          onClick={onActivate}
          className="inline-flex min-h-11 w-full items-center justify-center gap-xs rounded-xl border border-primary/15 bg-primary/10 px-md py-2 text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/35"
        >
          <MaterialIcon className="text-[18px]">rocket_launch</MaterialIcon>
          Aktifkan Bundle
        </button>
      </div>
    </article>
  );
}

function CommodityPriceCard({ item }: { item: CommodityPriceItem }) {
  const growth = item.changePercent ?? (
    item.currentPrice !== null && item.previousPrice !== null && item.previousPrice !== 0
      ? ((item.currentPrice - item.previousPrice) / item.previousPrice) * 100
      : 0
  );
  const trend = growth > 0
    ? {
        icon: "trending_up",
        className: "text-error",
      }
    : growth < 0
      ? {
          icon: "trending_down",
          className: "text-primary",
        }
      : {
          icon: "trending_flat",
          className: "text-on-surface-variant",
        };

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="border-b border-outline-variant/20 bg-gradient-to-br from-surface-container-lowest to-primary/8 p-sm">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
            Per {item.unit}
          </p>
          <h3 className="mt-0.5 truncate text-base font-extrabold text-on-surface">
            {item.commodityName}
          </h3>
        </div>
      </div>

      <div className="space-y-sm p-sm">
        <div className="flex items-end justify-between gap-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
              Harga minggu ini
            </p>
            <p className="mt-1 truncate text-xl font-extrabold tabular-nums text-primary">
              {formatMaybeRupiah(item.currentPrice)}
            </p>
          </div>
          <div className={`shrink-0 border-l border-outline-variant/25 pl-sm text-right ${trend.className}`}>
            <div className="flex items-center justify-end gap-1">
              <MaterialIcon className="text-[22px]">{trend.icon}</MaterialIcon>
              <span className="text-base font-extrabold tabular-nums">
                {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-sm border-t border-outline-variant/20 pt-sm">
          <span className="text-[10px] font-extrabold uppercase text-on-surface-variant">
            Minggu lalu
          </span>
          <span className="truncate text-sm font-extrabold tabular-nums text-on-surface">
            {formatMaybeRupiah(item.previousPrice)}
          </span>
        </div>
      </div>
    </article>
  );
}

function BundleSkeletonGrid() {
  return (
    <div className="grid gap-gutter xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div key={item} className="h-[34rem] rounded-2xl shimmer" />
      ))}
    </div>
  );
}

function CommoditySkeletonGrid() {
  return (
    <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, index) => (
        <div key={index} className="h-72 rounded-2xl shimmer" />
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest p-lg text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <MaterialIcon filled className="text-[24px]">
          {icon}
        </MaterialIcon>
      </span>
      <h3 className="mt-sm text-lg font-extrabold text-on-surface">{title}</h3>
      <p className="mx-auto mt-xs max-w-xl text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
