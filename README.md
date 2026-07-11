# 🌾 KREASI Simkopdes: Koperasi Desa Redesigned Ecosystem with Adaptive System & Intelligence

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-blue?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.100+-green?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-cyan?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.0-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**KREASI Simkopdes** adalah platform ekosistem digital terintegrasi untuk modernisasi Koperasi Desa (Kopdes) di Indonesia. Dengan memanfaatkan **Artificial Intelligence (AI)** dan **Closed-Loop Data Cycle** berbasis log transaksi konsumen, KREASI mendisrupsi tata kelola konvensional guna menghadirkan transparansi finansial real-time dan efisiensi rantai pasok komoditas desa.

Platform ini dikembangkan khusus untuk **Hackathon Simkopdes 2026** sebagai solusi atas rendahnya transparansi finansial, lambatnya pembagian SHU (Sisa Hasil Usaha), inefisiensi stok komoditas, dan minimnya mitigasi risiko pembiayaan mikro tanpa jaminan di tingkat pedesaan.

---

## 🚀 Fitur Unggulan

### 1. 🧠 AI Demand Intelligence (`/dashboard/demand`)
Modul intelijen yang mengekstrak dan menyatukan sinyal kebutuhan komoditas desa baik dari sumber internal maupun eksternal:
*   **Ingestion Data Tidak Terstruktur:** Menggunakan LLM (DeepSeek) untuk mengekstrak pesan teks informal (seperti obrolan WhatsApp) atau rekaman suara (voice note) dari anggota/pengurus menjadi format RFQ (*Request For Quotation*) formal secara otomatis.
*   **Multi-Model Statistical Forecasting:** Melakukan prediksi demand harian hingga 14 hari ke depan berdasarkan data transaksi historis menggunakan berbagai model statistik: `Moving Average (MA)`, `Exponential Smoothing (ETS)`, `Prophet-Style`, dan `SBA` (untuk *intermittent demand*).
*   **External Market Signals:** Mengintegrasikan tren eksternal dari **Google Trends** dan **Google News/Search** untuk mendeteksi potensi lonjakan kebutuhan atau risiko kelangkaan komoditas di wilayah regional.
*   **Stock-Aware Procurement Recommendation:** Membandingkan hasil forecast dengan data level stok real-time (Safety Stock, Reorder Point) untuk memberikan aksi taktis otomatis (seperti *Increase Procurement*, *Schedule Reorder*, *Maintain Stock*).

### 2. 👥 Behavioral Segmentation & RFM Engine (`/dashboard/rfm`)
Analisis perilaku belanja anggota untuk personalisasi strategi koperasi:
*   **9 Segmen Perilaku Anggota:** Mengelompokkan anggota secara otomatis berdasarkan algoritma **RFM (Recency, Frequency, Monetary)** (seperti *Champions*, *Loyal*, *At-Risk*, *Hibernating*, dll.).
*   **Generative AI Hyper-Personalization:** Menganalisis profil segmen untuk menghasilkan 5 Pilar Rekomendasi Taktis: **Marketing** (penjualan), **Product** (kecocokan barang), **Pricing** (optimasi profit), **Credit** (kelayakan pembiayaan), dan **Relationship** (retensi).
*   **Churn & CLV Prediction:** Memproyeksikan probabilitas anggota untuk berhenti belanja (*churn*) dan memprediksi nilai jangka panjang anggota (*Customer Lifetime Value*) menggunakan bantuan analisis LLM.

### 3. 📦 Smart Predictive Bundle & Planogram (`/dashboard/bundle`)
Optimasi visual tata letak toko dan strategi pemasaran dinamis:
*   **Interactive Planogram Designer:** Fitur drag-and-drop penempatan produk pada rak toko retail koperasi berdasarkan **Association Rule Mining (Market Basket Analysis)** (skor *Support*, *Lift*, dan *Confidence*) serta mematuhi aturan distribusi berat (barang berat di rak bawah).
*   **Smart Bundling Recommendation:** Merekomendasikan paket produk hemat personal yang menguntungkan koperasi sekaligus ramah di kantong anggota dengan memantau batas harga regulasi (HET).
*   **Dynamic Commodity Pricing:** Memantau tren harga komoditas regional dari berbagai publisher tepercaya untuk menjaga margin koperasi tetap sehat dan harga tetap kompetitif bagi masyarakat desa.

### 4. 📊 Automated Financial Flow SAK-EP (`/dashboard/finance`)
Transparansi keuangan tingkat korporasi yang siap audit:
*   **Buku Besar Otomatis (Double-Entry Ledger):** Menyusun pencatatan jurnal akuntansi otomatis langsung dari data log transaksi harian.
*   **Kepatuhan Standar SAK-EP:** Laporan posisi keuangan dan arus kas yang mematuhi standar akuntansi resmi untuk Entitas Privat (SAK-EP).
*   **AI Financial Health Insights:** Memberikan ringkasan otomatis mengenai rasio likuiditas, kepatuhan audit, dan rekomendasi alokasi kelebihan kas.
*   **PDF Export:** Mendukung pengunduhan laporan keuangan siap pakai dalam format PDF yang rapi.

### 5. 💸 Automatic SHU Distribution (`/dashboard/shu`)
Keadilan dan keterbukaan pembagian hasil usaha:
*   **Waterfall Flow Visualization:** Diagram visual interaktif yang menggambarkan pengurangan laba bruto oleh biaya operasional, gaji, pajak, dan dana cadangan untuk menghasilkan SHU Bersih secara transparan.
*   **Proportional Allocation:** Pembagian otomatis SHU Bersih menjadi **Jasa Modal (30%)**, **Jasa Anggota (50%)**, **Dana Pendidikan (10%)**, dan **Cadangan Koperasi (10%)** secara instan.
*   **WhatsApp Blast Integration:** Sistem pengiriman draf pesan WhatsApp rincian SHU secara personal atau massal kepada anggota sebagai notifikasi instan.

