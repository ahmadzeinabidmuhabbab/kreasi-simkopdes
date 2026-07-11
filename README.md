# 🌾 KREASI: Koperasi Desa Redesigned Ecosystem with Adaptive System & Intelligence

🚀 **AI-powered cooperative intelligence platform** yang dikembangkan oleh **Tim Xensushi** untuk **Hackathon Simkopdes 2026**.

KREASI adalah *intelligence layer* di atas fondasi data koperasi yang tidak menggantikan Simkopdes, melainkan melengkapinya untuk mengeliminasi keputusan reaktif dalam empat *blind spot* utama: **Customer**, **Demand**, **Inventory**, dan **Market**.

---

## 👥 Tim Xensushi
*   **Ahmad Zein Abid Muhabbab** — Leader / Business Analyst
*   **Gavin Atha Wisesa** — Member / Software Engineer
*   **Rohmad Ali Fatur Rizki** — Member / AI/ML Engineer

---

## 🎯 12 Fitur Utama (Solusi KREASI)

KREASI membagi solusinya ke dalam 4 bidang utama untuk menyelesaikan *blind spot* koperasi:

### I. Customer
*   **01. Customer Segmentation with RFM Analysis**
    Mengelompokkan anggota koperasi ke dalam 10 segmen *recency*, *frequency*, dan *monetary* untuk mengetahui anggota paling aktif, loyal, bernilai tinggi, mulai pasif, hingga *lost customer*.
*   **02. Segment-Based Business Recommendation**
    Memberikan rekomendasi *marketing*, *product*, *pricing*, *credit*, dan *relationship* untuk tiap segmen agar keputusan layanan anggota tidak lagi seragam.
*   **03. Churn Prediction**
    Memprediksi anggota yang berisiko tidak kembali bertransaksi, sehingga koperasi dapat melakukan retensi dan *win-back* secara lebih tepat sasaran.
*   **04. Customer Lifetime Value Prediction**
    Mengukur potensi nilai masa depan anggota agar koperasi dapat memprioritaskan *upsell*, *loyalty program*, benefit premium, dan *relationship management*.

### II. Demand
*   **05. AI Demand Intelligence**
    Mentransformasi data Google Trends, Google News (Search), data WhatsApp bot, serta *forecasting* data transaksi historis dan stok untuk mendapatkan kebutuhan barang dan volume secara lebih proaktif dalam menunjang *Request for Quotation* (RFQ).
*   **06. Demand Trend Analysis and Summary**
    Menyajikan ringkasan tren permintaan berdasarkan hasil *forecasting* serta indikator pendukung seperti fluktuasi harga pasar dan sentimen berita, sehingga memudahkan pengurus koperasi dalam mengambil keputusan operasional.

### III. Inventory
*   **07. Stock Status Monitoring**
    Memantau kondisi stok dan mengelompokkan produk ke dalam status Aman, Perhatian, atau Kritis agar risiko kehabisan maupun kelebihan stok barang dapat diantisipasi lebih awal berdasarkan data stok aktual dan *demand velocity*.
*   **08. Restock Recommendation**
    Memberikan rekomendasi jumlah *restock* setiap barang berdasarkan kondisi stok aktual, stok minimal, dan proyeksi permintaan agar ketersediaan produk tetap terjaga.

### IV. Market
*   **09. Market Basket Analysis**
    Menganalisis pola pembelian pelanggan untuk mengidentifikasi produk yang sering dibeli bersama dalam satu transaksi menggunakan *association rules* yang menghasilkan aturan produk berbasis *confidence*, *lift*, *support*, dan *support count*.
*   **10. Smart Bundling Recommendation**
    Membuat paket produk berbasis *Market Basket Analysis* yang sudah dilengkapi harga normal, harga bundle, diskon, dan estimasi margin profit, serta mengoptimalkan produk pelengkap yang paling relevan untuk ditawarkan bersama produk utama.
*   **11. Dynamic Pricing**
    Menggabungkan data harga, stok, permintaan, serta harga pasar yang dipantau secara berkala menggunakan metode *scraping* untuk menghasilkan rekomendasi harga jual yang kompetitif dan tetap menguntungkan.
