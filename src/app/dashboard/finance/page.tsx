"use client";

import React, { useState, useEffect } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

// ── Types ──────────────────────────────────────────────────────────────────
interface Metrics { totalRevenue: number; totalExpense: number; netDifference: number }
interface ChartPoint { month: string; revenue: number; expense: number }
interface CategoryItem { category: string; amount: number; percentage: number }
interface LedgerRow { code: string; name: string; category: string; debit: number; credit: number; balance: number }
interface AIInsight { type: string; title: string; desc: string }

// ── Helpers ────────────────────────────────────────────────────────────────
function formatM(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────
function LineChart({ data }: { data: ChartPoint[] }) {
  const W = 600, H = 200, padX = 48, padY = 24;
  if (!data.length) return null;

  const maxVal = Math.max(...data.flatMap(d => [d.revenue, d.expense]));
  const scaleX = (i: number) => padX + (i / (data.length - 1)) * (W - padX * 2);
  const scaleY = (v: number) => padY + (1 - v / maxVal) * (H - padY * 2);

  const pointsRev = data.map((d, i) => `${scaleX(i)},${scaleY(d.revenue)}`).join(" ");
  const pointsExp = data.map((d, i) => `${scaleX(i)},${scaleY(d.expense)}`).join(" ");

  // Area fill for revenue
  const areaRev = `${padX},${H - padY} ${pointsRev} ${scaleX(data.length - 1)},${H - padY}`;
  const areaExp = `${padX},${H - padY} ${pointsExp} ${scaleX(data.length - 1)},${H - padY}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2e591f" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2e591f" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = padY + t * (H - padY * 2);
        return (
          <line key={t} x1={padX} y1={y} x2={W - padX} y2={y} stroke="#c2c9ba" strokeWidth="0.5" strokeDasharray="3 3" />
        );
      })}

      {/* Area fills */}
      <polygon points={areaRev} fill="url(#gradRev)" />
      <polygon points={areaExp} fill="url(#gradExp)" />

      {/* Revenue line */}
      <polyline points={pointsRev} fill="none" stroke="#2e591f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Expense line */}
      <polyline points={pointsExp} fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots + labels */}
      {data.map((d, i) => (
        <g key={i}>
          {/* Revenue dot */}
          <circle cx={scaleX(i)} cy={scaleY(d.revenue)} r="4" fill="#2e591f" stroke="white" strokeWidth="2" />
          {/* Expense dot */}
          <circle cx={scaleX(i)} cy={scaleY(d.expense)} r="4" fill="#dc2626" stroke="white" strokeWidth="2" />
          {/* Month label */}
          <text x={scaleX(i)} y={H - 4} textAnchor="middle" fontSize="9" fill="#72796c" fontWeight="600">{d.month}</text>
        </g>
      ))}

      {/* Y-axis labels */}
      {[0, 0.5, 1].map((t) => {
        const y = padY + t * (H - padY * 2);
        const v = maxVal * (1 - t);
        return (
          <text key={t} x={padX - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#72796c">
            {v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}Jt` : v.toString()}
          </text>
        );
      })}
    </svg>
  );
}

// ── Donut Segment ──────────────────────────────────────────────────────────
const DONUT_COLORS = ["#2e591f", "#fbbc00", "#3b82f6", "#8b5cf6", "#ef4444"];

