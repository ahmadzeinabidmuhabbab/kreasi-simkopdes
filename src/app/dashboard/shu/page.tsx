"use client";

import React, { useState, useEffect, useCallback } from "react";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { useSortable } from "@/hooks/useSortable";

// ── Types ──────────────────────────────────────────────────────────────────
interface Deductions { operational: number; salaries: number; taxes: number; reserveFund: number }
interface Allocation { jasaModal: number; jasaAnggota: number; danaPendidikan: number; cadanganKoperasi: number }
interface ShuAggregate {
  grossProfit: number;
  deductions: Deductions;
  netShu: number;
  allocation: Allocation;
  period: string;
  totalMembers: number;
  blastSentCount: number;
}
interface MemberShu {
  id: number;
  name: string;
  memberId: string;
  simpananPokok: number;
  simpananWajib: number;
  totalBelanja: number;
  jasaModal: number;
  jasaAnggota: number;
  total: number;
  blastStatus: "BELUM" | "TERKIRIM";
  phone: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(2)} M`;
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

// ── Waterfall flow SVG ─────────────────────────────────────────────────────
function ShuFlowDiagram({ agg }: { agg: ShuAggregate }) {
  const { grossProfit, deductions, netShu, allocation } = agg;
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
  const maxBar = grossProfit;
  const bw = 40; // bar width

  const bars = [
    { label: "Keuntungan Bruto", value: grossProfit, color: "#2e591f", type: "income" },
    { label: "Operasional", value: -deductions.operational, color: "#ef4444", type: "expense" },
    { label: "Gaji Pegawai", value: -deductions.salaries, color: "#f97316", type: "expense" },
    { label: "Pajak", value: -deductions.taxes, color: "#eab308", type: "expense" },
    { label: "Cadangan", value: -deductions.reserveFund, color: "#8b5cf6", type: "expense" },
    { label: "SHU Bersih", value: netShu, color: "#0ea5e9", type: "result" },
  ];

  return (
    <div className="space-y-sm">
      <div className="flex items-end gap-sm overflow-x-auto pb-sm">
        {bars.map((bar, i) => {
          const h = Math.abs(bar.value / maxBar) * 120;
          return (
            <div key={i} className="flex flex-col items-center gap-xs min-w-[72px]">
              <span className="text-[10px] font-extrabold" style={{ color: bar.color }}>
                {bar.value > 0 ? fmt(bar.value) : fmt(-bar.value)}
              </span>
              <div
                className="w-12 rounded-t-lg transition-all duration-700 shadow-sm"
                style={{ height: `${h}px`, background: bar.color, opacity: bar.type === "expense" ? 0.85 : 1 }}
              />
              <p className="text-[9px] font-bold text-on-surface-variant text-center leading-tight">{bar.label}</p>
              {bar.type === "expense" && (
                <span className="text-[9px] font-bold text-red-500">▼</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Allocation row */}
      <div className="border-t border-outline-variant/20 pt-sm">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-sm">Alokasi SHU Bersih</p>
        <div className="grid grid-cols-4 gap-xs">
          {[
            { label: "Jasa Modal (30%)", value: allocation.jasaModal, color: "#2e591f" },
            { label: "Jasa Anggota (50%)", value: allocation.jasaAnggota, color: "#0ea5e9" },
            { label: "Dana Pendidikan (10%)", value: allocation.danaPendidikan, color: "#8b5cf6" },
            { label: "Cadangan Koperasi (10%)", value: allocation.cadanganKoperasi, color: "#f97316" },
          ].map((a) => (
            <div key={a.label} className="text-center p-sm rounded-xl" style={{ background: a.color + "15", border: `1px solid ${a.color}30` }}>
              <p className="text-sm font-extrabold" style={{ color: a.color }}>{fmt(a.value)}</p>
              <p className="text-[9px] font-semibold text-on-surface-variant leading-tight mt-xs">{a.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function ShuDistribution() {
  const [aggregate, setAggregate] = useState<ShuAggregate | null>(null);
  const [members, setMembers] = useState<MemberShu[]>([]);
  const [loading, setLoading] = useState(true);
  const [blastingAll, setBlastingAll] = useState(false);
  const [blastingId, setBlastingId] = useState<string | null>(null);
  const [filterBlast, setFilterBlast] = useState<"SEMUA" | "BELUM" | "TERKIRIM">("SEMUA");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<"aggregate" | "members">("aggregate");

  // WA Preview state
  const [waPreview, setWaPreview] = useState<{ member: MemberShu | null; isAll: boolean } | null>(null);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shu");
      const data = await res.json();
      if (data.success) {
        setAggregate(data.aggregate);
        setMembers(data.members);
      }
    } catch {
      showToast("Gagal memuat data SHU", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buildWaMessage = (member: MemberShu, period: string) =>
    `🌾 *KREASI Koperasi Desa*
