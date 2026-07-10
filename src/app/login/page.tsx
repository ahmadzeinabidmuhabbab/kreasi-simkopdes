"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const demoAccounts = [
  { role: "Super Admin", username: "admin", password: "admin123" },
  { role: "Operator", username: "op1", password: "op1pass" },
  { role: "Viewer", username: "rw", password: "rwpass" },
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

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("kreasi_session");
    if (session) router.replace("/dashboard/demand");
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem("kreasi_session", JSON.stringify(data.user));
        router.push("/dashboard/demand");
      } else {
        setError(data.message || "Login gagal. Periksa kredensial Anda.");
      }
    } catch {
      setError("Koneksi gagal. Coba lagi dalam beberapa saat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-surface-container-low text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-[1080px] flex-col px-md py-md lg:grid lg:grid-cols-[0.9fr_1fr] lg:items-center lg:gap-xl lg:px-lg">
        <header className="mb-lg flex h-12 items-center justify-between lg:absolute lg:left-lg lg:top-lg lg:mb-0">
          <Link
            href="/"
            className="flex items-center gap-sm rounded-lg p-1 transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-on-primary">
              <MaterialIcon filled className="text-[21px]">
                agriculture
              </MaterialIcon>
            </span>
            <span>
              <span className="block text-base font-extrabold leading-none text-primary">KREASI</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Operations Console
              </span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex min-h-10 items-center rounded-lg border border-outline-variant/35 bg-surface-container-lowest px-3 text-xs font-bold text-on-surface-variant hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            Landing
          </Link>
        </header>

        <section className="hidden lg:block">
          <div className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-lg shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Secure access</p>
            <h1 className="mt-sm text-3xl font-extrabold leading-tight tracking-tight text-on-surface">
              Console kerja untuk operasional koperasi.
            </h1>
            <p className="mt-sm max-w-[360px] text-sm leading-relaxed text-on-surface-variant">
              Masuk untuk memantau demand, stok, transaksi, laporan SAK-EP, dan distribusi SHU dari dashboard yang sama.
            </p>

            <div className="mt-lg grid grid-cols-3 gap-sm">
              {[
                { label: "Modules", value: "8", icon: "widgets" },
                { label: "Status", value: "Live", icon: "monitoring" },
                { label: "Access", value: "RBAC", icon: "shield" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-outline-variant/25 bg-surface-container-low p-sm">
                  <MaterialIcon className="text-[20px] text-primary">{item.icon}</MaterialIcon>
                  <p className="mt-sm text-lg font-extrabold text-on-surface">{item.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-[420px] flex-1 items-center lg:max-w-none lg:justify-end">
          <div className="w-full max-w-[400px] rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-md shadow-sm md:p-lg">
            <div className="mb-md flex items-start justify-between gap-md">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Login</p>
                <h2 className="mt-xs text-2xl font-extrabold tracking-tight text-on-surface">Masuk ke Portal</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Gunakan akun yang diberikan admin.</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MaterialIcon filled className="text-[22px]">
                  lock
                </MaterialIcon>
              </span>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-sm">
              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-sm rounded-lg border border-error/25 bg-error-container/55 p-sm text-sm font-semibold text-on-error-container"
                >
                  <MaterialIcon filled className="mt-0.5 text-[18px]">
                    error
                  </MaterialIcon>
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="flex flex-col gap-xs">
                <label htmlFor="username" className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Username
                </label>
                <div className="flex min-h-11 items-center gap-sm rounded-lg border border-outline-variant/35 bg-surface-container px-sm transition-colors focus-within:border-primary focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/10">
                  <MaterialIcon className="text-[19px] text-on-surface-variant">person</MaterialIcon>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    className="min-h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Password
                </label>
                <div className="flex min-h-11 items-center gap-sm rounded-lg border border-outline-variant/35 bg-surface-container px-sm transition-colors focus-within:border-primary focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/10">
                  <MaterialIcon className="text-[19px] text-on-surface-variant">lock</MaterialIcon>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="min-h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/45"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((show) => !show)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="flex size-9 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-high hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    <MaterialIcon className="text-[19px]">{showPassword ? "visibility_off" : "visibility"}</MaterialIcon>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-xs flex min-h-11 w-full items-center justify-center gap-sm rounded-lg bg-primary px-md py-2.5 text-sm font-extrabold text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <MaterialIcon className="animate-spin text-[19px]">autorenew</MaterialIcon>
                    Masuk...
                  </>
                ) : (
                  <>
                    <MaterialIcon filled className="text-[19px]">
                      login
                    </MaterialIcon>
                    Masuk
                  </>
                )}
              </button>
            </form>

            <div className="mt-md rounded-lg border border-outline-variant/30 bg-surface-container-low p-sm">
              <div className="mb-xs flex items-center justify-between gap-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Demo account</p>
                <span className="text-[10px] font-bold text-primary">Click to fill</span>
              </div>
              <div className="grid gap-xs">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => {
                      setUsername(account.username);
                      setPassword(account.password);
                      setError("");
                    }}
                    className="flex min-h-10 items-center justify-between gap-sm rounded-md px-sm text-left hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-extrabold text-on-surface">{account.role}</span>
                      <span className="block truncate font-mono text-[11px] text-on-surface-variant">@{account.username}</span>
                    </span>
                    <span className="rounded-md border border-outline-variant/25 bg-surface-container-lowest px-2 py-1 text-[10px] font-bold text-on-surface-variant">
                      demo
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
