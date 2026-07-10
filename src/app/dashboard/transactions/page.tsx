"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DataTablePagination,
  EmptyState,
  LoadingState,
  MaterialIcon,
  SortButton,
  type SortOrder,
} from "@/components/dashboard/DashboardDataTable";

type TransactionStatus = "SEMUA" | "SELESAI" | "DIPROSES" | "MENUNGGU";
type TransactionSortField =
  | "transaction_id"
  | "transaction_at"
  | "customer_name"
  | "category"
  | "total_cost_idr"
  | "payment_method"
  | "total_items";

interface TransactionItem {
  id: string;
  transaction_id: number;
  transaction_code: string;
  transaction_date: string;
  transaction_time: string;
  customer_name: string;
  products: string[];
  product_count: number;
  total_pieces: number;
  total_cost_idr: number;
  payment_method: string | null;
  category: string | null;
  basket_mix_type: string | null;
  customer_category: string | null;
  city: string | null;
  status: Exclude<TransactionStatus, "SEMUA">;
  discount_applied: boolean;
  season: string | null;
  promotion: string | null;
}

interface TransactionSummary {
  total_transactions: number;
  total_value_idr: number;
  avg_value_idr: number;
  unique_customers: number;
  total_pieces: number;
  by_status: Record<string, number>;
}

