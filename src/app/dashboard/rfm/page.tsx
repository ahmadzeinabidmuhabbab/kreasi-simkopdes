"use client";

import React, { useState, useEffect } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

// ── Types ──────────────────────────────────────────────────────────────────
interface Recommendation {
  marketing: string;
  product: string;
  pricing: string;
  credit: string;
  relationship: string;
}

interface Member {
  id: string;
  name: string;
  recency: number;
  frequency: number;
  monetary: number;
  lastTransaction: string;
}

interface Segment {
  key: string;
  name: string;
  count: number;
  percentage: number;
  demographics: string;
  avgTransaction: number;
  avgRecency: number;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  icon: string;
  rfmScore: string;
  recommendations: Recommendation;
  members: Member[];
}

// ── Pillar config ──────────────────────────────────────────────────────────
const pillars: { key: keyof Recommendation; label: string; icon: string; color: string }[] = [
  { key: "marketing", label: "Marketing", icon: "campaign", color: "text-emerald-600" },
  { key: "product", label: "Product", icon: "inventory_2", color: "text-sky-600" },
  { key: "pricing", label: "Pricing", icon: "local_offer", color: "text-amber-600" },
  { key: "credit", label: "Credit", icon: "credit_card", color: "text-violet-600" },
  { key: "relationship", label: "Relationship", icon: "diversity_3", color: "text-rose-600" },
];

const pillarGoals: Record<keyof Recommendation, string> = {
  marketing: "Meningkatkan penjualan",
  product: "Meningkatkan kecocokan produk",
  pricing: "Mengoptimalkan keuntungan",
  credit: "Mendukung pembiayaan yang sehat",
  relationship: "Meningkatkan retensi anggota",
};