### 6. 💳 AI Micro-Credit Risk Scoring
*   Mengubah data historis loyalitas belanja anggota di toko koperasi menjadi indikator skor kredit (*credit score*) objektif guna memitigasi risiko penyaluran kredit mikro tanpa jaminan fisik (*collateral-free credit*).

---

## 📁 Struktur Direktori Proyek

```text
├── docs/                   # Dokumen perancangan, alur logika, dan ringkasan eksekutif
├── public/                 # Aset publik, favicon, dan gambar statis
├── src/
│   ├── app/                # Next.js App Router Pages & API Routes
│   │   ├── api/            # API Adapter & Mock Proxy ke FastAPI Backend
│   │   ├── login/          # Modul autentikasi masuk sistem
│   │   ├── dashboard/      # Seluruh modul dashboard KREASI (Demand, RFM, Bundle, Finance, SHU)
│   │   └── page.tsx        # Landing Page Interaktif KREASI
│   ├── components/         # Komponen UI modular
│   │   ├── bundle/         # Komponen khusus optimasi bundling & Planogram Designer
│   │   ├── dashboard/      # Layout dashboard shell & sidebar navigation
│   │   ├── landing/        # Komponen interaktif halaman landing (seperti RFQ Assistant)
│   │   └── ui/             # Komponen UI primitif (Tooltip, dll.)
│   ├── hooks/              # Custom React Hooks
│   └── lib/                # Utility & helper function (seperti backend API fetcher)
```

---

## 🛠️ Tech Stack & Arsitektur

### Frontend (Next.js Application)
*   **Framework:** Next.js 16 (App Router)
*   **Runtime:** React 19 (Client & Server Components)
*   **Styling:** Tailwind CSS v4 & Custom CSS (Vanilla CSS untuk Glassmorphism & Mikro-animasi)
*   **Animations:** Motion (Framer Motion)
*   **Interactions:** `@dnd-kit/core` & `@dnd-kit/utilities` (untuk interaksi drag-and-drop Planogram)
*   **UI Components:** Radix UI Tooltip

### Backend (FastAPI Services)
*   **Framework:** FastAPI (Python)
*   **AI Engine:** DeepSeek API / OpenAI Client (ekstraksi RFQ & summary narasi LLM)
*   **Data Analysis:** Pandas, NumPy, Scikit-learn
*   **Database:** SQLite / PostgreSQL (SQLAlchemy ORM)

### Arsitektur Alur Data
```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUMBER SIGNAL DEMAND                          │
│     (WhatsApp Webhook, Voice Signals, Google Trends, Berita Lokal)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Data Tidak Terstruktur)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND FASTAPI                              │
│  ├─ AI Signal Extractor (DeepSeek/LLM) -> RFQ Requests                   │
│  ├─ Forecasting Engine (MA, ETS, Prophet-style, SBA)                    │
│  ├─ Market Basket Analysis (Association Rules)                          │
│  └─ SHU Calculator & RFM Engine                                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (JSON REST API /api/v1)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS API ADAPTER                            │
│  └─ src/app/api/demand, finance, shu, rfm, bundle                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Data Teragregasi & Terenrich)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND DASHBOARD                           │
│  └─ src/app/dashboard/demand, finance, shu, rfm, bundle                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Panduan Instalasi & Pengoperasian Lokal

### 1. Prasyarat
*   Node.js (>= v20.9.0)
*   Python (>= v3.10) - *untuk menjalankan repository backend*

### 2. Kloning & Instalasi Frontend
```bash
# Clone repository frontend
git clone https://github.com/ahmadzeinabidmuhabbab/kreasi-simkopdes.git
cd kreasi-simkopdes

# Install dependency
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilai `KREASI_BACKEND_URL` dengan alamat URL dari backend FastAPI yang sedang berjalan (default: `http://127.0.0.1:8000`).

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📦 Deployment ke Produksi

Sistem ini dirancang untuk dijalankan sebagai aplikasi produksi Next.js. Sangat tidak disarankan menggunakan perintah `npm run dev` pada server produksi.

### Vercel
1.  Import repository `ahmadzeinabidmuhabbab/kreasi-simkopdes`.
2.  Biarkan **Root Directory** pada root repository (`./`).
3.  Biarkan **Framework Preset** sebagai `Next.js`.
4.  Gunakan perintah install `npm ci` dan build `npm run build`.
5.  Tambahkan env `KREASI_BACKEND_URL` yang mengarah ke endpoint FastAPI backend publik Anda.

### Netlify
Aplikasi sudah dilengkapi dengan file [`netlify.toml`](file:///d:/Abid/Ngoding/Hackathon%20Simkopdes%202026/kreasi-simkopdes/netlify.toml) untuk konfigurasi build dan publish.
1.  Import repositori ke Netlify.
2.  Tambahkan env `KREASI_BACKEND_URL` pada panel konfigurasi Netlify.

### Self-Hosted (Node.js Server)
Jalankan perintah berikut pada server produksi Anda:
```bash
npm ci
npm run build
npm run start
```

---

## 🔗 Tautan Terkait
*   **Repository Backend FastAPI:** [Backend-Simkopdes](https://github.com/Gapinnn/Backend-Simkopdes)
*   **Website Demo KREASI:** [kreasi.zeinabid.site](https://kreasi.zeinabid.site)