function DonutChart({ data }: { data: CategoryItem[] }) {
  const r = 70, cx = 90, cy = 90;
  const circumference = 2 * Math.PI * r;
  const rotations = data.map((_, index) =>
    data.slice(0, index).reduce((total, item) => total + item.percentage, 0),
  );

  return (
    <svg viewBox="0 0 180 180" className="w-full h-full" style={{ maxWidth: 180 }}>
      {data.map((item, i) => {
        const dash = (item.percentage / 100) * circumference;
        const gap = circumference - dash;
        const rotation = (rotations[i] / 100) * 360 - 90;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth={22}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={52} fill="white" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fontWeight={800} fill="#1a1c17">Pengeluaran</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#72796c">per kategori</text>
    </svg>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function FinanceDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "ledger" | "report">("dashboard");
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ledgerSearch, setLedgerSearch] = useState("");

  // Date range for SAK-EP report
  const currentYear = new Date().getFullYear();
  const [reportStartDate, setReportStartDate] = useState(`${currentYear}-01-01`);
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch("/api/finance")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.metrics);
          setChartData(data.chartData);
          setCategories(data.categories);
          setLedger(data.ledger);
          setInsights(data.insights);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleGeneratePdf = () => {
    setGeneratingPdf(true);
    setTimeout(() => {
      setGeneratingPdf(false);
      setShowPdfPreview(true);
    }, 1500);
  };

  const handleDownloadPdf = () => {
    // Build printable HTML and open in new window for Save-as-PDF
    const content = document.getElementById("pdf-preview-content")?.innerHTML || "";
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Laporan SAK-EP KREASI ${reportStartDate} – ${reportEndDate}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #1a1a1a; font-size: 12px; }
          h1 { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
          h2 { font-size: 13px; font-weight: 700; margin: 20px 0 8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 11px; }
          th { background: #f5f5f5; font-weight: 700; }
          .summary { display: flex; gap: 24px; margin: 16px 0; }
          .summary-item { flex: 1; background: #f9f9f9; border: 1px solid #eee; padding: 10px 14px; border-radius: 8px; }
          .summary-item .val { font-size: 16px; font-weight: 800; }
          .green { color: #16a34a; } .red { color: #dc2626; }
          .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; font-size: 10px; color: #888; }
          @media print { @page { margin: 20mm; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 500);
    setToast("Laporan SAK-EP siap diunduh!");
    setTimeout(() => setToast(null), 3500);
  };

  // Ledger filter + sort
  const filteredLedger = ledger.filter(r =>
    !ledgerSearch ||
    r.code.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    r.name.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
    r.category.toLowerCase().includes(ledgerSearch.toLowerCase())
  );
  const { sorted: sortedLedger, sortKey: ledgerSortKey, sortDir: ledgerSortDir, toggleSort: toggleLedgerSort } = useSortable(filteredLedger, "code");

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh] flex-col gap-md">
      <span className="material-symbols-outlined text-[48px] animate-spin text-primary">sync</span>
      <p className="text-on-surface-variant font-semibold">Memuat data keuangan...</p>
    </div>
  );

  // Group ledger by category (sorted)
  const ledgerGroups = sortedLedger.reduce<Record<string, LedgerRow[]>>((acc, row) => {
    if (!acc[row.category]) acc[row.category] = [];
    acc[row.category].push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-sm px-md py-sm bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl shadow-2xl font-semibold text-sm anim-fade-in-up">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md anim-fade-in-up">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-violet-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Automated Financial Flow</h1>
            <p className="text-sm text-on-surface-variant">Dashboard Keuangan SAK-EP Real-time · Ekspor Laporan PDF</p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-sm">
          {/* Date range pickers */}
          <div className="space-y-xs">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Periode Mulai</label>
            <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} max={reportEndDate}
              className="px-md py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="self-end pb-2.5"><span className="text-on-surface-variant font-bold text-sm">→</span></div>
          <div className="space-y-xs">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Periode Selesai</label>
            <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} min={reportStartDate}
              className="px-md py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-colors" />
          </div>
          <button
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
            className="flex items-center gap-sm px-lg py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 self-end"
          >
            {generatingPdf ? (
              <><span className="material-symbols-outlined text-[20px] animate-spin">autorenew</span>Menyiapkan...</>
            ) : (
              <><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>Preview &amp; Unduh Laporan</>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter anim-fade-in-up">
          {[
            { label: "Total Pemasukan", value: metrics.totalRevenue, icon: "trending_up", color: "bg-emerald-100 text-emerald-700", valueCls: "text-emerald-700" },
            { label: "Total Pengeluaran", value: metrics.totalExpense, icon: "trending_down", color: "bg-red-100 text-red-700", valueCls: "text-red-700" },
            { label: "Selisih (Surplus)", value: metrics.netDifference, icon: "account_balance", color: "bg-primary/10 text-primary", valueCls: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant/20 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-md mb-md">
                <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <p className="text-sm font-bold text-on-surface-variant">{s.label}</p>
              </div>
              <p className={`text-3xl font-extrabold ${s.valueCls}`}>{formatM(s.value)}</p>
              <p className="text-[11px] text-on-surface-variant mt-xs">Kumulatif Januari – Juni 2026</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-xs bg-surface-container-low rounded-2xl p-1 w-fit">
        {[
          { key: "dashboard", label: "Dashboard Arus", icon: "monitoring" },
          { key: "ledger", label: "Buku Besar SAK-EP", icon: "receipt_long" },
          { key: "report", label: "Generate Laporan", icon: "picture_as_pdf" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-xs px-md py-2.5 rounded-xl font-semibold text-sm transition-all ${
              activeTab === tab.key ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div className="space-y-gutter">
          {/* Line Chart */}
          <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20">
            <div className="flex items-center justify-between mb-md">
              <p className="font-extrabold text-on-surface">Arus Keuangan Bulanan</p>
              <div className="flex gap-md text-[11px] font-bold">
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  Pemasukan
                </div>
                <div className="flex items-center gap-xs">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Pengeluaran
                </div>
              </div>
            </div>
            <div className="h-52">
              <LineChart data={chartData} />
            </div>
          </div>

          {/* Donut + Category breakdown */}
          <div className="grid md:grid-cols-2 gap-gutter">
            {/* Donut */}
            <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20">
              <p className="font-extrabold text-on-surface mb-md">Breakdown Pengeluaran per Kategori</p>
              <div className="flex items-center gap-lg">
                <div className="w-[180px] h-[180px] shrink-0">
                  <DonutChart data={categories} />
                </div>
                <div className="flex-1 space-y-sm">
                  {categories.map((cat, i) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-xs">
                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="text-[11px] font-semibold text-on-surface">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-extrabold text-on-surface">{cat.percentage}%</p>
                        <p className="text-[9px] text-on-surface-variant">{formatM(cat.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-sm">
              <p className="font-extrabold text-on-surface">Analisis AI</p>
              {insights.map((ins, i) => {
                const colors: Record<string, { bg: string; icon: string; iconColor: string }> = {
                  STANDARD: { bg: "bg-emerald-50 border-emerald-200", icon: "verified", iconColor: "text-emerald-600" },
                  SECURITY: { bg: "bg-sky-50 border-sky-200", icon: "security", iconColor: "text-sky-600" },
                  HELP: { bg: "bg-amber-50 border-amber-200", icon: "lightbulb", iconColor: "text-amber-600" },
                };
                const c = colors[ins.type] ?? colors.HELP;
                return (
                  <div key={i} className={`p-md rounded-2xl border ${c.bg} flex items-start gap-sm`}>
                    <span className={`material-symbols-outlined text-2xl ${c.iconColor} shrink-0`} style={{ fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{ins.title}</p>
                      <p className="text-xs text-on-surface-variant mt-xs leading-relaxed">{ins.desc}</p>
                    </div>
                  </div>
                );
              })}

              {/* Monthly detail table */}
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-container border-b border-outline-variant/20">
                      {["Bulan", "Masuk", "Keluar", "Selisih"].map(h => (
                        <th key={h} className="text-left px-sm py-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.map((d) => (
                      <tr key={d.month} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50">
                        <td className="px-sm py-2 font-bold text-on-surface">{d.month}</td>
                        <td className="px-sm py-2 font-semibold text-emerald-600">{formatM(d.revenue)}</td>
                        <td className="px-sm py-2 font-semibold text-red-600">{formatM(d.expense)}</td>
                        <td className="px-sm py-2 font-extrabold text-primary">{formatM(d.revenue - d.expense)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LEDGER ── */}
      {activeTab === "ledger" && (
        <div className="space-y-md">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <div>
              <h2 className="font-extrabold text-on-surface text-lg">Buku Besar SAK-EP</h2>
              <p className="text-sm text-on-surface-variant">Standar Akuntansi Keuangan Entitas Privat — Koperasi Desa</p>
            </div>
            <div className="flex items-center gap-sm">
              {/* Ledger search */}
              <div className="flex items-center gap-xs px-md py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
                <input type="text" placeholder="Cari kode / nama akun..." value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40 w-40" />
                {ledgerSearch && <button onClick={() => setLedgerSearch("")} className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-primary">close</button>}
              </div>
              <div className="flex items-center gap-xs px-sm py-xs bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                SAK-EP Compliant
              </div>
            </div>
          </div>

          {Object.entries(ledgerGroups).map(([group, rows]) => (
            <div key={group} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
              <div className="px-md py-sm bg-surface-container border-b border-outline-variant/20">
                <p className="font-extrabold text-primary text-sm">{group}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/10">
                      <SortableHeader label="Kode"     colKey="code"    current={ledgerSortKey} dir={ledgerSortDir} onSort={toggleLedgerSort} />
                      <SortableHeader label="Nama Akun" colKey="name"   current={ledgerSortKey} dir={ledgerSortDir} onSort={toggleLedgerSort} />
                      <SortableHeader label="Debit"    colKey="debit"   current={ledgerSortKey} dir={ledgerSortDir} onSort={toggleLedgerSort} />
                      <SortableHeader label="Kredit"   colKey="credit"  current={ledgerSortKey} dir={ledgerSortDir} onSort={toggleLedgerSort} />
                      <SortableHeader label="Saldo"    colKey="balance" current={ledgerSortKey} dir={ledgerSortDir} onSort={toggleLedgerSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.code} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-md py-2.5 font-mono text-xs text-on-surface-variant">{row.code}</td>
                        <td className="px-md py-2.5 font-semibold text-on-surface">{row.name}</td>
                        <td className="px-md py-2.5 font-semibold text-emerald-600">
                          {row.debit > 0 ? formatM(row.debit) : "—"}
                        </td>
                        <td className="px-md py-2.5 font-semibold text-red-600">
                          {row.credit > 0 ? formatM(row.credit) : "—"}
                        </td>
                        <td className="px-md py-2.5 font-extrabold text-primary">{formatM(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: REPORT ── */}
      {activeTab === "report" && (
        <div className="space-y-lg">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-xl border border-violet-200/50">
            <div className="flex flex-col md:flex-row md:items-center gap-xl">
              <div className="flex-1 space-y-md">
                <div className="flex items-center gap-sm">
                  <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-violet-700 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-on-surface">Generate Laporan SAK-EP</h2>
                    <p className="text-sm text-on-surface-variant">Laporan keuangan standar siap audit dalam format PDF</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-sm">
                  {[
                    "Laporan Posisi Keuangan (Neraca)",
                    "Laporan Laba Rugi Komprehensif",
                    "Laporan Arus Kas (Metode Langsung)",
                    "Laporan Perubahan Ekuitas",
                    "Catatan Atas Laporan Keuangan (CALK)",
                    "Rincian SHU per Anggota",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-xs text-sm text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-md pt-sm">
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Periode</p>
                    <select className="mt-xs bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-sm py-2 text-sm font-semibold text-on-surface outline-none">
                      <option>Januari – Juni 2026</option>
                      <option>Januari – Maret 2026</option>
                      <option>April – Juni 2026</option>
                      <option>Tahun Buku 2025</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Format</p>
                    <select className="mt-xs bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-sm py-2 text-sm font-semibold text-on-surface outline-none">
                      <option>PDF (Standar SAK-EP)</option>
                      <option>Excel (.xlsx)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGeneratePdf}
                  disabled={generatingPdf}
                  className="flex items-center gap-sm px-xl py-4 bg-primary text-white rounded-2xl font-extrabold text-base hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 w-fit"
                >
                  {generatingPdf ? (
                    <>
                      <span className="material-symbols-outlined text-[24px] animate-spin">autorenew</span>
                      Generating Laporan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                      Unduh Laporan SAK-EP PDF
                    </>
                  )}
                </button>
              </div>

              {/* Preview card */}
              <div className="md:w-72 shrink-0">
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 p-md shadow-xl space-y-sm">
                  <div className="flex items-center gap-sm border-b border-outline-variant/10 pb-sm">
                    <span className="material-symbols-outlined text-red-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                    <div>
                      <p className="text-xs font-extrabold text-on-surface">Laporan_SAK-EP_2026.pdf</p>
                      <p className="text-[10px] text-on-surface-variant">~2.4 MB · 12 halaman</p>
                    </div>
                  </div>
                  {["Neraca", "Laba Rugi", "Arus Kas", "Ekuitas", "CALK", "SHU"].map((section, i) => (
                    <div key={section} className="flex items-center gap-xs">
                      <div className="w-6 h-6 rounded bg-surface-container text-[10px] font-black text-on-surface-variant flex items-center justify-center">
                        {i + 1}
                      </div>
                      <span className="text-xs font-semibold text-on-surface-variant">{section}</span>
                      <div className="flex-1 h-px bg-outline-variant/20 ml-xs" />
                    </div>
                  ))}
                  <div className="pt-sm text-center">
                    <p className="text-[10px] text-on-surface-variant italic">Preview laporan SAK-EP</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PDF PREVIEW MODAL ══ */}
      {showPdfPreview && metrics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPdfPreview(false)} />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-full max-w-4xl max-h-[92vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/20 shrink-0">
              <div>
                <h2 className="font-extrabold text-xl text-on-surface">Preview Laporan SAK-EP</h2>
                <p className="text-sm text-on-surface-variant">Periode: {reportStartDate} — {reportEndDate}</p>
              </div>
              <div className="flex items-center gap-sm">
                <button onClick={handleDownloadPdf}
                  className="flex items-center gap-sm px-lg py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                  Download PDF
                </button>
                <button onClick={() => setShowPdfPreview(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="overflow-y-auto flex-1 p-xl">
              <div id="pdf-preview-content" className="bg-white rounded-2xl p-xl shadow-sm border border-outline-variant/10 text-on-surface font-sans space-y-lg">

                {/* Report header */}
                <div className="border-b-2 border-primary pb-lg">
                  <div className="flex items-start justify-between gap-md">
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-xs">KOPERASI DESA KREASI</p>
                      <h1 className="text-2xl font-extrabold text-primary leading-tight">LAPORAN KEUANGAN SAK-EP</h1>
                      <p className="text-sm text-on-surface-variant mt-xs">Periode: {reportStartDate} s/d {reportEndDate}</p>
                    </div>
                    <div className="text-right text-xs text-on-surface-variant space-y-0.5">
                      <p className="font-bold text-on-surface">Koperasi Desa KREASI</p>
                      <p>Jl. Kemakmuran No. 12, Kec. Sejahtera</p>
                      <p>Kab. Contoh, Jawa Timur 64000</p>
                      <p>NPWP: 01.234.567.8-901.000</p>
                      <p className="mt-xs font-semibold">Dibuat: {new Date().toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}</p>
                    </div>
                  </div>
                </div>

                {/* Summary boxes */}
                <div>
                  <h2 className="font-extrabold text-lg text-on-surface mb-md">Ringkasan Keuangan</h2>
                  <div className="grid grid-cols-3 gap-md">
                    {[
                      { label: "Total Pemasukan", value: formatM(metrics.totalRevenue), color: "border-emerald-500 text-emerald-700" },
                      { label: "Total Pengeluaran", value: formatM(metrics.totalExpense), color: "border-red-500 text-red-700" },
                      { label: "Selisih Bersih", value: formatM(metrics.netDifference), color: metrics.netDifference >= 0 ? "border-emerald-500 text-emerald-700" : "border-red-500 text-red-700" },
                    ].map(s => (
                      <div key={s.label} className={`border-l-4 ${s.color} bg-surface-container-lowest rounded-xl p-md`}>
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
                        <p className={`text-xl font-extrabold mt-xs ${s.color.split(" ")[1]}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ledger table */}
                <div>
                  <h2 className="font-extrabold text-lg text-on-surface mb-md">Buku Besar (Neraca SAK-EP)</h2>
                  <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-surface-container">
                          {["Kode Akun", "Nama Akun", "Kategori", "Debit", "Kredit", "Saldo"].map(h => (
                            <th key={h} className="text-left px-md py-3 font-bold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant/20">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ledger.map((row, i) => (
                          <tr key={row.code} className={`border-b border-outline-variant/10 ${i % 2 === 0 ? "" : "bg-surface-container-lowest/40"}`}>
                            <td className="px-md py-2.5 font-mono font-bold text-on-surface-variant">{row.code}</td>
                            <td className="px-md py-2.5 font-semibold text-on-surface">{row.name}</td>
                            <td className="px-md py-2.5 text-on-surface-variant">{row.category}</td>
                            <td className="px-md py-2.5 text-emerald-700 font-semibold">{row.debit > 0 ? formatM(row.debit) : "—"}</td>
                            <td className="px-md py-2.5 text-red-700 font-semibold">{row.credit > 0 ? formatM(row.credit) : "—"}</td>
                            <td className={`px-md py-2.5 font-extrabold ${row.balance >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatM(row.balance)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-surface-container border-t-2 border-outline-variant/30">
                          <td colSpan={3} className="px-md py-3 font-extrabold text-on-surface text-xs uppercase">TOTAL</td>
                          <td className="px-md py-3 font-extrabold text-emerald-700">{formatM(metrics.totalRevenue)}</td>
                          <td className="px-md py-3 font-extrabold text-red-700">{formatM(metrics.totalExpense)}</td>
                          <td className={`px-md py-3 font-extrabold ${metrics.netDifference >= 0 ? "text-emerald-700" : "text-red-700"}`}>{formatM(metrics.netDifference)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-outline-variant/20 pt-lg">
                  <div className="flex justify-between text-xs text-on-surface-variant">
                    <div>
                      <p className="font-bold text-on-surface mb-xs">Disusun oleh:</p>
                      <p>Divisi Keuangan — KREASI Portal</p>
                      <p>Platform AI Koperasi Desa | Tim Xensushi</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-on-surface mb-xs">Mengetahui,</p>
                      <p>Ketua Koperasi Desa KREASI</p>
                      <div className="mt-xl pt-xs border-t border-outline-variant/30 w-32 ml-auto">
                        <p className="font-semibold">(___________________)</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-on-surface-variant/60 mt-lg">
                    Laporan ini digenerate otomatis oleh sistem KREASI sesuai standar SAK-EP (Standar Akuntansi Keuangan Entitas Privat) · {new Date().toLocaleString("id-ID")}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
