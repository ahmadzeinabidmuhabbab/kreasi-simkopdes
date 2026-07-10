"use client";

import React, { useState, useEffect } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

// ── Types ──────────────────────────────────────────────────────────────────
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
}

interface ShelfCell {
  cell: string;
  item: string;
  traffic: "HOT" | "WARM" | "COLD";
  visits: number;
  placement: string;
  tip: string;
}

interface BasketItem {
  itemA: string;
  itemB: string;
  confidence: number;
  support: number;
  lift: number;
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
  urgency: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRupiah(n: number) {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const statusMeta: Record<string, { color: string; dot: string; bg: string }> = {
  Kritis: { color: "text-red-700", dot: "bg-red-500", bg: "bg-red-50 border-red-200" },
  Perhatian: { color: "text-amber-700", dot: "bg-amber-500", bg: "bg-amber-50 border-amber-200" },
  Normal: { color: "text-sky-700", dot: "bg-sky-500", bg: "bg-sky-50 border-sky-200" },
  Aman: { color: "text-emerald-700", dot: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
};

const trafficMeta: Record<string, { label: string; color: string; bg: string; textColor: string }> = {
  HOT: { label: "HOT", color: "border-red-400", bg: "bg-red-50", textColor: "text-red-700" },
  WARM: { label: "WARM", color: "border-amber-400", bg: "bg-amber-50", textColor: "text-amber-700" },
  COLD: { label: "COLD", color: "border-emerald-400", bg: "bg-emerald-50", textColor: "text-emerald-700" },
};

const urgencyMeta: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function SmartBundle() {
  const [activeTab, setActiveTab] = useState<"procurement" | "shelf" | "pricing">("procurement");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shelf, setShelf] = useState<ShelfCell[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [dynamicPricing, setDynamicPricing] = useState<DynamicPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [invSearch, setInvSearch] = useState("");

  useEffect(() => {
    fetch("/api/bundle")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setInventory(data.inventory);
          setShelf(data.shelf);
          setBasket(data.basket);
          setBundles(data.bundles);
          setDynamicPricing(data.dynamicPricing);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Filter + sort inventory
  const filteredInventory = inventory.filter(i =>
    !invSearch ||
    i.name.toLowerCase().includes(invSearch.toLowerCase()) ||
    i.category.toLowerCase().includes(invSearch.toLowerCase())
  );
  const { sorted: sortedInventory, sortKey: invSortKey, sortDir: invSortDir, toggleSort: toggleInvSort } = useSortable(filteredInventory, "name");

  const criticalCount = inventory.filter((i) => i.status === "Kritis").length;
  const restockTotal = inventory.reduce((a, i) => a + i.restock, 0);

  return (
    <div className="dashboard-page dashboard-page-bundle space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-sm px-md py-sm bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl shadow-2xl font-semibold text-sm anim-fade-in-up">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="anim-fade-in-up">
        <div className="flex items-center gap-sm mb-xs">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-sky-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Smart Predictive Bundle</h1>
            <p className="text-sm text-on-surface-variant">Pengadaan · Penempatan Rak · Dynamic Pricing</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter anim-fade-in-up">
        {[
          { label: "Total Produk", value: inventory.length, icon: "inventory", color: "bg-sky-100 text-sky-700" },
          { label: "Stok Kritis", value: criticalCount, icon: "warning", color: "bg-red-100 text-red-700" },
          { label: "Perlu Restock", value: `${restockTotal} unit`, icon: "local_shipping", color: "bg-amber-100 text-amber-700" },
          { label: "Bundle Aktif", value: bundles.length, icon: "package_2", color: "bg-violet-100 text-violet-700" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md transition-shadow flex items-center gap-md">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-extrabold text-on-surface">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-xs bg-surface-container-low rounded-2xl p-1 w-fit flex-wrap">
        {[
          { key: "procurement", label: "Pengadaan & Restock", icon: "local_shipping" },
          { key: "shelf", label: "Penempatan Rak", icon: "shelves" },
          { key: "pricing", label: "Dynamic Pricing & Bundling", icon: "local_offer" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-xs px-md py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: PROCUREMENT ── */}
      {activeTab === "procurement" && (
        <div className="space-y-lg">
          {/* Stok Kritis Alert */}
          {criticalCount > 0 && (
            <div className="flex items-start gap-md p-md bg-red-50 border border-red-200 rounded-2xl">
              <span className="material-symbols-outlined text-red-600 text-2xl shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <div>
                <p className="font-bold text-red-800">{criticalCount} produk stok kritis — Segera lakukan restock!</p>
                <p className="text-sm text-red-700 mt-xs">
                  {inventory.filter(i => i.status === "Kritis").map(i => i.name).join(", ")}
                </p>
              </div>
              <button
                onClick={() => showToast("Pesanan restock dikirim ke supplier!")}
                className="ml-auto flex items-center gap-xs px-md py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Order Semua
              </button>
            </div>
          )}

          {/* Inventory Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="p-md border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-sm">
              <p className="font-extrabold text-on-surface">Status Stok & Rekomendasi Pengadaan</p>
              <div className="flex items-center gap-xs px-md py-2 bg-surface-container border border-outline-variant/30 rounded-xl focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
                <input type="text" placeholder="Cari produk..." value={invSearch} onChange={e => setInvSearch(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40 w-32" />
                {invSearch && <button onClick={() => setInvSearch("")} className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-primary">close</button>}
              </div>
            </div>
            {loading ? (
              <div className="p-md space-y-sm">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl shimmer" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant/20">
                      <SortableHeader label="Produk"               colKey="name"     current={invSortKey} dir={invSortDir} onSort={toggleInvSort} />
                      <SortableHeader label="Kategori"             colKey="category" current={invSortKey} dir={invSortDir} onSort={toggleInvSort} />
                      <SortableHeader label="Stok Saat Ini"        colKey="stock"    current={invSortKey} dir={invSortDir} onSort={toggleInvSort} />
                      <SortableHeader label="Stok Min."            colKey="minStock" current={invSortKey} dir={invSortDir} onSort={toggleInvSort} />
                      <SortableHeader label="Velocity/Minggu"      colKey="velocity" current={invSortKey} dir={invSortDir} onSort={toggleInvSort} />
                      <SortableHeader label="Status"               colKey="status"   current={invSortKey} dir={invSortDir} onSort={toggleInvSort} />
                      <SortableHeader label="Rekomendasi Restock"  colKey="restock"  current={invSortKey} dir={invSortDir} onSort={toggleInvSort} />
                      <th className="px-md py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedInventory.map((item) => {
                      const st = statusMeta[item.status] ?? statusMeta.Aman;
                      const stockPct = Math.min(100, Math.round((item.stock / item.minStock) * 100));
                      return (
                        <tr key={item.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-md py-3 font-bold text-on-surface">{item.name}</td>
                          <td className="px-md py-3">
                            <span className="text-[10px] font-semibold bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">{item.category}</span>
                          </td>
                          <td className="px-md py-3">
                            <div className="flex items-center gap-sm">
                              <div className="w-20 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{
                                  width: `${stockPct}%`,
                                  background: item.status === "Kritis" ? "#dc2626" : item.status === "Perhatian" ? "#d97706" : "#16a34a"
                                }} />
                              </div>
                              <span className="font-bold text-on-surface">{item.stock} {item.unit}</span>
                            </div>
                          </td>
                          <td className="px-md py-3 text-on-surface-variant">{item.minStock} {item.unit}</td>
                          <td className="px-md py-3 font-semibold text-on-surface">{item.velocity} {item.unit}</td>
                          <td className="px-md py-3">
                            <div className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              <span className={st.color}>{item.status}</span>
                            </div>
                          </td>
                          <td className="px-md py-3">
                            {item.restock > 0 ? (
                              <span className="font-bold text-primary">+{item.restock} {item.unit}</span>
                            ) : (
                              <span className="text-emerald-600 font-semibold text-xs">Stok Cukup</span>
                            )}
                          </td>
                          <td className="px-md py-3">
                            {item.restock > 0 && (
                              <button
                                onClick={() => showToast(`Order ${item.restock} ${item.unit} ${item.name} dikirim!`)}
                                className="flex items-center gap-xs px-sm py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-colors whitespace-nowrap"
                              >
                                <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                                Order
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Market Basket Analysis */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="p-md border-b border-outline-variant/20">
              <p className="font-extrabold text-on-surface">Market Basket Analysis</p>
              <p className="text-xs text-on-surface-variant mt-xs">Pasangan produk yang sering dibeli bersamaan — dasar rekomendasi bundle</p>
            </div>
            <div className="p-md grid md:grid-cols-2 gap-sm">
              {basket.map((b, i) => (
                <div key={i} className="flex items-center gap-md p-sm bg-surface-container-low rounded-xl border border-outline-variant/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-xs text-xs font-bold text-on-surface flex-wrap">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{b.itemA}</span>
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">add</span>
                      <span className="bg-secondary-container/50 text-secondary px-2 py-0.5 rounded-full">{b.itemB}</span>
                    </div>
                    <div className="flex gap-md mt-sm">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Confidence</p>
                        <p className="text-sm font-extrabold text-primary">{b.confidence}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Support</p>
                        <p className="text-sm font-extrabold text-on-surface">{b.support}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Lift</p>
                        <p className="text-sm font-extrabold text-amber-600">{b.lift}x</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SHELF ── */}
      {activeTab === "shelf" && (
        <div className="space-y-lg">
          {/* Legend */}
          <div className="flex flex-wrap gap-sm">
            {[
              { label: "HOT — Traffic Tinggi (>250 kunjungan/minggu)", color: "bg-red-500" },
              { label: "WARM — Traffic Sedang (150–250 kunjungan)", color: "bg-amber-500" },
              { label: "COLD — Traffic Rendah (<150 kunjungan)", color: "bg-emerald-500" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-xs text-[11px] font-semibold text-on-surface-variant">
                <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Shelf Grid */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-lg">
            <p className="font-extrabold text-on-surface mb-md">Peta Rak Toko (Visual Planogram)</p>
            <div className="flex flex-col gap-md">
              {/* Row labels */}
              {["A", "B", "C"].map((row) => {
                const rowCells = shelf.filter(s => s.cell.startsWith(row));
                return (
                  <div key={row} className="flex gap-sm items-stretch">
                    <div className="w-8 flex items-center justify-center bg-surface-container rounded-lg shrink-0">
                      <span className="text-[11px] font-black text-on-surface-variant -rotate-90">{row === "A" ? "Depan" : row === "B" ? "Tengah" : "Belakang"}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-sm">
                      {rowCells.map((cell) => {
                        const tm = trafficMeta[cell.traffic];
                        return (
                          <div
                            key={cell.cell}
                            className={`rounded-xl p-sm border-2 ${tm.color} ${tm.bg} group hover:shadow-md transition-all cursor-default relative`}
                          >
                            <div className="flex items-start justify-between mb-xs">
                              <span className="text-[10px] font-black text-on-surface-variant uppercase">{cell.cell}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${tm.bg} ${tm.textColor} border ${tm.color}`}>
                                {cell.traffic}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-on-surface leading-tight mb-xs">{cell.item}</p>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-[9px] text-on-surface-variant">{cell.placement}</p>
                                <p className="text-[9px] font-semibold text-on-surface-variant">{cell.visits} kunjungan/mgg</p>
                              </div>
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-0 mb-2 bg-on-surface text-surface text-[10px] p-sm rounded-lg shadow-xl z-10 w-52 hidden group-hover:block">
                              💡 {cell.tip}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {/* Column headers */}
              <div className="flex gap-sm pl-10">
                {["Kolom 1 (Kiri)", "Kolom 2 (Tengah)", "Kolom 3 (Kanan)"].map(c => (
                  <div key={c} className="flex-1 text-center text-[10px] font-bold text-on-surface-variant">{c}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Placement Tips Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="p-md border-b border-outline-variant/20">
              <p className="font-extrabold text-on-surface">Rekomendasi Penempatan AI</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/20">
                    {["Sel", "Produk", "Traffic", "Kunjungan/Mgg", "Penempatan", "Rekomendasi AI"].map(h => (
                      <th key={h} className="text-left px-md py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shelf.map((cell) => {
                    const tm = trafficMeta[cell.traffic];
                    return (
                      <tr key={cell.cell} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-md py-3 font-mono font-bold text-primary">{cell.cell}</td>
                        <td className="px-md py-3 font-semibold text-on-surface">{cell.item}</td>
                        <td className="px-md py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${tm.color} ${tm.bg} ${tm.textColor}`}>{cell.traffic}</span>
                        </td>
                        <td className="px-md py-3 font-semibold text-on-surface">{cell.visits}</td>
                        <td className="px-md py-3 text-on-surface-variant text-xs">{cell.placement}</td>
                        <td className="px-md py-3 text-xs text-on-surface-variant italic">💡 {cell.tip}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DYNAMIC PRICING ── */}
      {activeTab === "pricing" && (
        <div className="space-y-lg">
          {/* Dynamic Pricing */}
          <div>
            <div className="mb-md">
              <h2 className="font-extrabold text-on-surface text-lg">Rekomendasi Dynamic Pricing</h2>
              <p className="text-sm text-on-surface-variant mt-xs">Penyesuaian harga berbasis kondisi stok, demand, dan MBA secara real-time</p>
            </div>
            <div className="grid md:grid-cols-2 gap-gutter">
              {dynamicPricing.map((dp) => {
                const isUp = dp.suggestedPrice > dp.currentPrice;
                const diff = Math.abs(dp.suggestedPrice - dp.currentPrice);
                const pct = Math.round((diff / dp.currentPrice) * 100);
                return (
                  <div key={dp.id} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-md">
                      <div>
                        <p className="font-extrabold text-on-surface">{dp.item}</p>
                        <div className={`inline-flex items-center gap-xs mt-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urgencyMeta[dp.urgency]}`}>
                          Urgensi: {dp.urgency === "high" ? "Tinggi" : dp.urgency === "medium" ? "Sedang" : "Rendah"}
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUp ? "bg-red-100" : "bg-emerald-100"}`}>
                        <span className={`material-symbols-outlined text-xl ${isUp ? "text-red-600" : "text-emerald-600"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                          {isUp ? "trending_up" : "trending_down"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-lg mb-md">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Harga Saat Ini</p>
                        <p className="text-xl font-extrabold text-on-surface">{formatRupiah(dp.currentPrice)}</p>
                      </div>
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">arrow_forward</span>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Harga Saran AI</p>
                        <p className={`text-xl font-extrabold ${isUp ? "text-red-600" : "text-emerald-600"}`}>
                          {formatRupiah(dp.suggestedPrice)}
                        </p>
                      </div>
                      <div className={`ml-auto px-sm py-xs rounded-xl text-sm font-extrabold ${isUp ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {isUp ? "+" : "-"}{pct}%
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed mb-md italic">"{dp.reason}"</p>

                    <button
                      onClick={() => showToast(`Harga ${dp.item} diperbarui → ${formatRupiah(dp.suggestedPrice)}`)}
                      className="w-full flex items-center justify-center gap-xs py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Terapkan Harga Baru
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Bundles */}
          <div>
            <div className="mb-md">
              <h2 className="font-extrabold text-on-surface text-lg">Paket Bundle Rekomendasi</h2>
              <p className="text-sm text-on-surface-variant mt-xs">Bundling produk berbasis Market Basket Analysis untuk mengoptimalkan revenue</p>
            </div>
            <div className="grid md:grid-cols-3 gap-gutter">
              {bundles.map((b) => (
                <div key={b.id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
                  {/* Top badge */}
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-md py-sm border-b border-outline-variant/20 flex items-center justify-between">
                    <p className="font-extrabold text-on-surface text-sm">{b.name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-current/20 ${b.badgeColor}`}>{b.badge}</span>
                  </div>
                  <div className="p-md space-y-md">
                    {/* Items */}
                    <div className="space-y-xs">
                      {b.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-xs text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-[12px] text-primary">check_circle</span>
                          {item}
                        </div>
                      ))}
                    </div>
                    {/* Pricing */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Harga Normal</p>
                        <p className="text-sm text-on-surface-variant line-through">{formatRupiah(b.normalPrice)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Harga Bundle</p>
                        <p className="text-xl font-extrabold text-primary">{formatRupiah(b.bundlePrice)}</p>
                      </div>
                      <div className="bg-primary text-white text-sm font-extrabold w-12 h-12 rounded-full flex items-center justify-center shadow-md">
                        -{b.discount}%
                      </div>
                    </div>
                    {/* Stats */}
                    <div className="flex gap-md pt-sm border-t border-outline-variant/10">
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Terjual</p>
                        <p className="font-extrabold text-on-surface">{b.sold}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">Stok Bundle</p>
                        <p className="font-extrabold text-on-surface">{b.stock}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant italic">💡 {b.impact}</p>
                    <button
                      onClick={() => showToast(`Bundle "${b.name}" diaktifkan!`)}
                      className="w-full py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all"
                    >
                      Aktifkan Bundle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
