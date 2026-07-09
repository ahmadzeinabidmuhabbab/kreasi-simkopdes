"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // If already logged in, redirect
    const session = localStorage.getItem("kreasi_session");
    if (session) router.replace("/dashboard/demand");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("kreasi_session", JSON.stringify(data.user));
        router.push("/dashboard/demand");
      } else {
        setError(data.message || "Login gagal");
      }
    } catch {
      setError("Koneksi gagal, coba lagi");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7ec] via-background to-[#fef9ec] flex items-center justify-center p-md relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/5 -top-32 -right-32 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-secondary-container/10 -bottom-20 -left-20 pointer-events-none" />

      <div className="w-full max-w-sm relative">
        {/* Brand header */}
        <div className="text-center mb-xl">
          <Link href="/" className="inline-flex flex-col items-center gap-sm group">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 group-hover:shadow-primary/30 group-hover:scale-105 transition-all">
              <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>agriculture</span>
            </div>
            <div>
              <p className="font-extrabold text-3xl text-primary tracking-tight">KREASI</p>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Platform AI Koperasi Desa</p>
            </div>
          </Link>
        </div>

        {/* Login card */}
        <div className="bg-surface-container-lowest rounded-3xl shadow-2xl shadow-black/5 border border-outline-variant/20 p-xl">
          <div className="mb-lg">
            <h1 className="text-xl font-extrabold text-on-surface">Masuk ke Portal</h1>
            <p className="text-sm text-on-surface-variant mt-xs">Gunakan akun yang telah diberikan admin</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-md">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-sm p-sm bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-700">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-xs">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Username</label>
              <div className="flex items-center gap-sm px-md py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">person</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-xs">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Password</label>
              <div className="flex items-center gap-sm px-md py-3 bg-surface-container border border-outline-variant/30 rounded-xl focus-within:border-primary focus-within:bg-surface-container-lowest transition-all">
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">lock</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-sm font-semibold text-on-surface outline-none placeholder:text-on-surface-variant/40"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-primary transition-colors">
                  {showPassword ? "visibility_off" : "visibility"}
                </button>
              </div>
            </div>

            {/* Demo accounts hint */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl p-sm space-y-xs">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Akun Demo</p>
              {[
                { role: "Super Admin", username: "admin", password: "admin123" },
                { role: "Operator", username: "op1", password: "op1pass" },
                { role: "Viewer", username: "rw", password: "rwpass" },
              ].map(a => (
                <button
                  key={a.username}
                  type="button"
                  onClick={() => { setUsername(a.username); setPassword(a.password); }}
                  className="w-full flex items-center justify-between px-sm py-1.5 rounded-lg hover:bg-primary/10 transition-colors group"
                >
                  <span className="text-[11px] font-semibold text-on-surface-variant group-hover:text-primary transition-colors">{a.role}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant/70">@{a.username}</span>
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-sm py-3.5 bg-primary text-white rounded-xl font-extrabold text-sm hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">autorenew</span>
                  Masuk...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                  Masuk ke Portal
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-on-surface-variant mt-lg font-medium">
          © 2026 KREASI · <strong className="text-primary">Tim Xensushi</strong> · Hackathon Simkopdes 2026
        </p>
      </div>
    </div>
  );
}
