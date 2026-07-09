"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
  accentBg: string;
  accentText: string;
  activeBg: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      name: "AI Demand Intelligence",
      href: "/dashboard/demand",
      icon: "psychology",
      description: "Prediksi demand & RFQ",
      accentBg: "bg-emerald-100",
      accentText: "text-emerald-700",
      activeBg: "bg-emerald-50 border-l-4 border-emerald-500",
    },
    {
      name: "RFM Segmentation",
      href: "/dashboard/rfm",
      icon: "groups",
      description: "Profil & rekomendasi anggota",
      accentBg: "bg-amber-100",
      accentText: "text-amber-700",
      activeBg: "bg-amber-50 border-l-4 border-amber-500",
    },
    {
      name: "Smart Bundle & Stock",
      href: "/dashboard/bundle",
      icon: "inventory_2",
      description: "Pengadaan, rak & pricing",
      accentBg: "bg-sky-100",
      accentText: "text-sky-700",
      activeBg: "bg-sky-50 border-l-4 border-sky-500",
    },
    {
      name: "Arus SAK-EP",
      href: "/dashboard/finance",
      icon: "account_balance_wallet",
      description: "Laporan keuangan & PDF",
      accentBg: "bg-violet-100",
      accentText: "text-violet-700",
      activeBg: "bg-violet-50 border-l-4 border-violet-500",
    },
    {
      name: "Distribusi SHU",
      href: "/dashboard/shu",
      icon: "payments",
      description: "Kalkulasi & blast SHU",
      accentBg: "bg-rose-100",
      accentText: "text-rose-700",
      activeBg: "bg-rose-50 border-l-4 border-rose-500",
    },
    {
      name: "Riwayat Transaksi",
      href: "/dashboard/transactions",
      icon: "receipt_long",
      description: "Transaksi penjualan anggota",
      accentBg: "bg-cyan-100",
      accentText: "text-cyan-700",
      activeBg: "bg-cyan-50 border-l-4 border-cyan-500",
    },
    {
      name: "Stok Barang",
      href: "/dashboard/stock",
      icon: "warehouse",
      description: "Inventaris & monitoring stok",
      accentBg: "bg-orange-100",
      accentText: "text-orange-700",
      activeBg: "bg-orange-50 border-l-4 border-orange-500",
    },
    {
      name: "Manajemen User",
      href: "/dashboard/users",
      icon: "manage_accounts",
      description: "Kelola akun & hak akses",
      accentBg: "bg-purple-100",
      accentText: "text-purple-700",
      activeBg: "bg-purple-50 border-l-4 border-purple-500",
    },
  ];


  const notifications = [
    { title: "Stok Gas LPG Kritis!", body: "Sisa 5 tabung — segera lakukan restock 300 unit.", color: "border-red-500", icon: "warning", iconColor: "text-red-500" },
    { title: "Prediksi Demand Baru", body: "Semen Gresik diproyeksikan naik +28% minggu depan.", color: "border-primary", icon: "trending_up", iconColor: "text-primary" },
    { title: "SHU Siap Dibagikan", body: "Rp 1.5M SHU bersih siap diblast ke 785 anggota.", color: "border-emerald-500", icon: "payments", iconColor: "text-emerald-600" },
    { title: "Laporan SAK-EP Tersedia", body: "Laporan Q2 2026 telah selesai di-generate otomatis.", color: "border-violet-500", icon: "picture_as_pdf", iconColor: "text-violet-600" },
  ];

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-md py-lg border-b border-outline-variant/20 shrink-0">
        <Link href="/" className="flex items-center gap-sm" onClick={onClose}>
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
          </div>
          <div>
            <p className="font-extrabold text-lg text-primary leading-none">KREASI</p>
            <p className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-widest">Portal AI Desa</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-sm px-sm overflow-y-auto custom-scrollbar">
        <p className="text-[9px] font-extrabold text-on-surface-variant uppercase tracking-widest px-sm py-sm opacity-60">
          Modul AI Koperasi
        </p>
        <div className="flex flex-col gap-xs">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-sm px-sm py-2.5 rounded-xl transition-all group ${
                  active
                    ? `${item.activeBg} shadow-sm`
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  active ? `${item.accentBg} shadow-sm` : `bg-surface-container group-hover:${item.accentBg}`
                }`}>
                  <span
                    className={`material-symbols-outlined text-xl ${active ? item.accentText : "text-on-surface-variant"}`}
                    style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-${active ? "extrabold" : "semibold"} leading-tight ${active ? "text-on-surface" : ""} truncate`}>
                    {item.name}
                  </p>
                  <p className={`text-[10px] font-medium leading-none mt-0.5 ${active ? "text-on-surface-variant" : "text-on-surface-variant/70"} truncate`}>
                    {item.description}
                  </p>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-outline-variant/20 p-sm shrink-0 space-y-xs">
        <div className="flex items-center gap-sm px-sm py-2 rounded-xl bg-surface-container">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-extrabold shrink-0">A</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-on-surface truncate">Admin Kopdes</p>
            <p className="text-[10px] text-on-surface-variant truncate">Koperasi Desa Sumber Makmur</p>
          </div>
        </div>
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-sm px-sm py-2 text-on-surface-variant hover:bg-red-50 hover:text-red-700 rounded-xl font-semibold transition-all text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Kembali ke Landing</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 h-14 flex items-center justify-between px-md gap-md shrink-0">
        <div className="flex items-center gap-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          {/* Active page breadcrumb */}
          <div className="hidden sm:flex items-center gap-xs text-sm">
            <Link href="/" className="text-on-surface-variant hover:text-primary transition-colors font-semibold">KREASI</Link>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">chevron_right</span>
            <span className="font-bold text-on-surface">
              {navItems.find(n => n.href === pathname)?.name ?? "Dashboard"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-sm relative">
          {/* Notification button */}
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative w-9 h-9 flex items-center justify-center hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-surface animate-pulse" />
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 top-11 w-80 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl p-md z-50">
                <div className="flex items-center justify-between mb-md">
                  <h3 className="font-extrabold text-sm text-on-surface">Notifikasi Terkini</h3>
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{notifications.length} baru</span>
                </div>
                <div className="space-y-xs max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.map((n, i) => (
                    <div key={i} className={`flex items-start gap-sm p-sm hover:bg-surface-container-low rounded-xl border-l-4 ${n.color} cursor-pointer transition-colors`}>
                      <span className={`material-symbols-outlined text-[18px] shrink-0 mt-0.5 ${n.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{n.icon}</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">{n.title}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">{n.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-6 w-px bg-outline-variant/30" />
          <div className="flex items-center gap-sm">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-extrabold">A</div>
            <span className="hidden md:inline text-xs font-bold text-on-surface-variant">Admin Kopdes</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-60 bg-surface-container-lowest border-r border-outline-variant/20 shrink-0 overflow-hidden">
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar Drawer */}
        {sidebarOpen && (
          <>
            <div
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            />
            <aside className="md:hidden fixed top-0 left-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col z-50 shadow-2xl">
              <div className="flex justify-between items-center px-md pt-md pb-sm border-b border-outline-variant/20">
                <span className="font-extrabold text-primary">KREASI Portal</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-surface-container-low/20 custom-scrollbar">
          <div className="p-md md:p-lg min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
