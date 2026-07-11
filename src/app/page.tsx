"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import RfqAssistant from "@/components/landing/RfqAssistant";

// Scroll reveal hook
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    document
      .querySelectorAll(".reveal, .reveal-left, .reveal-right")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// Animated counter
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
          const duration = 1800;
          const step = target / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString("id-ID")}{suffix}
    </span>
  );
}

const features = [
  {
    key: "demand",
    href: "/dashboard/demand",
    icon: "psychology",
    badge: "AI Powered",
    badgeColor: "bg-emerald-100 text-emerald-800",
    title: "AI Demand Intelligence",
    subtitle: "Prediksi permintaan komoditas secara otomatis",
    description:
      "Konversi data unstructured dari berita lokal & Google Trends menjadi prediksi permintaan komoditas dan RFQ otomatis. Minimasi risiko overstock dengan kecerdasan buatan.",
    colSpan: "md:col-span-8",
    gradient: "from-emerald-50 to-green-50",
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-100 text-emerald-700",
    tags: ["Berita Lokal", "Google Trends", "Auto-RFQ"],
  },
  {
    key: "rfm",
    href: "/dashboard/rfm",
    icon: "groups",
    badge: "Segmentasi",
    badgeColor: "bg-amber-100 text-amber-800",
    title: "Behavioral Segmentation RFM",
    subtitle: "Profil anggota berbasis algoritma RFM",
    description:
      "5 pilar rekomendasi taktis: Marketing, Product, Pricing, Credit & Relationship untuk tiap segmen anggota.",
    colSpan: "md:col-span-4",
    gradient: "from-amber-50 to-yellow-50",
    accent: "bg-amber-500",
    iconBg: "bg-amber-100 text-amber-700",
    tags: ["Champions", "At-Risk", "Lost"],
  },
  {
    key: "bundle",
    href: "/dashboard/bundle",
    icon: "inventory_2",
    badge: "Optimasi",
    badgeColor: "bg-sky-100 text-sky-800",
    title: "Smart Predictive Bundle",
    subtitle: "Optimasi stok, rak, dan harga dinamis",
    description:
      "Rekomendasi pengadaan, restock, penempatan barang di rak, dan dynamic pricing berbasis Market Basket Analysis.",
    colSpan: "md:col-span-4",
    gradient: "from-sky-50 to-blue-50",
    accent: "bg-sky-500",
    iconBg: "bg-sky-100 text-sky-700",
    tags: ["Pengadaan", "Shelf Placement", "Dynamic Pricing"],
  },
  {
    key: "finance",
    href: "/dashboard/finance",
    icon: "account_balance_wallet",
    badge: "SAK-EP",
    badgeColor: "bg-violet-100 text-violet-800",
    title: "Automated Financial Flow",
    subtitle: "Laporan keuangan SAK-EP real-time",
    description:
      "Dashboard arus keuangan komprehensif dengan line chart, donut chart kategori, dan ekspor laporan SAK-EP ke PDF.",
    colSpan: "md:col-span-5",
    gradient: "from-violet-50 to-purple-50",
    accent: "bg-violet-500",
    iconBg: "bg-violet-100 text-violet-700",
    tags: ["Line Chart", "Donut Chart", "PDF Export"],
  },
  {
    key: "shu",
    href: "/dashboard/shu",
    icon: "payments",
    badge: "Distribusi",
    badgeColor: "bg-rose-100 text-rose-800",
    title: "Automatic SHU Distribution",
    subtitle: "Distribusi SHU transparan per anggota",
    description:
      "Kalkulasi SHU bersih setelah potongan biaya operasional, pegawai & pajak. Blast notifikasi SHU ke seluruh atau per anggota.",
    colSpan: "md:col-span-3",
    gradient: "from-rose-50 to-pink-50",
    accent: "bg-rose-500",
    iconBg: "bg-rose-100 text-rose-700",
    tags: ["Auto Kalkulasi", "Blast Notif", "Per Anggota"],
  },
];

