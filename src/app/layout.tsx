import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KREASI - Platform AI Koperasi Desa | Tim Xensushi",
  description: "KREASI (Koperasi Desa Redesigned Ecosystem with Adaptive System & Intelligence) — platform AI terpadu untuk koperasi desa oleh Tim Xensushi. Prediksi demand, segmentasi RFM, laporan SAK-EP, dan distribusi SHU otomatis.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth">
      <head>
        {/* Material Symbols has no next/font package equivalent. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.className} min-h-screen bg-background text-on-surface antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
