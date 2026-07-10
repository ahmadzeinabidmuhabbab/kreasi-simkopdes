"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

// ── Types ──────────────────────────────────────────────────────────────────
interface Prediction {
  id: number; source: string; commodity: string; category: string;
  volume: number; unit: string; price: number; confidence: number;
  analysis: string; text: string;
}
interface RfqRecord {
  id: number; date: string; time: string; commodity: string; category: string;
  volume: number; price: number; value: number;
  status: "DISETUJUI" | "DIPROSES" | "DITOLAK" | "MENUNGGU"; source: string;
}
interface NewsItem {
  id: number; source: "Google Trends" | "Berita Lokal Kabupaten";
  sourceIcon: string; title: string; text: string; keyword: string;
  region: string; mediaName?: string; trendScore?: number; publishedAt: string;
}
interface Summary { totalRfq: number; approvedRfq: number; approvalRate: number; totalValue: number }
interface TopCategory { category: string; value: number }

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRupiah(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

const statusMeta: Record<string, { label: string; color: string; dot: string }> = {
  DISETUJUI: { label: "Disetujui", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  DIPROSES:  { label: "Diproses",  color: "bg-sky-100 text-sky-700",         dot: "bg-sky-500" },
  DITOLAK:   { label: "Ditolak",   color: "bg-red-100 text-red-700",         dot: "bg-red-500" },
  MENUNGGU:  { label: "Menunggu",  color: "bg-amber-100 text-amber-700",     dot: "bg-amber-500 animate-pulse" },
};

const sourceColors: Record<string, string> = {
  "Google Trends":          "bg-blue-100 text-blue-700",
  "Berita Lokal Kabupaten": "bg-orange-100 text-orange-700",
};

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-sm px-md py-sm rounded-2xl shadow-2xl font-semibold text-sm anim-fade-in-up border ${
      type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
    }`}>
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}

// ── Full Text Modal ────────────────────────────────────────────────────────
function TextModal({ title, text, source, region, onClose }: { title: string; text: string; source: string; region: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-full max-w-2xl p-xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-md mb-md shrink-0">
          <div>
            <div className="flex items-center gap-sm mb-xs flex-wrap">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sourceColors[source] ?? "bg-gray-100 text-gray-700"}`}>{source}</span>
              <span className="text-[11px] text-on-surface-variant">{region}</span>
            </div>
            <h2 className="font-extrabold text-on-surface leading-snug">{title}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors shrink-0">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-xs">
          <p className="text-sm text-on-surface leading-loose whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DemandIntelligence() {
  const [activeTab, setActiveTab] = useState<"analysis" | "history">("analysis");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [rfqHistory, setRfqHistory] = useState<RfqRecord[]>([]);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("SEMUA");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [fullTextItem, setFullTextItem] = useState<NewsItem | Prediction | null>(null);
  const [fullTextType, setFullTextType] = useState<"news" | "prediction">("news");

  // Date range for generate
  const today = new Date().toISOString().split("T")[0];
  const nextMonth = new Date(Date.now() + 30 * 86400_000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(nextMonth);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/demand");
      const data = await res.json();
      if (data.success) {
        setRfqHistory(data.rfqHistory);
        setNewsData(data.news);
        setSummary(data.summary);
        setTopCategories(data.topCategories);
      }
    } catch {
      showToast("Gagal memuat data dari server", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    if (!startDate || !endDate) { showToast("Pilih rentang tanggal terlebih dahulu", "error"); return; }
    setGenerating(true);
    setPredictions([]);
    try {
      const res = await fetch("/api/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", startDate, endDate }),
      });
      const data = await res.json();
      if (data.success) {
        setPredictions(data.predictions);
        showToast(`${data.predictions.length} prediksi AI berhasil di-generate!`, "success");
      }
    } catch {
      showToast("Gagal menghasilkan prediksi", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveRfq = async (pred: Prediction) => {
    setApprovingId(pred.id);
    try {
      const res = await fetch("/api/demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", commodity: pred.commodity, category: pred.category, volume: pred.volume, price: pred.price, source: pred.source }),
      });
      const data = await res.json();
      if (data.success) {
        setRfqHistory(data.history);
        setSummary(prev => prev ? { ...prev, totalRfq: prev.totalRfq + 1 } : prev);
        showToast(`RFQ "${pred.commodity}" berhasil diajukan!`, "success");
      }
    } catch {
      showToast("Gagal mengajukan RFQ", "error");
    } finally {
      setApprovingId(null);
    }
  };

  // Download news CSV
  const downloadNewsCsv = () => {
    const headers = ["ID", "Sumber", "Media", "Judul", "Kata Kunci", "Wilayah", "Tren Score", "Tanggal", "Teks Lengkap"];
    const rows = newsData.map(n => [n.id, n.source, n.mediaName || "—", `"${n.title}"`, n.keyword, n.region, n.trendScore ?? "", n.publishedAt, `"${n.text.replace(/"/g, '""')}"`]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `berita_lokal_trends_${today}.csv`; a.click();
  };

  // Download predictions CSV
  const downloadPredictionsCsv = () => {
    const headers = ["ID", "Sumber", "Barang", "Kategori", "Volume", "Satuan", "Harga Satuan", "Total Nilai", "Konfidensi", "Analisis", "Penjelasan Lengkap"];
    const rows = predictions.map(p => [p.id, p.source, p.commodity, p.category, p.volume, p.unit, p.price, p.volume * p.price, `${p.confidence}%`, `"${p.analysis}"`, `"${p.text.replace(/"/g, '""')}"`]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `prediksi_demand_${startDate}_${endDate}.csv`; a.click();
  };

  const filteredHistory = filterStatus === "SEMUA" ? rfqHistory : rfqHistory.filter(r => r.status === filterStatus);

  // Sort for predictions table
  const { sorted: sortedPredictions, sortKey: predSortKey, sortDir: predSortDir, toggleSort: togglePredSort } = useSortable(predictions, "commodity");

  // Sort for history table
  const { sorted: sortedHistory, sortKey: histSortKey, sortDir: histSortDir, toggleSort: toggleHistSort } = useSortable(filteredHistory, "date");

  return (
    <div className="dashboard-page dashboard-page-demand space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* Full Text Modal */}
      {fullTextItem && fullTextType === "news" && (
        <TextModal
          title={(fullTextItem as NewsItem).title}
          text={(fullTextItem as NewsItem).text}
          source={(fullTextItem as NewsItem).source}
          region={(fullTextItem as NewsItem).region}
          onClose={() => setFullTextItem(null)}
        />
      )}
      {fullTextItem && fullTextType === "prediction" && (
        <TextModal
          title={`Analisis: ${(fullTextItem as Prediction).commodity}`}
          text={`${(fullTextItem as Prediction).analysis}\n\n${(fullTextItem as Prediction).text}`}
          source={(fullTextItem as Prediction).source}
          region=""
          onClose={() => setFullTextItem(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md anim-fade-in-up">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">AI Demand Intelligence</h1>
            <p className="text-sm text-on-surface-variant">Berita Lokal Kabupaten &amp; Google Trends → Prediksi Permintaan → Ajukan RFQ</p>
          </div>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-xs px-md py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all disabled:opacity-50">
          <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>sync</span>
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter anim-fade-in-up">
          {[
            { label: "Total RFQ Diajukan",   value: summary.totalRfq,    icon: "receipt_long",  color: "bg-primary/10 text-primary" },
            { label: "RFQ Disetujui",         value: summary.approvedRfq, icon: "check_circle",  color: "bg-emerald-100 text-emerald-700" },
            { label: "Tingkat Persetujuan",   value: `${summary.approvalRate}%`, icon: "percent", color: "bg-sky-100 text-sky-700" },
            { label: "Total Nilai RFQ",       value: formatRupiah(summary.totalValue), icon: "payments", color: "bg-amber-100 text-amber-700" },
          ].map(s => (
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
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 anim-fade-in-up">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-md">Kategori Paling Banyak Disetujui RFQ</p>
          <div className="flex flex-wrap gap-md items-end">
            {topCategories.slice(0, 5).map((cat, i) => {
              const pct = Math.round((cat.value / topCategories[0].value) * 100);
              return (
                <div key={cat.category} className="flex-1 min-w-[80px] space-y-xs">
                  <div className="w-full rounded-t-lg" style={{ height: `${Math.max(20, pct * 0.8)}px`, background: i === 0 ? "#2e591f" : `rgba(46,89,31,${0.85 - i * 0.15})` }} />
                  <p className="text-[10px] font-bold text-center text-on-surface-variant">{cat.category}</p>
                  <p className="text-[10px] text-center text-primary font-semibold">{formatRupiah(cat.value)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-xs bg-surface-container-low rounded-2xl p-1 w-fit">
        {[{ key: "analysis", label: "Analisis & Prediksi", icon: "analytics" }, { key: "history", label: "History RFQ", icon: "history" }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-xs px-md py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab.key ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"}`}>
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === tab.key ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══ TAB: ANALYSIS ══ */}
      {activeTab === "analysis" && (
        <div className="space-y-lg">

          {/* Data Sources */}
          <div>
            <div className="flex items-center justify-between mb-md flex-wrap gap-sm">
              <div>
                <h2 className="font-extrabold text-on-surface text-lg">Sumber Data Real-time</h2>
                <p className="text-xs text-on-surface-variant mt-xs">Hanya Berita Lokal Kabupaten &amp; Google Trends yang digunakan sebagai sumber analisis</p>
              </div>
              <div className="flex items-center gap-sm">
                <span className="flex items-center gap-xs text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live Feed
                </span>
                <button onClick={downloadNewsCsv} className="flex items-center gap-xs px-md py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
                  <span className="material-symbols-outlined text-[14px]">download</span>Download CSV
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 gap-gutter">
                {[1,2,3,4].map(i => <div key={i} className="h-40 bg-surface-container-low rounded-2xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-gutter">
                {newsData.map(news => (
                  <div key={news.id} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md hover:border-primary/20 transition-all group flex flex-col">
                    <div className="flex items-start justify-between gap-sm mb-sm">
                      <div className="flex items-center gap-xs flex-wrap">
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-xs ${sourceColors[news.source] ?? "bg-gray-100 text-gray-700"}`}>
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{news.sourceIcon}</span>
                          {news.source}
                        </div>
                        {news.mediaName && <span className="text-[10px] font-semibold text-on-surface-variant">{news.mediaName}</span>}
                        <span className="text-[10px] text-on-surface-variant">{news.region}</span>
                      </div>
                      {news.trendScore !== undefined && (
                        <div className="flex items-center gap-xs text-[11px] font-bold text-blue-600 shrink-0">
                          <span className="material-symbols-outlined text-[14px]">trending_up</span>{news.trendScore}%
                        </div>
                      )}
                    </div>
                    <p className="font-bold text-on-surface text-sm mb-xs leading-snug">{news.title}</p>
                    <p className="text-[12px] text-on-surface-variant leading-relaxed line-clamp-3 flex-1">"{news.text}"</p>
                    <div className="mt-sm flex items-center justify-between">
                      <span className="text-[10px] font-semibold bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">🏷 {news.keyword}</span>
                      <div className="flex items-center gap-sm">
                        <span className="text-[10px] text-on-surface-variant">{news.publishedAt}</span>
                        <button onClick={() => { setFullTextItem(news); setFullTextType("news"); }}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[12px]">open_in_full</span>Baca Selengkapnya
                        </button>
                      </div>
                    </div>
                    {news.trendScore !== undefined && (
                      <div className="mt-sm">
                        <div className="h-1 bg-outline-variant/20 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${news.trendScore}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Prediction */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-lg border border-emerald-200/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
              <div>
                <h2 className="font-extrabold text-on-surface text-lg">Generate Prediksi AI</h2>
                <p className="text-sm text-on-surface-variant mt-xs">Pilih rentang waktu prediksi lalu jalankan model AI</p>
              </div>
              <div className="flex flex-wrap items-end gap-md">
                {/* Date Pickers */}
                <div className="flex flex-wrap items-end gap-sm">
                  <div className="space-y-xs">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tanggal Mulai</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} max={endDate}
                      className="px-md py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div className="pb-2"><span className="text-on-surface-variant font-bold text-sm">→</span></div>
                  <div className="space-y-xs">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tanggal Selesai</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate}
                      className="px-md py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={generating || loading}
                  className="flex items-center gap-sm px-lg py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {generating ? (
                    <><span className="material-symbols-outlined text-[20px] animate-spin">autorenew</span>Memproses AI...</>
                  ) : (
                    <><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>Generate Prediksi</>
                  )}
                </button>
              </div>
            </div>

            {/* Empty state */}
            {predictions.length === 0 && !generating && (
              <div className="flex flex-col items-center justify-center py-2xl text-center gap-md">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary/50">psychology</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface-variant">Belum ada prediksi</p>
                  <p className="text-sm text-on-surface-variant/70 mt-xs">Pilih rentang tanggal lalu klik "Generate Prediksi"</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {generating && (
              <div className="flex flex-col items-center justify-center py-2xl gap-md">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-primary animate-spin">autorenew</span>
                </div>
                <div className="text-center">
                  <p className="font-bold text-on-surface">Memproses data AI...</p>
                  <p className="text-sm text-on-surface-variant mt-xs">Menganalisis berita lokal kabupaten &amp; Google Trends</p>
                </div>
                <div className="w-64 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
                </div>
              </div>
            )}

            {/* Results */}
            {predictions.length > 0 && (
              <div className="space-y-md">
                {/* Download buttons after generate */}
                <div className="flex flex-wrap gap-sm items-center justify-between">
                  <p className="text-sm font-bold text-emerald-700">✓ {predictions.length} prediksi berhasil dihasilkan ({startDate} → {endDate})</p>
                  <div className="flex gap-sm flex-wrap">
                    <button onClick={downloadNewsCsv} className="flex items-center gap-xs px-md py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">download</span>Download Berita (CSV)
                    </button>
                    <button onClick={downloadPredictionsCsv} className="flex items-center gap-xs px-md py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">download</span>Download Prediksi (CSV)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-outline-variant/20">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant/20">
                        <SortableHeader label="Sumber"              colKey="source"     current={predSortKey} dir={predSortDir} onSort={togglePredSort} />
                        <SortableHeader label="Barang"              colKey="commodity"  current={predSortKey} dir={predSortDir} onSort={togglePredSort} />
                        <SortableHeader label="Kategori"            colKey="category"   current={predSortKey} dir={predSortDir} onSort={togglePredSort} />
                        <SortableHeader label="Volume &amp; Satuan" colKey="volume"     current={predSortKey} dir={predSortDir} onSort={togglePredSort} />
                        <SortableHeader label="Harga Satuan"        colKey="price"      current={predSortKey} dir={predSortDir} onSort={togglePredSort} />
                        <th className="text-left px-md py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Total Nilai</th>
                        <SortableHeader label="Konfidensi"          colKey="confidence" current={predSortKey} dir={predSortDir} onSort={togglePredSort} />
                        <th className="text-left px-md py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">Analisis / Penjelasan</th>
                        <th className="px-md py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedPredictions.map((pred, i) => (
                        <tr key={pred.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors" style={{ animationDelay: `${i * 0.05}s` }}>
                          <td className="px-md py-3">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${sourceColors[pred.source] ?? "bg-gray-100 text-gray-700"}`}>{pred.source}</span>
                          </td>
                          <td className="px-md py-3"><p className="font-bold text-on-surface whitespace-nowrap">{pred.commodity}</p></td>
                          <td className="px-md py-3">
                            <span className="text-xs font-semibold bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">{pred.category}</span>
                          </td>
                          <td className="px-md py-3 font-semibold text-on-surface whitespace-nowrap">{pred.volume.toLocaleString("id-ID")} {pred.unit}</td>
                          <td className="px-md py-3 font-semibold text-on-surface whitespace-nowrap">{formatRupiah(pred.price)}</td>
                          <td className="px-md py-3 font-bold text-primary whitespace-nowrap">{formatRupiah(pred.volume * pred.price)}</td>
                          <td className="px-md py-3">
                            <div className="flex items-center gap-xs">
                              <div className="w-16 h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pred.confidence}%`, background: pred.confidence >= 80 ? "#16a34a" : pred.confidence >= 60 ? "#d97706" : "#dc2626" }} />
                              </div>
                              <span className={`text-[11px] font-bold ${pred.confidence >= 80 ? "text-emerald-600" : pred.confidence >= 60 ? "text-amber-600" : "text-red-600"}`}>{pred.confidence}%</span>
                            </div>
                          </td>
                          <td className="px-md py-3 max-w-[220px]">
                            <p className="text-xs font-semibold text-on-surface mb-0.5">{pred.analysis}</p>
                            <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">"{pred.text}"</p>
                            <button onClick={() => { setFullTextItem(pred); setFullTextType("prediction"); }}
                              className="mt-xs text-[10px] font-bold text-primary hover:underline flex items-center gap-xs">
                              <span className="material-symbols-outlined text-[12px]">open_in_full</span>Lihat Selengkapnya
                            </button>
                          </td>
                          <td className="px-md py-3">
                            <button onClick={() => handleApproveRfq(pred)} disabled={approvingId === pred.id}
                              className="flex items-center gap-xs px-md py-2 bg-primary text-white rounded-xl text-[11px] font-bold hover:bg-primary/90 hover:shadow-md transition-all disabled:opacity-60 whitespace-nowrap">
                              {approvingId === pred.id ? (
                                <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                              ) : (
                                <span className="material-symbols-outlined text-[14px]">add_task</span>
                              )}
                              Ajukan RFQ
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: HISTORY ══ */}
      {activeTab === "history" && (
        <div className="space-y-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
            <h2 className="font-extrabold text-on-surface text-lg">Riwayat Pengajuan RFQ</h2>
            <div className="flex gap-xs flex-wrap">
              {["SEMUA", "DISETUJUI", "DIPROSES", "MENUNGGU", "DITOLAK"].map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`px-md py-1.5 rounded-xl text-[11px] font-bold transition-all ${filterStatus === s ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-sm">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl animate-pulse bg-surface-container-low" />)}</div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-2xl text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-md">inbox</span>
              <p className="font-bold text-on-surface-variant">Tidak ada data RFQ</p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant/20">
                      <SortableHeader label="Tanggal"       colKey="date"      current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                      <SortableHeader label="Barang"        colKey="commodity" current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                      <SortableHeader label="Kategori"      colKey="category"  current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                      <SortableHeader label="Volume"        colKey="volume"    current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                      <SortableHeader label="Harga Satuan"  colKey="price"     current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                      <SortableHeader label="Total Nilai"   colKey="value"     current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                      <SortableHeader label="Sumber"        colKey="source"    current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                      <SortableHeader label="Status"        colKey="status"    current={histSortKey} dir={histSortDir} onSort={toggleHistSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedHistory.map(rfq => {
                      const st = statusMeta[rfq.status] ?? statusMeta.MENUNGGU;
                      return (
                        <tr key={rfq.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-md py-3 whitespace-nowrap">
                            <p className="font-semibold text-on-surface text-xs">{rfq.date}</p>
                            <p className="text-[10px] text-on-surface-variant">{rfq.time}</p>
                          </td>
                          <td className="px-md py-3"><p className="font-bold text-on-surface">{rfq.commodity}</p></td>
                          <td className="px-md py-3"><span className="text-[10px] font-semibold bg-surface-container px-2 py-0.5 rounded-full text-on-surface-variant">{rfq.category}</span></td>
                          <td className="px-md py-3 font-semibold text-on-surface">{rfq.volume.toLocaleString("id-ID")}</td>
                          <td className="px-md py-3 font-semibold text-on-surface whitespace-nowrap">{formatRupiah(rfq.price)}</td>
                          <td className="px-md py-3 font-bold text-primary whitespace-nowrap">{formatRupiah(rfq.value)}</td>
                          <td className="px-md py-3"><span className={`text-[10px] font-bold px-2 py-1 rounded-full ${sourceColors[rfq.source] ?? "bg-gray-100 text-gray-700"}`}>{rfq.source}</span></td>
                          <td className="px-md py-3">
                            <div className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold ${st.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{st.label}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