const stats = [
  { value: 5, suffix: " Fitur AI", label: "Inovasi Unggulan", icon: "auto_awesome" },
  { value: 100, suffix: "%", label: "Transparansi Data", icon: "verified" },
  { value: 24, suffix: " Jam/Hari", label: "Monitor Real-time", icon: "monitoring" },
  { value: 3, suffix: " Detik", label: "Generate Laporan", icon: "speed" },
];

const pillars = [
  { icon: "trending_up", title: "Demand Prediction", desc: "Antisisipasi kebutuhan sebelum terjadi kekurangan" },
  { icon: "person_search", title: "Member Profiling", desc: "Pahami kebiasaan belanja setiap anggota" },
  { icon: "package_2", title: "Smart Inventory", desc: "Stok selalu tepat, tidak lebih tidak kurang" },
  { icon: "receipt_long", title: "SAK-EP Report", desc: "Laporan keuangan standar siap audit kapan saja" },
  { icon: "diversity_3", title: "SHU Adil", desc: "Pembagian hasil usaha transparan dan otomatis" },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useScrollReveal();

  // Navbar scroll effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number; y: number; vx: number; vy: number; r: number; opacity: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(46,89,31,${p.opacity})`;
        ctx.fill();
      });
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(46,89,31,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header
        className={`sticky top-0 w-full z-50 transition-all duration-500 h-[72px] ${
          scrolled
            ? "bg-surface/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-md shadow-black/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-lg h-full flex justify-between items-center">
          <div className="flex items-center gap-2.5 select-none">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                agriculture
              </span>
            </div>
            <span className="font-extrabold text-2xl text-primary tracking-tight">KREASI</span>
            <span className="hidden sm:inline text-[11px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              AI × Koperasi Desa
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-lg">
            <a href="#features" className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors">
              Fitur
            </a>
            <a href="#stats" className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors">
              Dampak
            </a>
            <a href="#connectivity" className="font-semibold text-sm text-on-surface-variant hover:text-primary transition-colors">
              Ekosistem
            </a>
          </nav>

          <div className="flex items-center gap-md">
            <Link
              href="/dashboard/demand"
              className="hidden sm:flex items-center gap-2 px-md py-2.5 bg-primary text-white rounded-xl font-bold text-sm transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                dashboard
              </span>
              Portal AI
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[72px] left-0 w-full bg-surface/98 backdrop-blur-xl border-b border-outline-variant/30 py-md px-lg shadow-xl flex flex-col gap-sm z-50">
            {["#features", "#stats", "#connectivity"].map((href, i) => (
              <a
                key={i}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-semibold text-on-surface-variant hover:text-primary py-2.5 transition-colors border-b border-outline-variant/10"
              >
                {["Fitur", "Dampak", "Ekosistem"][i]}
              </a>
            ))}
            <Link
              href="/dashboard/demand"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-base px-md py-3 bg-primary text-white rounded-xl font-bold transition-all mt-sm"
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Masuk Portal AI</span>
            </Link>
          </div>
        )}
      </header>

      <main className="w-full flex-grow">
        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#f0f7ec] via-background to-[#fef9ec]">
          {/* Particle canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          />

          {/* Background orbs */}
          <div className="orb w-[600px] h-[600px] bg-primary/8 -top-40 -right-40" />
          <div className="orb w-[400px] h-[400px] bg-secondary-container/20 -bottom-20 -left-20" />

          <div className="max-w-[1280px] mx-auto px-lg w-full grid lg:grid-cols-2 gap-xl items-center relative z-10 py-xl">
            {/* Left: Text */}
            <div className="space-y-lg">
              <div className="space-y-sm anim-fade-in-up">
                <div className="inline-flex items-center gap-sm px-md py-2 bg-primary/10 text-primary rounded-full font-bold text-[13px] border border-primary/20">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
                  Hackathon Simkopdes 2026 &nbsp;·&nbsp; Tim Xensushi
                </div>
                <h1 className="text-4xl md:text-5xl xl:text-6xl text-on-surface leading-[1.1] font-extrabold tracking-tight">
                  Revolusi Digital{" "}
                  <span className="relative">
                    <span className="text-primary">Koperasi Desa</span>
                    <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                      <path d="M4 8 Q150 2 296 8" stroke="#2e591f" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                    </svg>
                  </span>{" "}
                  Berbasis{" "}
                  <span className="bg-gradient-to-r from-primary to-tertiary-container bg-clip-text text-transparent">
                    AI
                  </span>
                </h1>
              </div>

              <p className="anim-fade-in-up text-lg md:text-xl text-on-surface-variant max-w-[576px] leading-relaxed font-medium" style={{ animationDelay: "0.15s", opacity: 0, animationFillMode: "forwards" }}>
                Platform AI terpadu yang mengubah data transaksi & pasar menjadi kecerdasan bisnis nyata — prediksi demand, segmentasi anggota, laporan keuangan, hingga distribusi SHU, otomatis dalam satu ekosistem.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-md anim-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0, animationFillMode: "forwards" }}>
                <Link
                  href="/dashboard/demand"
                  className="group flex items-center gap-sm px-lg py-4 bg-primary text-white rounded-2xl font-extrabold text-[15px] hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 active:translate-y-0"
                >
                  <span>Mulai Eksplorasi AI</span>
                  <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
                <a
                  href="#features"
                  className="flex items-center gap-sm px-lg py-4 border-2 border-primary/20 text-primary rounded-2xl font-bold text-[15px] hover:bg-primary/5 hover:border-primary/40 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">play_circle</span>
                  Lihat Fitur
                </a>
              </div>

              {/* Pillar mini badges */}
              <div className="flex flex-wrap gap-sm pt-sm anim-fade-in-up" style={{ animationDelay: "0.45s", opacity: 0, animationFillMode: "forwards" }}>
                {pillars.map((p) => (
                  <div key={p.title} className="flex items-center gap-xs px-3 py-1.5 bg-surface-container-low rounded-full text-[12px] font-semibold text-on-surface-variant border border-outline-variant/30 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all cursor-default">
                    <span className="material-symbols-outlined text-[14px] text-primary">{p.icon}</span>
                    {p.title}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Visual Card */}
            <div className="relative hidden lg:block anim-slide-left">
              {/* Main Dashboard Preview Card */}
              <div className="relative w-full rounded-[2rem] overflow-hidden shadow-[0_32px_80px_-12px_rgba(46,89,31,0.25)] border border-outline-variant/20 bg-surface-container-lowest">
                {/* Fake dashboard UI */}
                <div className="p-sm bg-surface-container border-b border-outline-variant/20 flex items-center gap-xs">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-error/60" />
                    <span className="w-3 h-3 rounded-full bg-secondary-container/80" />
                    <span className="w-3 h-3 rounded-full bg-primary/60" />
                  </div>
                  <div className="flex-1 mx-sm bg-surface-container-low h-5 rounded-lg px-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-[12px] text-on-surface-variant">lock</span>
                    <span className="text-[11px] text-on-surface-variant font-mono">kreasi-ai.simkopdes.id/dashboard</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-surface to-surface-container-low p-md space-y-md">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">AI Demand Intelligence</p>
                      <p className="text-lg font-extrabold text-primary">Prediksi Demand Aktif</p>
                    </div>
                    <div className="flex items-center gap-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </div>
                  </div>

                  {/* Mini Chart bars */}
                  <div className="flex items-end gap-1 h-24">
                    {[65, 80, 55, 90, 70, 85, 95, 75, 88, 60, 92, 78].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm"
                        style={{
                          height: `${h}%`,
                          background: i % 3 === 0
                            ? "rgba(46,89,31,0.85)"
                            : i % 3 === 1
                            ? "rgba(46,89,31,0.35)"
                            : "rgba(251,188,0,0.5)",
                          animation: `barGrow 0.8s ${i * 0.05}s cubic-bezier(0.16,1,0.3,1) forwards`,
                          transform: "scaleY(0)",
                          transformOrigin: "bottom",
                        }}
                      />
                    ))}
                  </div>

                  {/* Stat rows */}
                  <div className="grid grid-cols-3 gap-sm">
                    {[
                      { label: "Total RFQ", value: "142", icon: "receipt_long", color: "text-primary" },
                      { label: "Disetujui", value: "89%", icon: "check_circle", color: "text-emerald-600" },
                      { label: "Komoditas", value: "28", icon: "inventory", color: "text-amber-600" },
                    ].map((s) => (
                      <div key={s.label} className="bg-surface-container rounded-xl p-sm text-center">
                        <span className={`material-symbols-outlined text-[20px] ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        <p className="font-extrabold text-on-surface text-sm">{s.value}</p>
                        <p className="text-[10px] text-on-surface-variant font-medium">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini table rows */}
                  <div className="space-y-1.5">
                    {[
                      { item: "Beras Premium 5kg", cat: "Sembako", vol: "+320 unit", trend: "up" },
                      { item: "Minyak Goreng", cat: "Sembako", vol: "+180 unit", trend: "up" },
                      { item: "Pupuk Urea", cat: "Pertanian", vol: "+90 unit", trend: "stable" },
                    ].map((row) => (
                      <div key={row.item} className="flex items-center justify-between px-sm py-1.5 bg-surface-container rounded-lg text-[11px]">
                        <div>
                          <p className="font-semibold text-on-surface">{row.item}</p>
                          <p className="text-on-surface-variant">{row.cat}</p>
                        </div>
                        <div className="flex items-center gap-xs">
                          <span className={`font-bold ${row.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}>{row.vol}</span>
                          <span className="material-symbols-outlined text-[14px] text-emerald-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {row.trend === "up" ? "trending_up" : "trending_flat"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating AI insight card */}
              <div className="absolute -bottom-6 -left-10 glass-ai p-md rounded-2xl shadow-2xl w-64 floating-delay border border-primary/15">
                <div className="flex items-center gap-sm mb-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      insights
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">AI Insight</p>
                    <p className="text-base font-extrabold text-primary">+24% Efisiensi</p>
                  </div>
                </div>
                <div className="h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[75%] rounded-full" />
                </div>
                <p className="mt-xs text-[10px] text-on-surface-variant italic">Berdasarkan analisis 3 bulan terakhir</p>
              </div>

              {/* Floating SHU card */}
              <div className="absolute -top-4 -right-8 glass-ai p-sm rounded-2xl shadow-xl w-52 floating border border-secondary-container/50">
                <div className="flex items-center gap-xs mb-xs">
                  <span className="material-symbols-outlined text-secondary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">SHU Bulan Ini</p>
                </div>
                <p className="text-xl font-extrabold text-secondary">Rp 42,3 Juta</p>
                <div className="flex items-center gap-xs mt-xs">
                  <span className="material-symbols-outlined text-[12px] text-emerald-600">arrow_upward</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">+8.4% dari bulan lalu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-on-surface-variant animate-bounce">
            <span className="text-[11px] font-semibold uppercase tracking-widest">Scroll</span>
            <span className="material-symbols-outlined text-[20px]">keyboard_arrow_down</span>
          </div>
        </section>

        {/* ===== STATS SECTION ===== */}
        <section id="stats" className="py-xl bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(190,241,165,0.15),_transparent)]" />
          <div className="max-w-[1280px] mx-auto px-lg relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="reveal text-center space-y-sm p-md rounded-2xl hover:bg-white/5 transition-colors"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-sm">
                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                  </div>
                  <p className="text-3xl md:text-4xl font-extrabold text-white">
                    <AnimatedCounter target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="text-[13px] font-semibold text-white/70 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURES SECTION ===== */}
        <section id="features" className="py-2xl bg-gradient-to-b from-surface-container-low/30 to-surface">
          <div className="max-w-[1280px] mx-auto px-lg">
            <div className="text-center mb-2xl space-y-md reveal">
              <div className="inline-flex items-center gap-sm px-md py-2 bg-primary/10 text-primary rounded-full font-bold text-[13px] border border-primary/20 mb-md">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                5 Pilar Transformasi KREASI
              </div>
              <h2 className="text-3xl md:text-4xl xl:text-5xl text-on-surface font-extrabold tracking-tight">
                Ekosistem AI untuk{" "}
                <span className="text-primary">Koperasi Desa Modern</span>
              </h2>
              <p className="text-base text-on-surface-variant max-w-[576px] mx-auto font-medium leading-relaxed" style={{ textWrap: 'balance' } as React.CSSProperties}>
                Lima modul AI — prediksi permintaan, profil anggota, manajemen stok, laporan SAK-EP, hingga distribusi SHU — dalam satu platform terintegrasi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
              {features.map((f, i) => (
                <Link
                  key={f.key}
                  href={f.href}
                  className={`${f.colSpan} group reveal bg-gradient-to-br ${f.gradient} rounded-3xl p-lg border border-outline-variant/20 hover:shadow-2xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 flex flex-col justify-between relative overflow-hidden`}
                  style={{ transitionDelay: `${i * 0.08}s` }}
                >
                  {/* Top */}
                  <div className="space-y-md relative z-10">
                    <div className="flex items-start justify-between">
                      <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                      </div>
                      <span className={`text-[11px] font-bold ${f.badgeColor} px-3 py-1 rounded-full border border-current/20`}>
                        {f.badge}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">{f.subtitle}</p>
                      <h3 className="text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors duration-200">
                        {f.title}
                      </h3>
                    </div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">{f.description}</p>
                  </div>

                  {/* Tags + arrow */}
                  <div className="mt-md flex items-center justify-between relative z-10">
                    <div className="flex flex-wrap gap-xs">
                      {f.tags.map((t) => (
                        <span key={t} className="text-[10px] font-semibold bg-white/60 text-on-surface-variant px-2 py-0.5 rounded-full border border-outline-variant/20">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 ml-sm">
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                  </div>

                  {/* Decorative background icon */}
                  <div className="absolute -bottom-4 -right-4 opacity-[0.04] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500 pointer-events-none">
                    <span className="material-symbols-outlined text-[160px]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== HOW IT WORKS SECTION ===== */}
        <section className="py-2xl bg-surface-container-low/40">
          <div className="max-w-[1280px] mx-auto px-lg">
            <div className="text-center mb-2xl reveal">
              <h2 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                Cara Kerja KREASI
              </h2>
              <p className="text-on-surface-variant mt-md max-w-[480px] mx-auto text-center text-sm leading-relaxed" style={{ textWrap: 'balance' } as React.CSSProperties}>
                Tiga langkah sederhana menuju koperasi yang lebih cerdas dan transparan.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-gutter relative">
              {/* connector line */}
              <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-outline-variant/50 to-transparent" />
              {[
                {
                  step: "01",
                  icon: "database",
                  title: "Kumpul Data",
                  desc: "Data transaksi, berita lokal, dan Google Trends dikumpulkan secara otomatis setiap hari.",
                  color: "bg-emerald-500",
                },
                {
                  step: "02",
                  icon: "psychology",
                  title: "Analisis AI",
                  desc: "Model AI menganalisis pola, memprediksi demand, dan membuat rekomendasi taktis.",
                  color: "bg-primary",
                },
                {
                  step: "03",
                  icon: "auto_awesome",
                  title: "Aksi & Laporan",
                  desc: "Generate RFQ, cetak laporan SAK-EP, blast SHU ke anggota — semua dalam satu klik.",
                  color: "bg-secondary",
                },
              ].map((s, i) => (
                <div key={i} className="reveal flex flex-col items-center text-center gap-md" style={{ transitionDelay: `${i * 0.15}s` }}>
                  <div className="relative">
                    <div className={`w-16 h-16 ${s.color} rounded-2xl flex items-center justify-center shadow-lg shadow-black/10`}>
                      <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-surface rounded-full border-2 border-outline-variant/30 flex items-center justify-center text-[11px] font-black text-primary">
                      {s.step}
                    </div>
                  </div>
                  <div className="space-y-sm">
                    <h3 className="text-lg font-extrabold text-on-surface">{s.title}</h3>
                    <p className="text-on-surface-variant text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== CONNECTIVITY SECTION ===== */}
        <section id="connectivity" className="py-2xl bg-gradient-to-br from-surface to-surface-container-low/20">
          <div className="max-w-[1280px] mx-auto px-lg">
            <div className="flex flex-col lg:flex-row items-center gap-2xl">
              <div className="lg:w-1/2 space-y-lg reveal-left">
                <div className="inline-flex items-center gap-sm px-md py-2 bg-primary/10 text-primary rounded-full font-bold text-[13px] border border-primary/20">
                  <span className="material-symbols-outlined text-[18px]">hub</span>
                  Interkoneksi Antar Desa
                </div>
                <h2 className="text-3xl md:text-4xl text-on-surface font-extrabold tracking-tight leading-tight">
                  Satu Platform,{" "}
                  <span className="text-primary">Ribuan Koperasi</span>{" "}
                  Terhubung
                </h2>
                <p className="text-lg text-on-surface-variant leading-relaxed">
                  KREASI bukan hanya digitalisasi satu koperasi. Kami membangun jaringan intelijen kolektif antar desa untuk memperkuat daya tawar komunitas di pasar yang lebih luas.
                </p>
                <div className="grid sm:grid-cols-2 gap-md">
                  {[
                    { icon: "sync_alt", title: "Data Terpadu", desc: "Satu ekosistem untuk semua kebutuhan administrasi koperasi desa." },
                    { icon: "storefront", title: "Akses Pasar Desa", desc: "Produk unggulan lokal terhubung ke rantai pasok regional via AI." },
                    { icon: "security", title: "Keamanan Data", desc: "Enkripsi end-to-end dan audit trail untuk kepercayaan pengguna." },
                    { icon: "support_agent", title: "Dukungan Penuh", desc: "Tim pendukung siap membantu setiap koperasi desa bertransisi." },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-sm p-md rounded-2xl bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container hover:border-primary/20 hover:-translate-y-0.5 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">{item.title}</p>
                        <p className="text-on-surface-variant text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:w-1/2 w-full relative reveal-right">
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-outline-variant/20">
                  {/* Network visualization */}
                  <div className="bg-gradient-to-br from-primary to-tertiary-container aspect-[4/3] flex items-center justify-center p-xl relative">
                    {/* Central hub */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl pulse-glow">
                          <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>hub</span>
                        </div>
                        {/* Orbit nodes — positions pre-computed to avoid hydration mismatch */}
                        {([
                          { top: "50%",    left: "95%"  },
                          { top: "88.97%", left: "72.5%"},
                          { top: "88.97%", left: "27.5%"},
                          { top: "50%",    left: "5%"  },
                          { top: "11.03%", left: "27.5%"},
                          { top: "11.03%", left: "72.5%"},
                        ] as const).map((pos, i) => (
                          <div
                            key={i}
                            className="absolute w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20"
                            style={{
                              top: pos.top,
                              left: pos.left,
                              transform: "translate(-50%,-50%)",
                            }}
                          >
                            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                              {["store", "agriculture", "payments", "groups", "inventory", "analytics"][i]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative z-10 text-white text-center space-y-sm mt-24">
                      <h3 className="text-xl font-bold">Jaringan Koperasi Desa</h3>
                      <p className="text-sm opacity-80">Terkoneksi, cerdas, dan berdaya</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CALL TO ACTION SECTION ===== */}
        <section className="py-2xl bg-gradient-to-br from-primary via-primary to-tertiary-container relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="orb w-[500px] h-[500px] bg-white/5 -top-40 -right-20" />
            <div className="orb w-[300px] h-[300px] bg-secondary-container/10 bottom-0 left-20" />
          </div>
          <div className="max-w-[1280px] mx-auto px-lg relative z-10 text-center space-y-lg reveal">
            <div className="inline-flex items-center gap-sm px-md py-2 bg-white/15 text-white rounded-full font-bold text-[13px] border border-white/20 backdrop-blur-sm mb-sm">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              Mulai Perjalanan Digital Anda
            </div>
            <h2 className="text-3xl md:text-4xl xl:text-5xl font-extrabold text-white tracking-tight max-w-3xl mx-auto leading-tight">
              Siap Membangun Koperasi Desa yang Lebih Cerdas?
            </h2>
            <p className="text-base text-white/80 max-w-[448px] mx-auto leading-relaxed" style={{ textWrap: 'balance' } as React.CSSProperties}>
              Wujudkan koperasi desa yang transparan dan efisien — laporan SAK-EP otomatis, SHU adil, stok tepat, semuanya dengan kecerdasan AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-md pt-sm">
              <Link
                href="/dashboard/demand"
                className="group flex items-center gap-sm px-xl py-4 bg-white text-primary rounded-2xl font-extrabold text-[15px] hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300"
              >
                <span>Buka Dashboard Portal AI</span>
                <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </Link>
              <a
                href="#features"
                className="flex items-center gap-sm px-xl py-4 border-2 border-white/30 text-white rounded-2xl font-bold text-[15px] hover:bg-white/10 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">info</span>
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant/40 py-xl">
        <div className="max-w-[1280px] mx-auto px-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-xl text-left mb-xl">
            <div className="col-span-2 space-y-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
                </div>
                <span className="font-extrabold text-xl text-primary tracking-tight">KREASI</span>
              </div>
              <p className="text-xs text-on-surface-variant max-w-[220px] leading-snug">
                <strong>KREASI</strong> — Platform AI terpadu untuk koperasi desa, dikembangkan oleh <strong className="text-primary">Tim Xensushi</strong> · Hackathon Simkopdes 2026.
              </p>
              <div className="flex gap-sm">
                {["Simkopdes 2026", "Kemenkop UKM", "AI Innovation"].map((tag) => (
                  <span key={tag} className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full border border-outline-variant/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider mb-md">Fitur Utama</h4>
              <ul className="space-y-sm text-sm text-on-surface-variant font-medium">
                {[
                  { href: "/dashboard/demand", label: "AI Demand Intelligence" },
                  { href: "/dashboard/rfm", label: "Segmentasi RFM" },
                  { href: "/dashboard/bundle", label: "Smart Bundle & Stok" },
                  { href: "/dashboard/finance", label: "Arus SAK-EP" },
                  { href: "/dashboard/shu", label: "Distribusi SHU" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-primary transition-colors flex items-center gap-xs">
                      <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-sm uppercase tracking-wider mb-md">Informasi</h4>
              <ul className="space-y-sm text-sm text-on-surface-variant font-medium">
                <li className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px] text-primary">group</span>
                  <span><strong className="text-on-surface">Tim Xensushi</strong></span>
                </li>
                <li>Kementerian Koperasi &amp; UKM</li>
                <li>Simkopdes Hackathon 2026</li>
                <li className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[14px]">mail</span>
                  info@kreasi-simkopdes.id
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-outline-variant/20 pt-lg text-center text-xs text-on-surface-variant font-medium">
            &copy; {new Date().getFullYear()} KREASI &nbsp;·&nbsp; Dikembangkan oleh <strong className="text-primary">Tim Xensushi</strong> &nbsp;·&nbsp; Hackathon Simkopdes 2026
          </div>
        </div>
      </footer>
      <RfqAssistant />
    </div>
  );
}