interface TransactionsPayload {
  success: boolean;
  detail?: string;
  items: TransactionItem[];
  summary: TransactionSummary;
  categories: string[];
  payment_methods: string[];
  statuses: TransactionStatus[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

const statusMeta: Record<Exclude<TransactionStatus, "SEMUA">, { label: string; className: string; icon: string }> = {
  SELESAI: {
    label: "Selesai",
    className: "border-primary/25 bg-primary/10 text-primary",
    icon: "check_circle",
  },
  DIPROSES: {
    label: "Diproses",
    className: "border-sky-200 bg-sky-100 text-sky-700",
    icon: "hourglass_top",
  },
  MENUNGGU: {
    label: "Menunggu",
    className: "border-amber-200 bg-amber-100 text-amber-700",
    icon: "schedule",
  },
};

function formatRupiah(value: number) {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)} M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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
  tone: "primary" | "amber" | "sky" | "success";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-secondary-container/35 text-on-secondary-container",
    sky: "bg-sky-100 text-sky-700",
    success: "bg-primary-fixed/55 text-on-primary-fixed-variant",
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
        <p className="mt-0.5 truncate text-xl font-extrabold text-on-surface">{value}</p>
        <p className="mt-0.5 text-xs text-on-surface-variant">{helper}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Exclude<TransactionStatus, "SEMUA"> }) {
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

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function createInvoicePdf(transaction: TransactionItem) {
  const lines = [
    "SIMKOPDES",
    "INVOICE PENJUALAN",
    "",
    `No Invoice: ${transaction.transaction_code}`,
    `ID Transaksi: ${transaction.transaction_id}`,
    `Tanggal: ${formatDate(transaction.transaction_date)} ${transaction.transaction_time} WIB`,
    `Status: ${displayLabel(transaction.status)}`,
    "",
    "Ditagihkan kepada:",
    transaction.customer_name,
    `Segmen: ${displayLabel(transaction.customer_category)}`,
    `Lokasi: ${displayLabel(transaction.city)}`,
    "",
    "Ringkasan:",
    `Kategori: ${displayLabel(transaction.category)}`,
    `Metode Pembayaran: ${displayLabel(transaction.payment_method)}`,
    `Basket: ${displayLabel(transaction.basket_mix_type)}`,
    `Musim: ${displayLabel(transaction.season)}`,
    `Promo: ${displayLabel(transaction.promotion)}`,
    "",
    "Produk:",
    ...transaction.products.map((product, index) => `${index + 1}. ${product}`),
    "",
    `Jumlah Item: ${transaction.product_count}`,
    `Total Pcs: ${transaction.total_pieces}`,
    `Total Pembayaran: ${formatRupiah(transaction.total_cost_idr)}`,
    "",
    "Terima kasih telah bertransaksi melalui SIMKOPDES.",
  ];

  const content = [
    "BT",
    "/F1 22 Tf",
    "50 790 Td",
    `(SIMKOPDES) Tj`,
    "/F1 16 Tf",
    "0 -28 Td",
    `(INVOICE PENJUALAN) Tj`,
    "/F1 10 Tf",
    ...lines.slice(2).flatMap((line) => [
      "0 -17 Td",
      `(${escapePdfText(line)}) Tj`,
    ]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function downloadInvoicePdf(transaction: TransactionItem) {
  const blob = createInvoicePdf(transaction);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `invoice-${transaction.transaction_code}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function DetailDrawer({ transaction, onClose }: { transaction: TransactionItem; onClose: () => void }) {
  const invoiceRows = transaction.products.map((product, index) => ({
    no: index + 1,
    name: product,
  }));

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Tutup detail transaksi"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-[min(42rem,100vw)] flex-col border-l border-outline-variant/30 bg-surface-container-lowest shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-md border-b border-outline-variant/25 p-md">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-normal text-primary">Invoice penjualan</p>
            <h2 className="mt-xs truncate text-xl font-extrabold text-on-surface">{transaction.transaction_code}</h2>
            <p className="mt-xs text-sm text-on-surface-variant">
              {formatDate(transaction.transaction_date)} - {transaction.transaction_time} WIB
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-xs">
            <button
              type="button"
              onClick={() => downloadInvoicePdf(transaction)}
              className="inline-flex min-h-11 items-center gap-xs rounded-xl bg-primary px-md py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-primary/90"
            >
              <MaterialIcon className="text-[18px]">download</MaterialIcon>
              PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup panel invoice"
              className="grid size-11 place-items-center rounded-xl text-on-surface-variant transition hover:bg-surface-container hover:text-primary"
            >
              <MaterialIcon className="text-[22px]">close</MaterialIcon>
            </button>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-md">
          <article className="overflow-hidden rounded-2xl border border-outline-variant/25 bg-white shadow-sm">
            <div className="border-b border-outline-variant/20 bg-surface-container-lowest p-md">
              <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xl font-extrabold text-on-surface">SIMKOPDES</p>
                  <p className="mt-1 text-sm text-on-surface-variant">Invoice transaksi penjualan koperasi</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-extrabold uppercase text-on-surface-variant">Total pembayaran</p>
                  <p className="mt-1 text-2xl font-extrabold text-primary">{formatRupiah(transaction.total_cost_idr)}</p>
                  <div className="mt-xs flex sm:justify-end">
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-md border-b border-outline-variant/20 p-md md:grid-cols-2">
              <section>
                <p className="text-xs font-extrabold uppercase tracking-normal text-on-surface-variant">Ditagihkan kepada</p>
                <h3 className="mt-xs text-base font-extrabold text-on-surface">{transaction.customer_name}</h3>
                <p className="text-sm text-on-surface-variant">{displayLabel(transaction.customer_category)}</p>
                <p className="mt-xs text-sm text-on-surface-variant">{displayLabel(transaction.city)}</p>
              </section>
              <section className="grid gap-xs text-sm text-on-surface-variant md:text-right">
                <p>
                  <span className="font-bold text-on-surface">No Invoice:</span> {transaction.transaction_code}
                </p>
                <p>
                  <span className="font-bold text-on-surface">ID:</span> {transaction.transaction_id}
                </p>
                <p>
                  <span className="font-bold text-on-surface">Tanggal:</span> {formatDate(transaction.transaction_date)}
                </p>
                <p>
                  <span className="font-bold text-on-surface">Metode:</span> {displayLabel(transaction.payment_method)}
                </p>
              </section>
            </div>

            <div className="grid gap-sm border-b border-outline-variant/20 p-md sm:grid-cols-3">
              <InvoiceMetric label="Kategori" value={displayLabel(transaction.category)} />
              <InvoiceMetric label="Basket" value={displayLabel(transaction.basket_mix_type)} />
              <InvoiceMetric label="Promo" value={displayLabel(transaction.promotion)} />
            </div>

            <section className="p-md">
              <div className="mb-sm flex items-center justify-between gap-sm">
                <p className="text-sm font-extrabold text-on-surface">Rincian Produk</p>
                <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-extrabold text-primary">
                  {transaction.product_count} item - {transaction.total_pieces} pcs
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-outline-variant/20">
                <table className="w-full text-sm">
                  <thead className="bg-surface-container text-left text-xs font-extrabold uppercase text-on-surface-variant">
                    <tr>
                      <th className="w-14 px-sm py-2">No</th>
                      <th className="px-sm py-2">Produk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {invoiceRows.map((row) => (
                      <tr key={`${row.name}-${row.no}`}>
                        <td className="px-sm py-2 font-extrabold text-primary">{row.no}</td>
                        <td className="px-sm py-2 font-bold text-on-surface">{row.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-sm border-t border-outline-variant/20 bg-surface-container-lowest p-md sm:grid-cols-2">
              <div className="text-sm text-on-surface-variant">
                <p className="font-bold text-on-surface">Catatan</p>
                <p className="mt-xs">Invoice dibuat otomatis dari data transaksi SIMKOPDES.</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-sm text-right">
                <p className="text-xs font-extrabold uppercase text-primary">Grand Total</p>
                <p className="mt-xs text-2xl font-extrabold text-primary">{formatRupiah(transaction.total_cost_idr)}</p>
              </div>
            </div>
          </article>
        </div>
      </aside>
    </div>
  );
}

function InvoiceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-sm">
      <p className="text-xs font-bold text-on-surface-variant">{label}</p>
      <p className="mt-xs font-extrabold text-on-surface">{value}</p>
    </div>
  );
}

export default function TransactionsPage() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TransactionItem | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<TransactionSortField>("transaction_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort_by: sortBy,
      order: sortOrder,
    });
    if (search) params.set("search", search);

    try {
      const response = await fetch(`/api/transactions?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as TransactionsPayload;

      if (!response.ok || !data.success) {
        throw new Error(data.detail ?? "Gagal memuat data transaksi");
      }

      setItems(data.items);
      setSummary(data.summary);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data transaksi");
      setItems([]);
      setSummary(null);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortBy, sortOrder]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTransactions();
  }, [fetchTransactions]);

  const handleSort = (field: TransactionSortField) => {
    setPage(1);
    if (field === sortBy) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setSortOrder(field === "transaction_at" || field === "total_cost_idr" ? "desc" : "asc");
  };

  const exportCsv = () => {
    const header = ["ID", "Tanggal", "Pelanggan", "Produk", "Total", "Metode", "Status"];
    const rows = items.map((item) => [
      item.transaction_code,
      `${item.transaction_date} ${item.transaction_time}`,
      item.customer_name,
      item.products.join(", "),
      item.total_cost_idr,
        displayLabel(item.payment_method),
        item.status,
      ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `data-transaksi-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-page dashboard-page-transactions flex flex-col gap-md">
      <section className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary via-[#315f25] to-[#19380f] p-lg text-white shadow-[0_18px_48px_-30px_rgba(24,53,15,0.85)]">
        <div className="flex flex-col gap-md lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-sm inline-flex items-center gap-xs rounded-full border border-white/15 bg-white/10 px-sm py-1 text-xs font-bold text-white/80">
              <MaterialIcon filled className="text-[16px]">
                database
              </MaterialIcon>
              Database KDMP
            </div>
            <h1 className="text-2xl font-extrabold text-white">Data Transaksi</h1>
            <p className="mt-xs max-w-3xl text-sm leading-relaxed text-white/78">
              Arsip transaksi anggota koperasi dari database backend dengan pengurutan dan pagination server-side.
            </p>
          </div>
          <div className="flex flex-wrap gap-xs">
            <button
              type="button"
              onClick={() => void fetchTransactions()}
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

      <section className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Transaksi"
          value={(summary?.total_transactions ?? 0).toLocaleString("id-ID")}
          helper="seluruh data transaksi"
          icon="receipt_long"
          tone="primary"
        />
        <KpiCard
          label="Total Nilai"
          value={formatRupiah(summary?.total_value_idr ?? 0)}
          helper="akumulasi penjualan"
          icon="payments"
          tone="success"
        />
        <KpiCard
          label="Rata-rata"
          value={formatRupiah(summary?.avg_value_idr ?? 0)}
          helper="per transaksi"
          icon="monitoring"
          tone="sky"
        />
        <KpiCard
          label="Pelanggan Unik"
          value={(summary?.unique_customers ?? 0).toLocaleString("id-ID")}
          helper={`${(summary?.total_pieces ?? 0).toLocaleString("id-ID")} pcs terjual`}
          icon="groups"
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
              <p className="font-extrabold">Data transaksi belum bisa dimuat</p>
              <p className="mt-xs text-sm">{error}</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="relative isolate flex min-h-0 flex-col overflow-hidden rounded-2xl border border-outline-variant/25 bg-surface-container-lowest shadow-sm">
        <div className="shrink-0 flex flex-col gap-sm p-md lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-on-surface">Tabel Data Transaksi</h2>
            <p className="text-sm text-on-surface-variant">
              {total.toLocaleString("id-ID")} transaksi dari tabel data backend
            </p>
          </div>
          <label className="flex min-h-11 w-full items-center gap-xs rounded-xl border border-outline-variant/20 bg-surface-container-low px-sm text-sm shadow-sm lg:w-[22rem]">
            <MaterialIcon className="text-[18px] text-on-surface-variant">search</MaterialIcon>
            <span className="sr-only">Cari data transaksi</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari pelanggan, produk, kota, ID..."
              className="min-w-0 flex-1 bg-transparent py-2 font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Bersihkan pencarian transaksi"
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
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[17%]" />
              <col className="w-[28%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="shadow-[0_12px_24px_rgba(47,63,38,0.18)]">
              <tr className="border-y" style={{ backgroundColor: "var(--color-primary)", borderColor: "var(--color-primary)" }}>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="transaction_id" active={sortBy} order={sortOrder} onSort={handleSort}>
                    ID
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="transaction_at" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Tanggal
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="customer_name" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Pelanggan
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">Produk</th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="total_cost_idr" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Total
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">
                  <SortButton field="payment_method" active={sortBy} order={sortOrder} onSort={handleSort}>
                    Metode
                  </SortButton>
                </th>
                <th className="px-md py-3 text-left text-[13px] font-extrabold uppercase tracking-normal text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl">
                    <LoadingState label="Memuat data transaksi" />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-md py-xl">
                    <EmptyState
                      title="Tidak ada transaksi"
                      text="Belum ada data transaksi yang dapat ditampilkan."
                      icon="receipt_long"
                    />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-outline-variant/10 transition hover:bg-surface-container-low">
                    <td className="px-md py-3">
                      <p className="font-mono text-xs font-extrabold text-primary">{item.transaction_code}</p>
                      <p className="text-[11px] text-on-surface-variant">{item.transaction_id}</p>
                    </td>
                    <td className="px-md py-3">
                      <p className="font-bold text-on-surface">{formatDate(item.transaction_date)}</p>
                      <p className="text-xs text-on-surface-variant">{item.transaction_time} WIB</p>
                    </td>
                    <td className="px-md py-3">
                      <p className="break-words font-extrabold leading-snug text-on-surface">{item.customer_name}</p>
                      <p className="text-[11px] text-on-surface-variant">{displayLabel(item.customer_category)}</p>
                    </td>
                    <td className="px-md py-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-bold leading-relaxed text-on-surface">{item.products.join(", ") || "-"}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.product_count} item - {item.total_pieces} pcs
                        </p>
                      </div>
                    </td>
                    <td className="px-md py-3 font-extrabold text-primary">{formatRupiah(item.total_cost_idr)}</td>
                        <td className="px-md py-3 text-sm font-bold text-on-surface">{displayLabel(item.payment_method)}</td>
                    <td className="px-md py-3">
                      <div className="flex flex-wrap items-center gap-xs">
                        <StatusBadge status={item.status} />
                      <button
                        type="button"
                        onClick={() => setSelected(item)}
                        aria-label={`Buka detail ${item.transaction_code}`}
                        className="inline-flex size-10 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface-variant shadow-sm transition hover:bg-primary hover:text-white"
                      >
                        <MaterialIcon className="text-[18px]">open_in_new</MaterialIcon>
                      </button>
                      </div>
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
          itemLabel="transaksi"
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
        />
      </section>

      {selected ? <DetailDrawer transaction={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}
