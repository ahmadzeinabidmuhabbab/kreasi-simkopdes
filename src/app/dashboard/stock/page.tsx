"use client";

import { useEffect, useMemo, useState } from "react";

import {
  DataTablePagination,
  EmptyState,
  LoadingState,
  MaterialIcon,
  SortButton,
  type SortOrder,
} from "@/components/dashboard/DashboardDataTable";
import { useApiQuery } from "@/hooks/use-api-query";

type StockStatus = "SEMUA" | "AMAN" | "RENDAH" | "KRITIS" | "HABIS";
type StockSortField =
  | "product_name"
  | "category"
  | "region"
  | "available_quantity"
  | "reorder_point"
  | "avg_daily_sales"
  | "coverage_days"
  | "status"
  | "updated_at";

interface StockItem {
  id: string;
  sku: string;
  product_name: string;
  category: string | null;
  region: string;
  unit: string;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
  safety_stock: number;
  avg_daily_sales: number;
  coverage_days: number | null;
  status: Exclude<StockStatus, "SEMUA">;
  updated_at: string;
}

interface StockSummary {
  total_sku: number;
  safe: number;
  low: number;
  critical: number;
  empty: number;
  total_on_hand_quantity: number;
  total_available_quantity: number;
  total_reserved_quantity: number;
  average_coverage_days: number | null;
  by_status: Record<string, number>;
}

interface StockPayload {
  success: boolean;
  detail?: string;
  items: StockItem[];
  summary: StockSummary;
  categories: string[];
  statuses: StockStatus[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

const statusMeta: Record<Exclude<StockStatus, "SEMUA">, { label: string; className: string; icon: string }> = {
  AMAN: {
    label: "Aman",
    className: "border-primary/25 bg-primary/10 text-primary",
    icon: "check_circle",
  },
  RENDAH: {
    label: "Rendah",
    className: "border-amber-200 bg-amber-100 text-amber-700",
    icon: "warning",
  },
  KRITIS: {
    label: "Kritis",
    className: "border-red-200 bg-red-100 text-red-700",
    icon: "error",
  },
  HABIS: {
    label: "Habis",
    className: "border-outline-variant/30 bg-surface-container text-on-surface-variant",
    icon: "block",
  },
};

function formatQuantity(value: number, unit?: string) {
  const formatted = value.toLocaleString("id-ID", {
    maximumFractionDigits: value % 1 === 0 ? 0 : 1,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayLabel(value: string | null | undefined) {
  if (!value) return "-";
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stockMeta(item: StockItem) {
  return [item.sku !== "-" ? item.sku : null, item.category, item.region].filter(Boolean).map(displayLabel).join(" - ");
}

function KpiCard({
  label,
  value,
  helper,
  icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: "primary" | "amber" | "sky" | "danger";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-secondary-container/35 text-on-secondary-container",
    sky: "bg-sky-100 text-sky-700",
    danger: "bg-red-100 text-red-700",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-sm rounded-2xl border border-outline-variant/25 bg-surface-container-lowest p-sm shadow-sm">
      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${toneClass}`}>
        <MaterialIcon filled className="text-xl">
          {icon}
        </MaterialIcon>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-extrabold uppercase tracking-normal text-on-surface-variant">{label}</p>
        <p className="mt-0.5 break-words text-xl font-extrabold text-on-surface">{value}</p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{helper}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Exclude<StockStatus, "SEMUA"> }) {
  const meta = statusMeta[status];

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-extrabold ${meta.className}`}>
      <MaterialIcon filled className="text-[14px]">
        {meta.icon}
      </MaterialIcon>
      {meta.label}
    </span>
  );
}

export default function StockPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<StockSortField>("status");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const queryUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort_by: sortBy,
      order: sortOrder,
    });
    if (search) params.set("search", search);
    return `/api/stock?${params.toString()}`;
  }, [page, pageSize, search, sortBy, sortOrder]);
  const { data, error, loading, refetch: fetchStock } = useApiQuery<StockPayload>(queryUrl);
  const items = data?.items ?? [];
  const summary = data?.summary ?? null;
  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 1;

  const handleSort = (field: StockSortField) => {
    setPage(1);
    if (field === sortBy) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortOrder(field === "available_quantity" || field === "coverage_days" || field === "updated_at" ? "desc" : "asc");
  };

