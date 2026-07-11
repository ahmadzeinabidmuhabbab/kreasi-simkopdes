"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./dashboard-shell.css";

type Tone = "primary" | "amber" | "sky" | "violet" | "rose" | "cyan" | "orange" | "purple";

interface NavItem {
  name: string;
  href: string;
  icon: string;
  description: string;
  tone: Tone;
}

const navItems: NavItem[] = [
{ name: "AI Demand Intelligence", href: "/dashboard/demand", icon: "psychology", description: "Prediksi demand & RFQ", tone: "primary" },
{ name: "RFM Segmentation", href: "/dashboard/rfm", icon: "groups", description: "Profil anggota", tone: "amber" },
{ name: "Smart Bundle & Stock", href: "/dashboard/bundle", icon: "inventory_2", description: "Planogram & pricing", tone: "sky" },
  { name: "Data Transaksi", href: "/dashboard/transactions", icon: "receipt_long", description: "Penjualan anggota", tone: "cyan" },
  { name: "Data Stok", href: "/dashboard/stock", icon: "warehouse", description: "Inventaris", tone: "orange" },
{ name: "Data User", href: "/dashboard/users", icon: "manage_accounts", description: "Akun & akses", tone: "purple" },
];

const toneClass: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-secondary-container/25 text-on-secondary-container",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
  cyan: "bg-cyan-100 text-cyan-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
};