*   **12. Planogram Recommendation**
    Menghasilkan rekomendasi penataan produk berdasarkan pola pembelian pelanggan dan prinsip planogram (*space allocation*, *grouping*, dan *visual consistency*) sehingga tata letak rak menjadi lebih efektif, konsisten, dan mendukung peningkatan penjualan.

---

## 🛠️ Tech Stack & Arsitektur

KREASI dirancang di atas 4 layer arsitektur dengan menggunakan teknologi modern:

### Arsitektur Layer
*   **Presentation Layer:** Dashboard Pengelola, KPI Monitoring, Alert & Recommendation.
*   **Decision & Control:** Prioritas customer, Restock recommendation, Dynamic pricing & smart bundling, RFQ.
*   **Intelligence Layer:** Customer Intelligence (RFM, CLV, Churn), Market Basket Analysis, Forecasting, Demand extraction, Recommendation & Summary.
*   **Data Layer:** POS dan transaksi, Anggota, Inventori, WhatsApp bot, Google Trend & Google News.

### Tech Stack
*   **Frontend:** NextJS, Tailwind CSS
*   **Backend:** FastAPI
*   **AI/LLM:** Deepseek, OpenAI
*   **Database:** PostgreSQL
*   **Infrastruktur & API:** CloudFlare, SerpAPI

### Prinsip Platform
1.  **Modular:** Komponen dapat diaktifkan bertahap sesuai kebutuhan koperasi.
2.  **Interoperable:** Mudah diintegrasikan dengan sistem dan kanal yang sudah berjalan.
3.  **Secure:** Akses dan proses dapat dikendalikan sesuai peran operasional.
4.  **Scalable:** Dapat dimulai dari MVP lalu diperluas untuk lintas koperasi dan *use case* lainnya.

---

## 📈 Impact Metrics
Proyeksi dampak bisnis dan sosial sepanjang 12 bulan pertama implementasi KREASI:
*   📉 **-40% Waktu Pengambilan Keputusan** (Restock & pricing tanpa menunggu rekap manual).
*   📉 **-35% Risiko Stockout** (Prediksi permintaan berbasis data transaksi aktual).
*   📈 **+18% Margin Penjualan** (Dynamic pricing & smart bundling produk).
*   📈 **+25% Akses Kredit Baru** (Credit scoring mempercepat persetujuan pinjaman).
*   📉 **-20% Churn Anggota** (Retensi & win-back berbasis prediksi churn).
*   🎯 **85% Akurasi Forecasting Demand** (Validasi model pada pilot Fase 1–2).

---

## 🗺️ Roadmap 12 Bulan
*   **Fase 1: Foundation (Bulan 1-3):** Integrasi langsung data Simkopdes, deploy 3 modul inti (Customer Segmentation RFM, Stock Status Monitoring, Market Basket Analysis).
*   **Fase 2: Intelligence Layer (Bulan 4-6):** Aktivasi modul prediktif (Churn Prediction, CLV, Restock Recommendation), integrasi AI Demand Intelligence (Google Trends, Google News, WhatsApp bot).
*   **Fase 3: Market Optimization (Bulan 7-9):** Rilis Dynamic Pricing, Smart Bundling, Planogram Recommendation, kolaborasi RFQ bersama, integrasi kredit berbasis credit scoring.
*   **Fase 4: Ecosystem Scale (Bulan 10-12+):** Open API Kemenkop, Dashboard agregat nasional, White-label KREASI.

---

## ⚙️ Panduan Instalasi & Pengoperasian Lokal

### 1. Kloning & Instalasi Frontend
```bash
# Clone repository frontend
git clone https://github.com/ahmadzeinabidmuhabbab/kreasi-simkopdes.git
cd kreasi-simkopdes

# Install dependency
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Sesuaikan nilai `KREASI_BACKEND_URL` dengan alamat URL dari backend FastAPI yang sedang berjalan (default: `http://127.0.0.1:8000`).

### 3. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🔗 Tautan Penting
*   **Demo Kreasi:** [s.bps.go.id/kreasi-demo](https://s.bps.go.id/kreasi-demo)
*   **MVP Kreasi:** [s.bps.go.id/kreasi-web](https://s.bps.go.id/kreasi-web)
*   **Repository Backend FastAPI:** [Backend-Simkopdes](https://github.com/Gapinnn/Backend-Simkopdes)