  const exportCsv = () => {
    const header = ["SKU", "Produk", "Kategori", "Region", "Tersedia", "Reorder", "Safety", "Demand Harian", "Coverage", "Status"];
    const rows = items.map((item) => [
      item.sku,
      item.product_name,
      displayLabel(item.category),
      item.region,
      item.available_quantity,
      item.reorder_point,
      item.safety_stock,
      item.avg_daily_sales,
      item.coverage_days ?? "-",
      item.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-stok-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-page dashboard-page-stock flex flex-col gap-md">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-[#315f25] to-[#19380f] p-lg text-white shadow-[0_18px_48px_-30px_rgba(24,53,15,0.85)]">
        <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-sm inline-flex items-center gap-xs rounded-full border border-white/15 bg-white/10 px-sm py-1 text-xs font-bold text-white/80">
              <MaterialIcon filled className="text-[16px]">
                warehouse
              </MaterialIcon>
              Inventory KDMP
            </div>
            <h1 className="text-2xl font-extrabold text-white">Data Stok</h1>
            <p className="mt-xs max-w-3xl text-sm leading-relaxed text-white/78">
              Monitoring stok barang dari tabel commodity stock dengan pencarian, pengurutan, dan pagination server-side.
            </p>
          </div>
          <div className="flex flex-wrap gap-xs">
            <button
              type="button"
              onClick={() => void fetchStock()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-xs rounded-xl border border-white/20 bg-white/10 px-md py-2 text-sm font-extrabold text-white transition hover:bg-white/15 disabled:opacity-60"
            >
              <MaterialIcon className={`text-[18px] ${loading ? "animate-spin" : ""}`}>sync</MaterialIcon>
              Refresh
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={items.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-xs rounded-xl bg-white px-md py-2 text-sm font-extrabold text-primary shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MaterialIcon className="text-[18px]">download</MaterialIcon>
              Export CSV
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-gutter xl:grid-cols-4">
        <KpiCard
          label="Total SKU"
          value={(summary?.total_sku ?? 0).toLocaleString("id-ID")}
          helper="barang aktif di database"
          icon="inventory_2"
          tone="primary"
        />
        <KpiCard
          label="Stok Tersedia"
          value={formatQuantity(summary?.total_available_quantity ?? 0)}
          helper={`${formatQuantity(summary?.total_reserved_quantity ?? 0)} unit reserved`}
          icon="inventory"
          tone="sky"
        />
        <KpiCard
          label="Perlu Perhatian"
          value={`${(summary?.low ?? 0) + (summary?.critical ?? 0) + (summary?.empty ?? 0)}`}
          helper="rendah, kritis, atau habis"
          icon="crisis_alert"
          tone={(summary?.critical ?? 0) + (summary?.empty ?? 0) > 0 ? "danger" : "amber"}
        />
        <KpiCard
          label="Coverage Rata-rata"
          value={summary?.average_coverage_days == null ? "-" : `${summary.average_coverage_days} hari`}
          helper="estimasi berdasarkan demand harian"
          icon="event_available"
          tone="amber"
        />
      </section>

      {error ? (
        <section className="rounded-2xl border border-error/25 bg-error-container/45 p-md text-error">
          <div className="flex items-start gap-sm">
            <MaterialIcon filled className="text-[22px]">
              error
            </MaterialIcon>
            <div>
              <p className="font-extrabold">Data stok belum bisa dimuat</p>
              <p className="mt-xs text-sm">{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative isolate flex min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm">
        <div className="shrink-0 flex flex-col gap-sm p-md lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Tabel Data Stok</h2>
            <p className="text-sm text-on-surface-variant">
              {total.toLocaleString("id-ID")} barang dari tabel commodity_stock_levels
            </p>
          </div>
          <label className="flex min-h-11 w-full items-center gap-xs rounded-xl border border-outline-variant/20 bg-surface-container-low px-sm text-sm shadow-sm lg:w-[22rem]">
            <MaterialIcon className="text-[18px] text-on-surface-variant">search</MaterialIcon>
            <span className="sr-only">Cari data stok</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari produk, SKU, kategori, region..."
              className="min-w-0 flex-1 bg-transparent py-2 font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Bersihkan pencarian stok"
                className="grid size-8 place-items-center rounded-lg text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
              >
                <MaterialIcon className="text-[16px]">close</MaterialIcon>
              </button>
            ) : null}
          </label>
        </div>

        <div className="max-w-full overflow-hidden" style={{ minHeight: "38rem" }}>
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[14%]" />
              <col className="stock-desktop-col w-[13%]" />
              <col className="stock-desktop-col w-[13%]" />
              <col className="stock-desktop-col w-[12%]" />
              <col className="stock-desktop-col w-[12%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="shadow-[0_12px_24px_rgba(47,63,38,0.18)]">
              <tr className="border-y" style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="product_name" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Produk
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="available_quantity" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Stok
                  </SortButton>
                </th>
                <th className="stock-desktop-col px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="reorder_point" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Reorder
                  </SortButton>
                </th>
                <th className="stock-desktop-col px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="avg_daily_sales" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Demand
                  </SortButton>
                </th>
                <th className="stock-desktop-col px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="coverage_days" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Coverage
                  </SortButton>
                </th>
                <th className="stock-desktop-col px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="updated_at" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Update
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="status" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Status
                  </SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl">
                    <LoadingState label="Memuat data stok" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl">
                    <EmptyState
                      title="Tidak ada data stok"
                      text="Tidak ada barang yang cocok dengan pencarian saat ini."
                      icon="inventory_2"
                    />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-outline-variant/10 transition hover:bg-surface-container-low">
                    <td className="px-md py-3">
                      <p className="break-words font-extrabold leading-snug text-on-surface">{item.product_name}</p>
                      <p className="mt-0.5 break-words text-[11px] text-on-surface-variant">
                        {stockMeta(item)}
                      </p>
                    </td>
                    <td className="px-md py-3">
                      <p className="font-extrabold text-primary">{formatQuantity(item.available_quantity, item.unit)}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        on hand {formatQuantity(item.on_hand_quantity)}
                      </p>
                    </td>
                    <td className="stock-desktop-col px-md py-3">
                      <p className="font-bold text-on-surface">{formatQuantity(item.reorder_point, item.unit)}</p>
                      <p className="text-[11px] text-on-surface-variant">safety {formatQuantity(item.safety_stock)}</p>
                    </td>
                    <td className="stock-desktop-col px-md py-3 font-bold text-on-surface">
                      {formatQuantity(item.avg_daily_sales, `${item.unit}/hari`)}
                    </td>
                    <td className="stock-desktop-col px-md py-3">
                      <p className="font-extrabold text-on-surface">
                        {item.coverage_days == null ? "-" : `${item.coverage_days} hari`}
                      </p>
                    </td>
                    <td className="stock-desktop-col px-md py-3 text-xs font-bold leading-relaxed text-on-surface-variant">
                      {formatDateTime(item.updated_at)}
                    </td>
                    <td className="px-md py-3">
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <DataTablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          loading={loading}
          itemLabel="barang"
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