─────────────────────
📋 *Informasi Distribusi SHU*
📅 Periode: *${period}*

Yth. Anggota,
*${member.name}* (${member.memberId})

💰 *Rincian SHU Anda:*
• Simpanan Pokok : ${fmt(member.simpananPokok)}
• Simpanan Wajib : ${fmt(member.simpananWajib)}
• Total Belanja   : ${fmt(member.totalBelanja)}

📦 *Komponen SHU:*
• Jasa Modal (30%) : ${fmt(member.jasaModal)}
• Jasa Anggota (50%): ${fmt(member.jasaAnggota)}

✅ *Total SHU Anda: ${fmt(member.total)}*

SHU akan dicairkan dalam waktu 5-7 hari kerja ke rekening terdaftar.
Info lebih lanjut hubungi pengurus koperasi.

_KREASI Portal · Tim Xensushi · Hackathon Simkopdes 2026_`;

  const confirmBlastSingle = async (member: MemberShu) => {
    setWaPreview(null);
    setBlastingId(member.memberId);
    try {
      const res = await fetch("/api/shu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "blast_single", memberId: member.memberId }),
      });
      const data = await res.json();
      if (data.success) { setMembers(data.members); showToast(data.message, "success"); }
    } catch { showToast("Gagal blast rincian SHU", "error"); }
    finally { setBlastingId(null); }
  };

  const confirmBlastAll = async () => {
    setWaPreview(null);
    setBlastingAll(true);
    try {
      const res = await fetch("/api/shu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "blast_all" }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.members);
        setAggregate(prev => prev ? { ...prev, blastSentCount: data.members.length } : prev);
        showToast(data.message, "success");
      }
    } catch { showToast("Gagal blast semua anggota", "error"); }
    finally { setBlastingAll(false); }
  };

  const filtered = members
    .filter(m => filterBlast === "SEMUA" || m.blastStatus === filterBlast)
    .filter(m =>
      searchQuery === "" ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberId.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const { sorted: sortedMembers, sortKey, sortDir, toggleSort } = useSortable(filtered, "name");

  const totalShu = members.reduce((a, m) => a + m.total, 0);
  const sentCount = members.filter(m => m.blastStatus === "TERKIRIM").length;
  const pendingCount = members.filter(m => m.blastStatus === "BELUM").length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh] flex-col gap-md">
      <span className="material-symbols-outlined text-[48px] animate-spin text-primary">sync</span>
      <p className="text-on-surface-variant font-semibold">Memuat data distribusi SHU...</p>
    </div>
  );

  return (
    <div className="space-y-lg w-full max-w-[1280px] mx-auto pb-2xl">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-sm px-md py-sm rounded-2xl shadow-2xl font-semibold text-sm anim-fade-in-up border ${
          toast.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md anim-fade-in-up">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-rose-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-on-surface">Automatic SHU Distribution</h1>
            <p className="text-sm text-on-surface-variant">Rincian SHU agregat & per anggota · Blast notifikasi WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button
            onClick={fetchData}
            className="flex items-center gap-xs px-md py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
            Refresh
          </button>
          <button
            onClick={() => {
              const firstPending = members.find(m => m.blastStatus === "BELUM");
              if (firstPending && aggregate) setWaPreview({ member: firstPending, isAll: true });
            }}
            disabled={blastingAll || sentCount === members.length}
            className="flex items-center gap-sm px-lg py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {blastingAll ? (
              <><span className="material-symbols-outlined text-[20px] animate-spin">autorenew</span>Mengirim...</>
            ) : (
              <><span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>Blast Semua Anggota</>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter anim-fade-in-up">
        {[
          { label: "SHU Bersih Total", value: aggregate ? fmt(aggregate.netShu) : "—", icon: "savings", color: "bg-rose-100 text-rose-700" },
          { label: "Dibagikan ke Anggota", value: aggregate ? fmt(aggregate.netShu * 0.8) : "—", icon: "diversity_1", color: "bg-emerald-100 text-emerald-700" },
          { label: "Notif Terkirim", value: `${sentCount}/${members.length}`, icon: "send", color: "bg-sky-100 text-sky-700" },
          { label: "Belum Terkirim", value: pendingCount, icon: "pending", color: "bg-amber-100 text-amber-700" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 hover:shadow-md transition-shadow flex items-center gap-md">
            <div className={`w-12 h-12 rounded-xl ${s.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </div>
            <div>
              <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</p>
              <p className="text-xl font-extrabold text-on-surface">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Blast Progress Bar */}
      {members.length > 0 && (
        <div className="bg-surface-container-lowest rounded-2xl p-md border border-outline-variant/20 anim-fade-in-up">
          <div className="flex items-center justify-between mb-sm">
            <p className="text-sm font-bold text-on-surface">Progress Pengiriman Notifikasi SHU</p>
            <span className="text-sm font-extrabold text-primary">{Math.round((sentCount / members.length) * 100)}%</span>
          </div>
          <div className="h-3 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(sentCount / members.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-xs text-[10px] text-on-surface-variant font-semibold">
            <span>✅ {sentCount} terkirim</span>
            <span>⏳ {pendingCount} menunggu</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-xs bg-surface-container-low rounded-2xl p-1 w-fit">
        {[
          { key: "aggregate", label: "Rincian Agregat SHU", icon: "calculate" },
          { key: "members", label: "SHU Per Anggota", icon: "person" },
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

      {/* ══ TAB: AGGREGATE ══ */}
      {activeTab === "aggregate" && aggregate && (
        <div className="space-y-gutter">

          {/* Period */}
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
            <p className="font-bold text-on-surface">Periode: <span className="text-primary">{aggregate.period}</span></p>
            <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{aggregate.totalMembers} Anggota Aktif</span>
          </div>

          {/* Flow Diagram */}
          <div className="bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant/20">
            <p className="font-extrabold text-on-surface mb-md">Alur Kalkulasi SHU (Waterfall)</p>
            <ShuFlowDiagram agg={aggregate} />
          </div>

          {/* Deduction Detail Cards */}
          <div className="grid md:grid-cols-2 gap-gutter">
            {/* Gross Profit & Deductions */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
              <div className="p-md border-b border-outline-variant/20">
                <p className="font-extrabold text-on-surface">Rincian Potongan dari Keuntungan Bruto</p>
              </div>
              <div className="p-md space-y-sm">
                {/* Gross profit row */}
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-emerald-700 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                    </div>
                    <p className="font-bold text-on-surface">Keuntungan Bruto</p>
                  </div>
                  <p className="font-extrabold text-emerald-600 text-lg">{fmt(aggregate.grossProfit)}</p>
                </div>

                {/* Deduction rows */}
                {[
                  { key: "operational", label: "Biaya Operasional", icon: "store", color: "bg-red-100 text-red-700" },
                  { key: "salaries",    label: "Gaji & Tunjangan Pegawai", icon: "badge", color: "bg-orange-100 text-orange-700" },
                  { key: "taxes",       label: "Pajak (PPh & PPN)", icon: "account_balance", color: "bg-yellow-100 text-yellow-700" },
                  { key: "reserveFund", label: "Dana Cadangan Koperasi", icon: "savings", color: "bg-violet-100 text-violet-700" },
                ].map((d) => (
                  <div key={d.key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-sm">
                      <div className={`w-9 h-9 rounded-lg ${d.color} flex items-center justify-center`}>
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{d.icon}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface text-sm">{d.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-red-600">– {fmt(aggregate.deductions[d.key as keyof Deductions])}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {Math.round((aggregate.deductions[d.key as keyof Deductions] / aggregate.grossProfit) * 100)}% dari bruto
                      </p>
                    </div>
                  </div>
                ))}

                {/* Net result */}
                <div className="flex items-center justify-between py-3 px-md bg-primary/5 rounded-xl border border-primary/20 mt-sm">
                  <div className="flex items-center gap-sm">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>
                    <p className="font-extrabold text-primary">SHU Bersih Siap Dibagikan</p>
                  </div>
                  <p className="font-extrabold text-primary text-xl">{fmt(aggregate.netShu)}</p>
                </div>
              </div>
            </div>

            {/* Allocation */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
              <div className="p-md border-b border-outline-variant/20">
                <p className="font-extrabold text-on-surface">Alokasi SHU Bersih</p>
                <p className="text-xs text-on-surface-variant mt-xs">Berdasarkan AD/ART Koperasi</p>
              </div>
              <div className="p-md space-y-sm">
                {[
                  { label: "Jasa Modal (30%)",           value: aggregate.allocation.jasaModal,          desc: "Proporsional simpanan anggota",      color: "#2e591f", icon: "savings" },
                  { label: "Jasa Anggota (50%)",          value: aggregate.allocation.jasaAnggota,        desc: "Proporsional volume belanja anggota", color: "#0ea5e9", icon: "shopping_cart" },
                  { label: "Dana Pendidikan (10%)",        value: aggregate.allocation.danaPendidikan,      desc: "Program pemberdayaan & pelatihan",    color: "#8b5cf6", icon: "school" },
                  { label: "Cadangan Koperasi (10%)",      value: aggregate.allocation.cadanganKoperasi,   desc: "Stabilitas keuangan jangka panjang",  color: "#f97316", icon: "account_balance" },
                ].map((a) => {
                  const pct = Math.round((a.value / aggregate.netShu) * 100);
                  return (
                    <div key={a.label} className="space-y-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-[18px]" style={{ color: a.color, fontVariationSettings: "'FILL' 1" }}>{a.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{a.label}</p>
                            <p className="text-[10px] text-on-surface-variant">{a.desc}</p>
                          </div>
                        </div>
                        <p className="font-extrabold" style={{ color: a.color }}>{fmt(a.value)}</p>
                      </div>
                      <div className="h-2 bg-outline-variant/20 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: a.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: MEMBERS ══ */}
      {activeTab === "members" && (
        <div className="space-y-md">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-md items-start sm:items-center justify-between">
            {/* Search */}
            <div className="flex items-center gap-xs px-md py-2.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl w-full sm:w-72">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
              <input
                type="text"
                placeholder="Cari nama / ID anggota..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="material-symbols-outlined text-[16px] text-on-surface-variant hover:text-primary">close</button>
              )}
            </div>

            {/* Filter */}
            <div className="flex gap-xs">
              {(["SEMUA", "BELUM", "TERKIRIM"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterBlast(f)}
                  className={`px-md py-2 rounded-xl text-[11px] font-bold transition-all ${
                    filterBlast === f
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {f === "SEMUA" ? `Semua (${members.length})` : f === "TERKIRIM" ? `Terkirim (${sentCount})` : `Belum (${pendingCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Summary row */}
          <div className="flex items-center gap-md text-sm text-on-surface-variant">
            <span>Menampilkan <strong className="text-on-surface">{sortedMembers.length}</strong> dari {members.length} anggota</span>
            <span>·</span>
            <span>Total SHU: <strong className="text-primary">{fmt(totalShu)}</strong></span>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/20">
                    <SortableHeader label="ID Anggota"    colKey="memberId"      current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Nama"          colKey="name"          current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Simpanan Pokok" colKey="simpananPokok" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Simpanan Wajib" colKey="simpananWajib" current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Total Belanja" colKey="totalBelanja"  current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Jasa Modal"    colKey="jasaModal"     current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Jasa Anggota"  colKey="jasaAnggota"   current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Total SHU"     colKey="total"         current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Status Blast"  colKey="blastStatus"   current={sortKey} dir={sortDir} onSort={toggleSort} />
                    <th className="px-md py-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.map((m) => (
                    <tr key={m.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-md py-3 font-mono text-xs text-on-surface-variant">{m.memberId}</td>
                      <td className="px-md py-3 font-bold text-on-surface whitespace-nowrap">{m.name}</td>
                      <td className="px-md py-3 text-on-surface-variant text-xs">{fmt(m.simpananPokok)}</td>
                      <td className="px-md py-3 text-on-surface-variant text-xs">{fmt(m.simpananWajib)}</td>
                      <td className="px-md py-3 font-semibold text-on-surface text-xs">{fmt(m.totalBelanja)}</td>
                      <td className="px-md py-3 text-emerald-600 font-semibold text-xs">{fmt(m.jasaModal)}</td>
                      <td className="px-md py-3 text-sky-600 font-semibold text-xs">{fmt(m.jasaAnggota)}</td>
                      <td className="px-md py-3">
                        <p className="font-extrabold text-primary text-sm">{fmt(m.total)}</p>
                      </td>
                      <td className="px-md py-3">
                        <div className={`inline-flex items-center gap-xs px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          m.blastStatus === "TERKIRIM"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.blastStatus === "TERKIRIM" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                          {m.blastStatus === "TERKIRIM" ? "Terkirim" : "Belum"}
                        </div>
                      </td>
                      <td className="px-md py-3">
                        {m.blastStatus === "BELUM" ? (
                          <button
                            onClick={() => aggregate && setWaPreview({ member: m, isAll: false })}
                            disabled={blastingId === m.memberId}
                            className="flex items-center gap-xs px-sm py-1.5 bg-primary text-white rounded-lg text-[11px] font-bold hover:bg-primary/90 transition-all disabled:opacity-60 whitespace-nowrap"
                          >
                            {blastingId === m.memberId ? (
                              <span className="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">send</span>
                            )}
                            Blast
                          </button>
                        ) : (
                          <button
                            onClick={() => aggregate && setWaPreview({ member: m, isAll: false })}
                            className="flex items-center gap-xs px-sm py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-[11px] font-bold hover:bg-surface-container-high transition-all whitespace-nowrap"
                          >
                            <span className="material-symbols-outlined text-[14px]">refresh</span>
                            Kirim Ulang
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-2xl text-center">
                <span className="material-symbols-outlined text-5xl text-outline mb-md">inbox</span>
                <p className="font-bold text-on-surface-variant">Tidak ada data yang cocok</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ WHATSAPP PREVIEW MODAL ══ */}
      {waPreview && waPreview.member && aggregate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setWaPreview(null)} />
          <div className="relative bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 w-full max-w-lg flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-xl pt-lg pb-md border-b border-outline-variant/20 shrink-0">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.118 1.528 5.845L0 24l6.317-1.506A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 01-5.001-1.373l-.36-.213-3.748.893.935-3.642-.233-.374A9.789 9.789 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182S21.818 6.578 21.818 12 17.422 21.818 12 21.818z"/></svg>
                </div>
                <div>
                  <p className="font-extrabold text-on-surface">Preview Pesan WhatsApp</p>
                  <p className="text-xs text-on-surface-variant">
                    {waPreview.isAll ? `Blast ke semua ${members.filter(m => m.blastStatus === "BELUM").length} anggota` : `Ke: ${waPreview.member.name} (${waPreview.member.phone})`}
                  </p>
                </div>
              </div>
              <button onClick={() => setWaPreview(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* WhatsApp bubble preview */}
            <div className="overflow-y-auto flex-1 p-xl">
              <div className="rounded-2xl overflow-hidden" style={{ background: "#e5ddd5" }}>
                {/* WA header bar */}
                <div className="flex items-center gap-sm px-md py-3" style={{ background: "#075E54" }}>
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-sm shrink-0">K</div>
                  <div>
                    <p className="font-bold text-white text-sm">Koperasi Desa KREASI</p>
                    <p className="text-[10px] text-white/70">Distribusi SHU {aggregate.period}</p>
                  </div>
                </div>
                {/* Message bubble */}
                <div className="p-md">
                  <div className="bg-white rounded-2xl rounded-tl-none p-md shadow-sm max-w-[85%]">
                    <p className="text-sm text-on-surface whitespace-pre-wrap font-mono leading-relaxed">
                      {buildWaMessage(waPreview.member, aggregate.period)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/60 text-right mt-sm">
                      {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} ✓✓
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-md px-xl pb-xl pt-md border-t border-outline-variant/20 shrink-0">
              <button onClick={() => setWaPreview(null)} className="flex-1 py-3 border border-outline-variant/30 rounded-xl font-semibold text-sm text-on-surface-variant hover:bg-surface-container transition-colors">
                Batal
              </button>
              <button
                onClick={() => {
                  if (waPreview.isAll) confirmBlastAll();
                  else confirmBlastSingle(waPreview.member!);
                }}
                className="flex-1 py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-sm"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                {waPreview.isAll ? "Kirim ke Semua Anggota" : "Kirim Pesan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
