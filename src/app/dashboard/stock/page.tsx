"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

// ── Types ──────────────────────────────────────────────────────────────────
interface StockItem {
  id: number; sku: string; name: string; category: string;
  stock: number; minStock: number; unit: string;
  buyPrice: number; sellPrice: number;
  supplier: string; lastRestock: string;
  stockStatus: "AMAN" | "RENDAH" | "KRITIS" | "HABIS";
}
interface Summary { totalSku: number; aman: number; rendah: number; kritis: number; habis: number; totalValue: number }

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const statusMeta: Record<string, { label: string; color: string; dot: string; bar: string }> = {
  AMAN:   { label: "Aman",   color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  RENDAH: { label: "Rendah", color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500",   bar: "bg-amber-500"  },
  KRITIS: { label: "Kritis", color: "bg-red-100 text-red-700",         dot: "bg-red-500 animate-pulse", bar: "bg-red-500" },
  HABIS:  { label: "Habis",  color: "bg-gray-100 text-gray-500",       dot: "bg-gray-400",    bar: "bg-gray-400"  },
};

// ── Restock Modal ──────────────────────────────────────────────────────────
function RestockModal({ item, onClose, onSave }: { item: StockItem; onClose: () => void; onSave: (id: number, qty: number) => Promise<void> }) {
  const [qty, setQty] = useState(0);
  const [saving, setSaving] = useState(false);

  const nextStock = item.stock + qty;
  let projectedStatus: "AMAN" | "RENDAH" | "KRITIS" | "HABIS" = "AMAN";
  if (nextStock <= 0) projectedStatus = "HABIS";
  else if (nextStock <= item.minStock / 2) projectedStatus = "KRITIS";
  else if (nextStock <= item.minStock) projectedStatus = "RENDAH";

  const currentMeta = statusMeta[item.stockStatus];
  const projectedMeta = statusMeta[projectedStatus];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-[28px] shadow-2xl border border-outline-variant/30 w-[95%] sm:w-full max-w-[448px] p-6 anim-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-md">
          <div className="flex items-center gap-xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]">local_shipping</span>
            </div>
            <div>
              <h2 className="font-extrabold text-base text-on-surface">Restock Barang</h2>
              <p className="text-[10px] font-medium text-on-surface-variant/80 uppercase tracking-wide">Penerimaan Inventaris</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all duration-200">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Item Details Info Card */}
        <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-md mb-md">
          <div className="flex items-start justify-between gap-sm mb-xs">
            <div>
              <p className="font-mono text-[10px] text-on-surface-variant font-bold">{item.sku}</p>
              <p className="font-extrabold text-on-surface text-base leading-tight mt-0.5">{item.name}</p>
            </div>
            <span className={`inline-flex items-center gap-xs px-2 py-0.5 rounded-full text-[10px] font-bold ${currentMeta.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${currentMeta.dot}`} />
              {currentMeta.label}
            </span>
          </div>
          <div className="border-t border-outline-variant/10 mt-sm pt-xs flex justify-between text-xs text-on-surface-variant">
            <span>Stok saat ini:</span>
            <span className="font-bold text-on-surface">{item.stock} {item.unit} <span className="font-normal text-on-surface-variant/60">(Min: {item.minStock})</span></span>
          </div>
        </div>

        {/* Quantity Form */}
        <div className="space-y-sm mb-lg">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Jumlah Penambahan</label>
            <span className="text-[10px] text-on-surface-variant/80 font-bold bg-surface-container px-2 py-0.5 rounded-md">Satuan: {item.unit}</span>
          </div>
          
          <div className="flex items-center gap-sm">
            <button 
              type="button"
              onClick={() => setQty(q => Math.max(0, q - 1))} 
              className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high font-bold text-xl transition-all active:scale-95 shadow-sm"
            >
              −
            </button>
            <input 
              type="number" 
              value={qty || ""} 
              min={0} 
              placeholder="0"
              onChange={e => setQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="flex-1 text-center px-md py-3 bg-surface-container border border-outline-variant/30 rounded-xl font-extrabold text-2xl text-on-surface focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant/20" 
            />
            <button 
              type="button"
              onClick={() => setQty(q => q + 1)} 
              className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high font-bold text-xl transition-all active:scale-95 shadow-sm"
            >
              +
            </button>
          </div>

          {/* Real-time Status Preview */}
          <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-sm space-y-xs">
            <div className="flex justify-between text-xs">
              <span className="text-on-surface-variant">Stok setelah restock:</span>
              <strong className="text-primary font-extrabold">{nextStock} {item.unit}</strong>
            </div>
            {qty > 0 && (
              <div className="flex justify-between items-center text-xs pt-xs border-t border-outline-variant/10">
                <span className="text-on-surface-variant">Proyeksi status:</span>
                <span className={`inline-flex items-center gap-xs px-2 py-0.5 rounded-full text-[10px] font-bold ${projectedMeta.color} transition-all duration-300`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${projectedMeta.dot}`} />
                  {projectedMeta.label}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-md">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-3 border border-outline-variant/40 rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container transition-all active:scale-98"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={async () => { setSaving(true); await onSave(item.id, nextStock); setSaving(false); onClose(); }}
            disabled={qty === 0 || saving}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/95 transition-all active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-primary/10 flex items-center justify-center gap-xs"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Simpan (+{qty})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("SEMUA");
  const [filterStatus, setFilterStatus] = useState("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");
  const [restockItem, setRestockItem] = useState<StockItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">("table");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category: filterCategory, status: filterStatus });
      const res = await fetch(`/api/stock?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setSummary(data.summary);
        setCategories(["SEMUA", ...data.categories]);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filterCategory, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRestock = async (id: number, newStock: number) => {
    try {
      const res = await fetch("/api/stock", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stock: newStock }),
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); fetchData(); }
      else showToast(data.message, "error");
    } catch { showToast("Terjadi kesalahan", "error"); }
  };

  const exportCsv = () => {
    const headers = ["SKU", "Nama Barang", "Kategori", "Stok", "Min Stok", "Satuan", "Harga Beli", "Harga Jual", "Status", "Supplier", "Terakhir Restock"];
    const rows = filtered.map(i => [i.sku, i.name, i.category, i.stock, i.minStock, i.unit, i.buyPrice, i.sellPrice, i.stockStatus, i.supplier, i.lastRestock]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `stok_barang_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const filtered = items.filter(i =>
    !searchQuery ||
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: kritis/habis first by default (overridable via column sort)
  const statusSorted = [...filtered].sort((a, b) => {
    const order = { HABIS: 0, KRITIS: 1, RENDAH: 2, AMAN: 3 };
    return (order[a.stockStatus] ?? 4) - (order[b.stockStatus] ?? 4);
  });

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(statusSorted);

  return (
    <div className="space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-sm px-md py-sm rounded-2xl shadow-2xl font-semibold text-sm border ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{toast.type === "success" ? "check_circle" : "error"}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>warehouse</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Stok Barang</h1>
            <p className="text-sm text-on-surface-variant">Inventaris barang koperasi · Monitoring stok real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          {/* View toggle */}
          <div className="flex gap-xs bg-surface-container-low rounded-xl p-0.5">
            {([["table", "table_rows"], ["card", "grid_view"]] as const).map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${viewMode === mode ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="flex items-center gap-xs px-md py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all">
            <span className="material-symbols-outlined text-[18px]">sync</span>Refresh
          </button>
          <button onClick={exportCsv} className="flex items-center gap-sm px-md py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all">
            <span className="material-symbols-outlined text-[18px]">download</span>Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
          {[
            { label: "Total SKU",    value: summary.totalSku,        icon: "inventory_2",   color: "bg-violet-100 text-violet-700" },
            { label: "Stok Aman",   value: summary.aman,            icon: "check_circle",  color: "bg-emerald-100 text-emerald-700" },
            { label: "Stok Rendah", value: summary.rendah,          icon: "warning",       color: "bg-amber-100 text-amber-700" },
            { label: "Stok Kritis", value: summary.kritis,          icon: "error",         color: "bg-red-100 text-red-700" },
            { label: "Nilai Inv.",  value: fmt(summary.totalValue),  icon: "payments",      color: "bg-sky-100 text-sky-700" },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-sm`}>
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </div>
              <p className="text-xl font-extrabold text-on-surface">{s.value}</p>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Critical alert banner */}
      {summary && (summary.kritis > 0 || summary.habis > 0) && (
        <div className="flex items-center gap-sm p-md bg-red-50 border border-red-200 rounded-2xl">
          <span className="material-symbols-outlined text-red-600 text-[24px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div>
            <p className="font-bold text-red-700">Perhatian: {summary.kritis} barang kritis & {summary.habis} barang habis stok</p>
            <p className="text-xs text-red-600">Segera lakukan restock untuk memastikan ketersediaan barang.</p>
          </div>
          <button onClick={() => setFilterStatus("KRITIS")} className="ml-auto px-md py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors whitespace-nowrap">
            Lihat Stok Kritis
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-md items-end bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-md">
        <div className="space-y-xs">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Kategori</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-md py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-xs">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status Stok</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-md py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors">
            {["SEMUA", "AMAN", "RENDAH", "KRITIS", "HABIS"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-xs flex-1 min-w-[180px]">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Cari Barang</label>
          <div className="flex items-center gap-xs px-md py-2 bg-surface-container border border-outline-variant/30 rounded-xl focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
            <input type="text" placeholder="Nama barang, SKU, atau supplier..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-primary">close</button>}
          </div>
        </div>
        <p className="text-sm text-on-surface-variant self-center">
          <strong className="text-on-surface">{sorted.length}</strong> item
        </p>
      </div>

      {/* ══ TABLE VIEW ══ */}
      {viewMode === "table" && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant/20">
                  <SortableHeader label="SKU"              colKey="sku"         current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Nama Barang"      colKey="name"        current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Kategori"         colKey="category"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Stok / Min"       colKey="stock"       current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Satuan"           colKey="unit"        current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Harga Beli"       colKey="buyPrice"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Harga Jual"       colKey="sellPrice"   current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Supplier"         colKey="supplier"    current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Terakhir Restock" colKey="lastRestock" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Status"           colKey="stockStatus" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="px-md py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} className="text-center py-2xl text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl animate-spin block mb-sm">sync</span>Memuat data...
                  </td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan={11} className="text-center py-2xl text-on-surface-variant">
                    <span className="material-symbols-outlined text-5xl text-outline block mb-md">inventory_2</span>Tidak ada data
                  </td></tr>
                ) : sorted.map(item => {
                  const s = statusMeta[item.stockStatus];
                  const pct = Math.min(100, Math.round((item.stock / Math.max(item.minStock * 2, 1)) * 100));
                  return (
                    <tr key={item.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors ${item.stockStatus === "KRITIS" ? "bg-red-50/30" : item.stockStatus === "HABIS" ? "bg-gray-50" : ""}`}>
                      <td className="px-md py-3 font-mono text-xs text-on-surface-variant">{item.sku}</td>
                      <td className="px-md py-3 font-bold text-on-surface whitespace-nowrap">{item.name}</td>
                      <td className="px-md py-3"><span className="text-xs bg-surface-container px-2 py-1 rounded-full font-semibold text-on-surface-variant">{item.category}</span></td>
                      <td className="px-md py-3">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-on-surface text-sm">{item.stock} <span className="text-xs text-on-surface-variant font-normal">/ {item.minStock}</span></p>
                          <div className="h-1.5 w-20 bg-outline-variant/20 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-md py-3 text-xs text-on-surface-variant">{item.unit}</td>
                      <td className="px-md py-3 text-xs text-on-surface-variant">{fmt(item.buyPrice)}</td>
                      <td className="px-md py-3 font-semibold text-emerald-600 text-xs">{fmt(item.sellPrice)}</td>
                      <td className="px-md py-3 text-xs text-on-surface-variant max-w-[130px] truncate">{item.supplier}</td>
                      <td className="px-md py-3 text-xs text-on-surface-variant whitespace-nowrap">{item.lastRestock}</td>
                      <td className="px-md py-3">
                        <span className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${s.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                        </span>
                      </td>
                      <td className="px-md py-3">
                        <button onClick={() => setRestockItem(item)} className="flex items-center gap-xs px-sm py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-all whitespace-nowrap">
                          <span className="material-symbols-outlined text-[14px]">add</span>Restock
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

      {/* ══ CARD VIEW ══ */}
      {viewMode === "card" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-gutter">
          {loading ? (
            <div className="col-span-full text-center py-2xl text-on-surface-variant">
              <span className="material-symbols-outlined text-3xl animate-spin block mb-sm">sync</span>Memuat data...
            </div>
          ) : sorted.map(item => {
            const s = statusMeta[item.stockStatus];
            const pct = Math.min(100, Math.round((item.stock / Math.max(item.minStock * 2, 1)) * 100));
            return (
              <div key={item.id} className={`bg-surface-container-lowest rounded-2xl border p-md space-y-sm hover:shadow-md transition-shadow ${item.stockStatus === "KRITIS" ? "border-red-200" : "border-outline-variant/20"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] text-on-surface-variant">{item.sku}</p>
                    <p className="font-extrabold text-sm text-on-surface leading-tight">{item.name}</p>
                  </div>
                  <span className={`inline-flex items-center gap-xs px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${s.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}
                  </span>
                </div>

                <div className="space-y-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Stok</span>
                    <span className="font-extrabold text-on-surface">{item.stock} {item.unit}</span>
                  </div>
                  <div className="h-2 bg-outline-variant/20 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-on-surface-variant">Min: {item.minStock} {item.unit}</p>
                </div>

                <div className="border-t border-outline-variant/10 pt-sm space-y-xs">
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Harga Beli</span>
                    <span className="font-semibold text-on-surface">{fmt(item.buyPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-on-surface-variant">Harga Jual</span>
                    <span className="font-semibold text-emerald-600">{fmt(item.sellPrice)}</span>
                  </div>
                </div>

                <div className="pt-xs">
                  <button onClick={() => setRestockItem(item)} className="w-full flex items-center justify-center gap-xs py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-all">
                    <span className="material-symbols-outlined text-[14px]">add</span>Tambah Stok
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <RestockModal item={restockItem} onClose={() => setRestockItem(null)} onSave={handleRestock} />
      )}
    </div>
  );
}