const notifications = [
  { title: "Stok LPG kritis", body: "Sisa 5 tabung. Restock disarankan hari ini.", icon: "warning", tone: "border-error/35 bg-error-container/45 text-error" },
  { title: "Demand naik", body: "Semen Gresik diproyeksikan +28% minggu depan.", icon: "trending_up", tone: "border-primary/25 bg-primary/5 text-primary" },
  { title: "SHU siap", body: "Rp 1.5M SHU bersih siap didistribusikan.", icon: "payments", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
] as const;

function MaterialIcon({
  children,
  className = "",
  filled = false,
}: {
  children: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
    >
      {children}
    </span>
  );
}

function Sidebar({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
<div className="dashboard-sidebar flex h-full flex-col bg-surface-container-lowest">
      <div className="border-b border-outline-variant/35 px-md py-sm">
        <Link
          href="/"
          onClick={onClose}
className="flex min-h-12 items-center gap-sm rounded-xl px-xs text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-sm">
<MaterialIcon filled className="text-[22px]">
              agriculture
            </MaterialIcon>
          </span>
          <span className="min-w-0">
<span className="block text-lg font-extrabold leading-none text-primary">KREASI</span>
<span className="mt-1 block text-[11px] font-bold uppercase tracking-normal text-on-surface-variant">
              Operations Console
            </span>
          </span>
        </Link>
      </div>

      <div className="border-b border-outline-variant/25 px-md py-sm">
<div className="flex items-center justify-between gap-sm rounded-xl border border-outline-variant/20 bg-surface-container-low px-sm py-2 shadow-sm">
          <div className="min-w-0">
<p className="text-sm font-extrabold leading-tight text-on-surface">Koperasi Sumber Makmur</p>
<p className="mt-0.5 text-[11px] font-medium text-on-surface-variant">Workspace aktif</p>
          </div>
<span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            Live
          </span>
        </div>
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-sm py-sm" aria-label="Navigasi dashboard">
        <p className="px-sm pb-xs text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
          Modul
        </p>
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
className={`group flex min-h-[58px] items-center gap-sm rounded-xl border px-sm py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                  active
? "border-primary/25 bg-primary/8 text-on-surface shadow-sm"
                    : "border-transparent text-on-surface-variant hover:border-outline-variant/35 hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span
className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                    active ? toneClass[item.tone] : "bg-surface-container text-on-surface-variant group-hover:text-primary"
                  }`}
                >
<MaterialIcon filled={active} className="text-[21px]">
                    {item.icon}
                  </MaterialIcon>
                </span>
                <span className="min-w-0 flex-1">
<span className="block break-words text-[14px] font-extrabold leading-tight">{item.name}</span>
<span className="mt-0.5 block break-words text-[11px] leading-snug text-on-surface-variant">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-outline-variant/30 p-sm">
<div className="flex items-center gap-sm rounded-xl border border-outline-variant/25 bg-surface-container-low p-sm shadow-sm">
<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-on-primary">A</span>
          <span className="min-w-0 flex-1">
<span className="block break-words text-sm font-extrabold leading-tight text-on-surface">Admin Kopdes</span>
<span className="mt-0.5 block text-[11px] text-on-surface-variant">Full access</span>
          </span>
          <Link
            href="/"
            onClick={onClose}
            aria-label="Kembali ke landing"
className="flex size-10 shrink-0 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
<MaterialIcon className="text-[20px]">logout</MaterialIcon>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const activeItem = useMemo(
    () => navItems.find((item) => pathname === item.href) ?? navItems[0],
    [pathname],
  );

  return (
    <div className="dashboard-shell h-dvh overflow-hidden bg-surface-container-low text-on-surface">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-outline-variant/35 bg-surface-container-lowest/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-sm">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka navigasi"
              className="flex size-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 md:hidden"
            >
              <MaterialIcon className="text-[22px]">menu</MaterialIcon>
            </button>

            <Link
              href="/"
              className="hidden rounded-md px-2 py-1 text-sm font-extrabold text-primary hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 sm:inline-flex"
            >
              KREASI
            </Link>
            <MaterialIcon className="hidden text-[16px] text-outline sm:inline-flex">chevron_right</MaterialIcon>
<div className="min-w-0 max-w-[min(18rem,calc(100vw-8rem))]">
<p className="break-words text-sm font-extrabold leading-tight text-on-surface sm:whitespace-nowrap">{activeItem.name}</p>
<p className="break-words text-[11px] leading-tight text-on-surface-variant sm:hidden">{activeItem.description}</p>
            </div>
          </div>

          <div className="relative flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label="Buka notifikasi"
              aria-expanded={notificationsOpen}
              className="relative flex size-10 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              <MaterialIcon className="text-[21px]">notifications</MaterialIcon>
              <span className="absolute right-2 top-2 size-2 rounded-full bg-error" />
            </button>

            {notificationsOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Tutup notifikasi"
                  className="fixed inset-0 cursor-default"
                  onClick={() => setNotificationsOpen(false)}
                />
                <div className="absolute right-0 top-12 z-50 w-[min(21rem,calc(100vw-1rem))] rounded-lg border border-outline-variant/35 bg-surface-container-lowest p-sm shadow-lg">
                  <div className="mb-sm flex items-center justify-between gap-sm px-xs">
                    <div>
                      <h2 className="text-sm font-extrabold text-on-surface">Notifikasi</h2>
                      <p className="text-[11px] text-on-surface-variant">Operasional terbaru</p>
                    </div>
                    <span className="rounded-md bg-surface-container px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-xs">
                    {notifications.map((notification) => (
                      <div
                        key={notification.title}
                        className={`flex items-start gap-sm rounded-md border p-sm ${notification.tone}`}
                      >
                        <MaterialIcon filled className="mt-0.5 text-[18px]">
                          {notification.icon}
                        </MaterialIcon>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-extrabold text-on-surface">{notification.title}</p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">{notification.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            <div className="hidden h-7 w-px bg-outline-variant/35 sm:block" />
            <div className="hidden items-center gap-sm rounded-lg border border-outline-variant/30 bg-surface-container-low px-2 py-1 sm:flex">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-[11px] font-extrabold text-on-primary">A</span>
              <span className="hidden text-xs font-bold text-on-surface lg:inline">Admin Kopdes</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-dvh overflow-hidden pt-14">
<aside className="fixed left-0 top-14 z-30 hidden h-[calc(100dvh-3.5rem)] w-[280px] shrink-0 overflow-hidden border-r border-outline-variant/35 lg:block">
          <Sidebar pathname={pathname} />
        </aside>

        {sidebarOpen ? (
          <>
            <button
              type="button"
              aria-label="Tutup navigasi"
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/45 lg:hidden"
            />
<aside className="fixed inset-y-0 left-0 z-50 w-[min(21.5rem,92vw)] border-r border-outline-variant/35 shadow-xl lg:hidden">
              <Sidebar pathname={pathname} onClose={() => setSidebarOpen(false)} />
            </aside>
          </>
        ) : null}

<main id="main-content" className="custom-scrollbar h-[calc(100dvh-3.5rem)] min-w-0 flex-1 overflow-y-auto lg:ml-[280px]">
          <div className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-4 sm:py-4 lg:px-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
