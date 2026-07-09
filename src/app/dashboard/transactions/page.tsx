"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

// ── Types ──────────────────────────────────────────────────────────────────
interface TrxItem { name: string; qty: number; unit: string; price: number }
interface Transaction {
  id: string; date: string; time: string;
  memberId: string; memberName: string;
  items: TrxItem[]; category: string;
  total: number; paymentMethod: string;
  status: "SELESAI" | "DIPROSES" | "MENUNGGU";
}
interface Summary { total: number; totalValue: number; avgValue: number; byStatus: Record<string, number> }

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const statusMeta: Record<string, { label: string; color: string; dot: string }> = {
  SELESAI:  { label: "Selesai",  color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  DIPROSES: { label: "Diproses", color: "bg-sky-100 text-sky-700",         dot: "bg-sky-500 animate-pulse" },
  MENUNGGU: { label: "Menunggu", color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500 animate-pulse" },
};

const paymentColors: Record<string, string> = {
  "Tunai":           "bg-emerald-50 text-emerald-700",
  "Transfer":        "bg-sky-50 text-sky-700",
  "Kredit Anggota":  "bg-violet-50 text-violet-700",
};

// ── Detail Modal ───────────────────────────────────────────────────────────
function DetailModal({ trx, onClose }: { trx: Transaction; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const s = statusMeta[trx.status];

  const handleCopy = () => {
    navigator.clipboard.writeText(trx.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-[28px] shadow-2xl border border-outline-variant/30 w-[95%] sm:w-full max-w-[512px] p-6 overflow-y-auto max-h-[90vh] anim-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-md border-b border-outline-variant/20 pb-sm">
          <div className="space-y-xs">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[20px] text-primary">receipt_long</span>
              <h2 className="font-extrabold text-base text-on-surface tracking-tight font-mono">{trx.id}</h2>
              <button 
                onClick={handleCopy} 
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all duration-200" 
                title="Salin ID Transaksi"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {copied ? "check" : "content_copy"}
                </span>
              </button>
              {copied && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-semibold animate-pulse">Tersalin</span>}
            </div>
            <p className="text-[11px] text-on-surface-variant/80 font-medium">{trx.date} · {trx.time} WIB</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Status + payment metadata */}
        <div className="flex flex-wrap gap-xs mb-md">
          <span className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold ${s.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
          <span className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold ${paymentColors[trx.paymentMethod] || "bg-gray-100 text-gray-700"}`}>
            <span className="material-symbols-outlined text-[12px]">payments</span>
            {trx.paymentMethod}
          </span>
          <span className="inline-flex items-center gap-xs px-2.5 py-1 bg-surface-container rounded-full text-[10px] font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[12px]">sell</span>
            {trx.category}
          </span>
        </div>

        {/* Member Card */}
        <div className="flex items-center gap-sm p-md bg-surface-container-low border border-outline-variant/15 rounded-2xl mb-md">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-extrabold shrink-0 border border-primary/20">
            {trx.memberName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider leading-none">Pembeli</p>
            <p className="font-extrabold text-on-surface text-sm truncate mt-0.5">{trx.memberName}</p>
            <p className="text-[10px] text-on-surface-variant/80 font-mono mt-0.5">{trx.memberId}</p>
          </div>
        </div>

        {/* Items List (Invoice Receipt Style) */}
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/20 mb-md shadow-sm">
          <div className="px-md py-2.5 bg-surface-container border-b border-outline-variant/20 flex items-center justify-between">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Rincian Belanja</p>
            <span className="text-[10px] font-semibold text-on-surface-variant/70">{trx.items.length} Barang</span>
          </div>
          <div className="divide-y divide-outline-variant/10">
            {trx.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-md py-3 hover:bg-surface-container-low/30 transition-colors">
                <div>
                  <p className="font-bold text-xs text-on-surface">{item.name}</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    {item.qty} {item.unit} × {fmt(item.price)}
                  </p>
                </div>
                <p className="font-extrabold text-xs text-primary">{fmt(item.qty * item.price)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total Price Section with Receipt Cutoff Dash design */}
        <div className="border-t border-dashed border-outline-variant/50 pt-md mt-md flex items-center justify-between p-md bg-primary/5 rounded-2xl border border-primary/10">
          <div>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-none">Total Pembayaran</p>
            <p className="font-extrabold text-primary text-sm mt-1">Metode: {trx.paymentMethod}</p>
          </div>
          <p className="text-xl font-extrabold text-primary tracking-tight font-mono">{fmt(trx.total)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTrx, setDetailTrx] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [filterCategory, setFilterCategory] = useState("SEMUA");
  const [filterStatus, setFilterStatus] = useState("SEMUA");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate, category: filterCategory, status: filterStatus });
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        setSummary(data.summary);
        setCategories(["SEMUA", ...data.categories]);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [startDate, endDate, filterCategory, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = transactions.filter(t =>
    !searchQuery ||
    t.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const { sorted: sortedFiltered, sortKey, sortDir, toggleSort } = useSortable(filtered, "date");

  // Export CSV
  const exportCsv = () => {
    const headers = ["ID Transaksi", "Tanggal", "Jam", "ID Anggota", "Nama Anggota", "Kategori", "Barang", "Total", "Metode Pembayaran", "Status"];
    const rows = filtered.map(t => [
      t.id, t.date, t.time, t.memberId, t.memberName, t.category,
      t.items.map(i => `${i.name} (${i.qty} ${i.unit})`).join("; "),
      t.total, t.paymentMethod, t.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `transaksi_${startDate}_${endDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-sky-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Riwayat Transaksi</h1>
            <p className="text-sm text-on-surface-variant">Seluruh transaksi penjualan anggota koperasi</p>
          </div>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-sm px-lg py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all">
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {[
            { label: "Total Transaksi", value: summary.total, icon: "receipt_long", color: "bg-sky-100 text-sky-700" },
            { label: "Total Nilai", value: fmt(summary.totalValue), icon: "payments", color: "bg-emerald-100 text-emerald-700" },
            { label: "Rata-rata / Transaksi", value: fmt(summary.avgValue), icon: "analytics", color: "bg-violet-100 text-violet-700" },
            { label: "Selesai", value: `${summary.byStatus.SELESAI || 0}/${summary.total}`, icon: "check_circle", color: "bg-amber-100 text-amber-700" },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md transition-shadow flex items-center gap-md">
              <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
                <p className="text-lg font-extrabold text-on-surface">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-md">
        <div className="flex flex-wrap gap-md items-end">
          {/* Date range */}
          <div className="flex items-center gap-sm flex-wrap">
            <div className="space-y-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Dari Tanggal</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate}
                className="px-md py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div className="self-end pb-2"><span className="text-on-surface-variant font-bold">→</span></div>
            <div className="space-y-xs">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate}
                className="px-md py-2 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors" />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-xs">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Kategori</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="px-md py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-xs">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-md py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors">
              {["SEMUA", "SELESAI", "DIPROSES", "MENUNGGU"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Search */}
          <div className="space-y-xs flex-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Cari</label>
            <div className="flex items-center gap-xs px-md py-2 bg-surface-container border border-outline-variant/30 rounded-xl focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
              <input type="text" placeholder="Anggota, ID, atau barang..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-primary">close</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-sm text-on-surface-variant">
        <span>Menampilkan <strong className="text-on-surface">{sortedFiltered.length}</strong> transaksi</span>
        {summary && <span>Total nilai: <strong className="text-primary">{fmt(sortedFiltered.reduce((a, t) => a + t.total, 0))}</strong></span>}
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/20">
                <SortableHeader label="ID Transaksi"  colKey="id"            current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Tanggal"       colKey="date"          current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Anggota"       colKey="memberName"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="text-left px-md py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Barang</th>
                <SortableHeader label="Kategori"      colKey="category"      current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Total"         colKey="total"         current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Pembayaran"    colKey="paymentMethod" current={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Status"        colKey="status"        current={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-md py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-2xl text-on-surface-variant">
                  <span className="material-symbols-outlined text-3xl animate-spin block mb-sm">sync</span>Memuat data...
                </td></tr>
              ) : sortedFiltered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-2xl text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl text-outline block mb-md">inbox</span>Tidak ada transaksi
                </td></tr>
              ) : sortedFiltered.map(t => {
                const s = statusMeta[t.status];
                return (
                  <tr key={t.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-md py-3 font-mono text-xs text-primary font-bold whitespace-nowrap">{t.id}</td>
                    <td className="px-md py-3 text-xs text-on-surface-variant whitespace-nowrap">
                      <p className="font-semibold text-on-surface">{t.date}</p>
                      <p>{t.time} WIB</p>
                    </td>
                    <td className="px-md py-3">
                      <p className="font-bold text-on-surface whitespace-nowrap">{t.memberName}</p>
                      <p className="text-[10px] font-mono text-on-surface-variant">{t.memberId}</p>
                    </td>
                    <td className="px-md py-3 text-xs text-on-surface-variant max-w-[180px]">
                      {t.items.map((i, idx) => <p key={idx} className="truncate">{i.name} ({i.qty} {i.unit})</p>)}
                    </td>
                    <td className="px-md py-3"><span className="text-xs bg-surface-container px-2 py-1 rounded-full font-semibold text-on-surface-variant whitespace-nowrap">{t.category}</span></td>
                    <td className="px-md py-3 font-extrabold text-primary whitespace-nowrap">{fmt(t.total)}</td>
                    <td className="px-md py-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${paymentColors[t.paymentMethod] || "bg-gray-100 text-gray-700"}`}>{t.paymentMethod}</span>
                    </td>
                    <td className="px-md py-3">
                      <span className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${s.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                      </span>
                    </td>
                    <td className="px-md py-3">
                      <button onClick={() => setDetailTrx(t)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors" title="Detail">
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailTrx && <DetailModal trx={detailTrx} onClose={() => setDetailTrx(null)} />}
    </div>
  );
}