// ── MembersTable sub-component (uses hooks at component level) ─────────────
function MembersTable({ members }: { members: Member[] }) {
  const { sorted, sortKey, sortDir, toggleSort } = useSortable(members, "name");
  const [search, setSearch] = React.useState("");
  const filtered = sorted.filter(m =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden anim-fade-in-up">
      <div className="p-md border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-sm">
        <div>
          <p className="font-bold text-on-surface">Sample Anggota Segmen</p>
          <p className="text-xs text-on-surface-variant mt-xs">Representasi anggota dari segmen ini</p>
        </div>
        <div className="flex items-center gap-xs px-md py-2 bg-surface-container border border-outline-variant/30 rounded-xl focus-within:border-primary transition-colors">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
          <input type="text" placeholder="Cari nama / ID..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40 w-32" />
          {search && <button onClick={() => setSearch("")} className="material-symbols-outlined text-[14px] text-on-surface-variant hover:text-primary">close</button>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-container">
              <SortableHeader label="ID"                   colKey="id"              current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Nama"                 colKey="name"            current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Recency (hari)"       colKey="recency"         current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Frequency (kali)"     colKey="frequency"       current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Monetary (Rp)"        colKey="monetary"        current={sortKey} dir={sortDir} onSort={toggleSort} />
              <SortableHeader label="Tgl Transaksi Terakhir" colKey="lastTransaction" current={sortKey} dir={sortDir} onSort={toggleSort} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-t border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                <td className="px-md py-3 font-mono text-xs text-on-surface-variant">{m.id}</td>
                <td className="px-md py-3 font-semibold text-on-surface">{m.name}</td>
                <td className="px-md py-3">
                  <span className={`font-bold text-xs ${m.recency <= 7 ? "text-emerald-600" : m.recency <= 30 ? "text-amber-600" : "text-red-600"}`}>
                    {m.recency}h
                  </span>
                </td>
                <td className="px-md py-3 font-semibold text-on-surface">{m.frequency}x</td>
                <td className="px-md py-3 font-bold text-primary">Rp {m.monetary.toLocaleString("id-ID")}</td>
                <td className="px-md py-3 text-xs text-on-surface-variant">{m.lastTransaction}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-lg text-on-surface-variant text-sm">Tidak ada data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Donut chart (SVG) ──────────────────────────────────────────────────────
function DonutChart({ segments, selectedKey, onSelect }: {
  segments: Segment[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const total = segments.reduce((a, s) => a + s.count, 0);
  const r = 90;
  const cx = 120;
  const cy = 120;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={240} height={240} className="overflow-visible">
        {segments.map((seg) => {
          const pct = seg.count / total;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const rotation = (offset / total) * 360 - 90;
          offset += seg.count;
          const isSelected = seg.key === selectedKey;

          return (
            <g key={seg.key} onClick={() => onSelect(seg.key)} className="cursor-pointer">
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={isSelected ? 28 : 22}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={0}
                strokeLinecap="butt"
                transform={`rotate(${rotation} ${cx} ${cy})`}
                className="transition-all duration-300"
                opacity={isSelected ? 1 : 0.7}
              />
            </g>
          );
        })}
        {/* Center */}
        <circle cx={cx} cy={cy} r={58} fill="white" />
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-sm font-bold fill-[#1a1c17]" fontSize={13} fontWeight={800}>
          {total.toLocaleString("id-ID")}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#72796c" fontWeight={600}>
          Total Anggota
        </text>
      </svg>
    </div>
  );
}

// ── RFM Score mini bar ─────────────────────────────────────────────────────
function RfmScoreBar({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
  return (
    <div className="space-y-xs">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
        <span className="text-[11px] font-bold text-primary">{value}/{max}</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-sm transition-all ${i < value ? "bg-primary" : "bg-outline-variant/30"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function RfmSegmentation() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("champions");
  const [activePillar, setActivePillar] = useState<keyof Recommendation>("marketing");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "members">("profile");

  useEffect(() => {
    fetch("/api/rfm")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSegments(data.segments);
          setSelectedKey(data.segments[0]?.key ?? "champions");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] flex-col gap-md">
        <span className="material-symbols-outlined text-[48px] animate-spin text-primary">sync</span>
        <p className="text-on-surface-variant font-semibold">Memuat data segmentasi...</p>
      </div>
    );
  }

  const activeSeg = segments.find((s) => s.key === selectedKey) ?? segments[0];
  const total = segments.reduce((a, s) => a + s.count, 0);

  return (
    <div className="dashboard-page dashboard-page-rfm space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">
      {/* Header */}
      <div className="anim-fade-in-up">
        <div className="flex items-center gap-sm mb-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Behavioral Segmentation RFM</h1>
            <p className="text-sm text-on-surface-variant">Profil anggota berbasis Recency × Frequency × Monetary</p>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter anim-fade-in-up">
        {[
          { label: "Total Anggota Aktif", value: total, icon: "person", color: "bg-amber-100 text-amber-700" },
          { label: "Segmen Champions", value: segments.find(s => s.key === "champions")?.count ?? 0, icon: "military_tech", color: "bg-emerald-100 text-emerald-700" },
          { label: "Perlu Perhatian", value: (segments.find(s => s.key === "at_risk")?.count ?? 0) + (segments.find(s => s.key === "lost")?.count ?? 0), icon: "warning", color: "bg-red-100 text-red-700" },
          { label: "Avg. Transaksi/Bln", value: 0, icon: "payments", color: "bg-violet-100 text-violet-700", formatted: "Rp 890rb" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md transition-shadow flex items-center gap-md">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
              <p className="text-2xl font-extrabold text-on-surface">
                {s.formatted ?? s.value.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-gutter">

        {/* Left: Donut + Segment List */}
        <div className="lg:col-span-4 space-y-md">
          {/* Donut Chart Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 anim-fade-in-up">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-md">Distribusi Segmen</p>
            <div className="flex justify-center mb-md">
              <DonutChart segments={segments} selectedKey={selectedKey} onSelect={setSelectedKey} />
            </div>
            {/* Legend */}
            <div className="space-y-xs">
              {segments.map((seg) => (
                <button
                  key={seg.key}
                  onClick={() => setSelectedKey(seg.key)}
                  className={`w-full flex items-center justify-between px-sm py-2.5 rounded-xl transition-all text-left ${
                    selectedKey === seg.key ? `${seg.bgColor} ${seg.borderColor} border` : "hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: seg.color }} />
                    <div>
                      <p className={`text-xs font-bold ${selectedKey === seg.key ? "text-on-surface" : "text-on-surface-variant"}`}>
                        {seg.name}
                      </p>
                      <p className="text-[10px] text-on-surface-variant">{seg.rfmScore}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-on-surface">{seg.count}</p>
                    <p className="text-[10px] text-on-surface-variant">{seg.percentage}%</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Segment Detail */}
        <div className="lg:col-span-8 space-y-md">
          {activeSeg && (
            <>
              {/* Segment Header */}
              <div className={`rounded-2xl p-md border ${activeSeg.borderColor} ${activeSeg.bgColor} anim-fade-in-up`}>
                <div className="flex items-start justify-between flex-wrap gap-md">
                  <div className="flex items-center gap-md">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm`} style={{ background: activeSeg.color + "20" }}>
                      <span className="material-symbols-outlined text-3xl" style={{ color: activeSeg.color, fontVariationSettings: "'FILL' 1" }}>{activeSeg.icon}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{activeSeg.rfmScore}</p>
                      <h2 className="text-2xl font-extrabold text-on-surface">{activeSeg.name}</h2>
                      <p className="text-sm text-on-surface-variant mt-xs">{activeSeg.demographics}</p>
                    </div>
                  </div>
                  <div className="flex gap-lg">
                    <div className="text-center">
                      <p className="text-2xl font-extrabold" style={{ color: activeSeg.color }}>{activeSeg.count}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase">Anggota</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-extrabold" style={{ color: activeSeg.color }}>{activeSeg.percentage}%</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase">Proporsi</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-extrabold" style={{ color: activeSeg.color }}>
                        {activeSeg.avgRecency}h
                      </p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase">Avg Recency</p>
                    </div>
                  </div>
                </div>

                {/* RFM Score bars */}
                <div className="mt-md grid grid-cols-3 gap-md">
                  {(() => {
                    const score = activeSeg.rfmScore.replace("RFM: ", "").split("-").map(Number);
                    return [
                      { label: "Recency", value: score[0] ?? 4 },
                      { label: "Frequency", value: score[1] ?? 4 },
                      { label: "Monetary", value: score[2] ?? 4 },
                    ];
                  })().map((r) => (
                    <RfmScoreBar key={r.label} label={r.label} value={r.value} />
                  ))}
                </div>
              </div>

              {/* Tabs: Profile vs Members */}
              <div className="flex gap-xs bg-surface-container-low rounded-xl p-1 w-fit">
                {[
                  { key: "profile", label: "Profil & Rekomendasi", icon: "person_search" },
                  { key: "members", label: "Daftar Anggota", icon: "list" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as typeof activeTab)}
                    className={`flex items-center gap-xs px-md py-2 rounded-lg font-semibold text-xs transition-all ${
                      activeTab === t.key ? "bg-primary text-white shadow-md" : "text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab: Profile / 5-Pillar */}
              {activeTab === "profile" && (
                <div className="space-y-md anim-fade-in-up">
                  {/* Avg Transaction */}
                  <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-sm">
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Rata-rata Nilai Transaksi</p>
                    </div>
                    <p className="text-3xl font-extrabold text-primary">
                      Rp {activeSeg.avgTransaction.toLocaleString("id-ID")}
                    </p>
                    <div className="mt-sm h-2 bg-outline-variant/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, (activeSeg.avgTransaction / 2_000_000) * 100)}%`, background: activeSeg.color }}
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-xs">per transaksi rata-rata anggota segmen ini</p>
                  </div>

                  {/* Pillar Tabs */}
                  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
                    {/* Pillar selector */}
                    <div className="flex border-b border-outline-variant/20 overflow-x-auto">
                      {pillars.map((p) => (
                        <button
                          key={p.key}
                          onClick={() => setActivePillar(p.key)}
                          className={`flex-1 min-w-[110px] flex flex-col items-center gap-xs py-md px-sm transition-all border-b-2 ${
                            activePillar === p.key
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-transparent text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-2xl ${activePillar === p.key ? "text-primary" : p.color}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {p.icon}
                          </span>
                          <span className="text-[11px] font-bold">{p.label}</span>
                          <span className={`text-[9px] font-semibold ${activePillar === p.key ? "text-primary/70" : "text-on-surface-variant"}`}>
                            {pillarGoals[p.key]}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Recommendation content */}
                    <div className="p-lg">
                      <div className="flex items-start gap-md">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0`} style={{ background: activeSeg.color + "15" }}>
                          <span
                            className="material-symbols-outlined text-2xl"
                            style={{ color: activeSeg.color, fontVariationSettings: "'FILL' 1" }}
                          >
                            {pillars.find(p => p.key === activePillar)?.icon}
                          </span>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-xs">
                            Rekomendasi {pillars.find(p => p.key === activePillar)?.label} — {activeSeg.name}
                          </p>
                          <p className="text-base font-semibold text-on-surface leading-relaxed">
                            {activeSeg.recommendations[activePillar]}
                          </p>
                          <div className="mt-md flex items-center gap-xs px-sm py-xs bg-surface-container rounded-xl">
                            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lightbulb</span>
                            <p className="text-[11px] text-on-surface-variant italic">
                              Tujuan: {pillarGoals[activePillar]}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* All pillars overview */}
                  <div className="grid sm:grid-cols-2 gap-sm">
                    {pillars.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setActivePillar(p.key)}
                        className={`flex items-start gap-sm p-sm rounded-xl text-left transition-all border ${
                          activePillar === p.key
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant/20 bg-surface-container-low hover:bg-surface-container"
                        }`}
                      >
                        <span className={`material-symbols-outlined text-xl ${p.color} mt-0.5`} style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-on-surface">{p.label}</p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-2 leading-relaxed">
                            {activeSeg.recommendations[p.key]}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Members */}
              {activeTab === "members" && (
                <MembersTable members={activeSeg.members ?? []} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
