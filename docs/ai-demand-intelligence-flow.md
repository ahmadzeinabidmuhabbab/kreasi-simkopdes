# Alur Logika Fitur AI Demand Intelligence

Dokumen ini menjelaskan alur backend dan frontend yang berkaitan dengan route:

`http://localhost:3000/dashboard/demand`

Fokus fitur: **AI Demand Intelligence**, yaitu modul yang mengubah sinyal kebutuhan barang dari RFQ, transaksi historis, stok, Google Trends, dan berita/search menjadi insight operasional untuk koperasi.

---

## 1. Gambaran Besar Fitur

AI Demand Intelligence di aplikasi ini memiliki 3 fungsi utama:

1. **History RFQ**
   Menampilkan daftar permintaan pengadaan barang yang sudah berhasil diekstrak dari input tidak terstruktur seperti WhatsApp, direct text, atau voice.

2. **Forecasting**
   Membuat prediksi kebutuhan barang berdasarkan data transaksi historis, lalu menggabungkannya dengan posisi stok untuk menghasilkan rekomendasi restock.

3. **Analisis Trend**
   Membaca sinyal eksternal dari Google Trends dan Google Search/news untuk melihat apakah suatu komoditas sedang naik, turun, berisiko, atau perlu dipantau.

Secara sederhana:

```text
Input tidak terstruktur + data transaksi + stok + tren eksternal
        |
        v
Backend FastAPI memproses, menormalisasi, menghitung skor, dan membuat insight
        |
        v
Next.js API route /api/demand menyatukan data untuk UI
        |
        v
Halaman /dashboard/demand menampilkan summary, RFQ, forecasting, dan trend
```

---

## 2. File Utama yang Terlibat

### Frontend Next.js

- `src/app/dashboard/demand/page.tsx`
  Halaman utama AI Demand Intelligence.

- `src/app/api/demand/route.ts`
  API adapter/proxy di Next.js yang dipanggil frontend. File ini mengambil data dari backend FastAPI.

- `src/app/dashboard/layout.tsx`
  Layout dashboard dan navigasi sidebar, termasuk menu **AI Demand Intelligence**.

### Backend FastAPI

Backend berada di folder sibling:

- `backend-kreasi-simkopdes/app/api/v1/endpoints/cni.py`
  Endpoint untuk ingestion sinyal demand dan RFQ.

- `backend-kreasi-simkopdes/app/services/rfq_service.py`
  Logic utama ekstraksi, penyimpanan, deduplikasi, scoring, dan detail RFQ.

- `backend-kreasi-simkopdes/app/services/deepseek_client.py`
  Extractor AI/LLM untuk mengubah teks bebas menjadi struktur RFQ.

- `backend-kreasi-simkopdes/app/api/v1/endpoints/forecasting.py`
  Endpoint forecasting demand.

- `backend-kreasi-simkopdes/app/services/forecasting/runner.py`
  Logic forecasting multi-metode, stock context, dan rekomendasi.

- `backend-kreasi-simkopdes/app/api/v1/endpoints/external_demand.py`
  Endpoint external demand dari Google Trends dan Google Search/news.

- `backend-kreasi-simkopdes/app/services/external_demand/runner.py`
  Orkestrasi pengambilan data tren eksternal.

- `backend-kreasi-simkopdes/app/services/external_demand/scoring.py`
  Perhitungan skor trend, skor berita, dan external demand score.

- `backend-kreasi-simkopdes/app/services/external_demand/summary_service.py`
  Membuat summary LLM untuk kartu analisis trend.

---

## 3. Alur Frontend Route `/dashboard/demand`

Saat user membuka:

`http://localhost:3000/dashboard/demand`

komponen React di `src/app/dashboard/demand/page.tsx` melakukan proses berikut:

1. State awal dibuat:
   - `summary`
   - `topProducts`
   - `rfqHistory`
   - `forecast`
   - `trend`
   - `loading`
   - `generating`
   - `activeTab`
   - `selectedRfq`

2. Saat halaman pertama kali dimuat, `useEffect` menjalankan `fetchData()`.

3. `fetchData()` memanggil:

```ts
fetch("/api/demand", { cache: "no-store" })
```

4. Response dari `/api/demand` dipakai untuk mengisi:
   - ringkasan total RFQ,
   - produk paling banyak RFQ,
   - tabel history RFQ,
   - data forecasting,
   - data analisis trend.

5. UI kemudian menampilkan:
   - kartu summary di bagian atas,
   - chart mini produk paling banyak RFQ,
   - tab **History RFQ**,
   - tab **Forecasting**,
   - tab **Analisis Trend**.

---

## 4. Alur API Adapter Next.js `/api/demand`

File:

`src/app/api/demand/route.ts`

berperan sebagai penghubung antara frontend Next.js dan backend FastAPI.

Base URL backend ditentukan dari:

```ts
process.env.KREASI_BACKEND_URL
process.env.NEXT_PUBLIC_API_BASE_URL
fallback: "http://127.0.0.1:8000"
```

Semua request backend diarahkan ke:

```text
{BACKEND_URL}/api/v1/...
```

### GET `/api/demand`

Jika tidak ada `rfqId`, endpoint ini menjalankan 3 request backend secara paralel:

```text
GET /api/v1/cni/rfq
GET /api/v1/cni/forecast/dashboard-context
GET /api/v1/cni/external-demand/llm-summaries/latest
```

Lalu data digabung menjadi payload frontend:

```text
summary
topProducts
rfqHistory
forecast
trend
```

### GET `/api/demand?rfqId=...`

Jika ada `rfqId`, endpoint mengambil detail RFQ:

```text
GET /api/v1/cni/rfq/{rfqId}
```

Hasilnya dipakai frontend untuk membuka drawer detail RFQ.

### POST `/api/demand`

Frontend mengirim:

```json
{
  "action": "generateForecast"
}
```

Next.js API lalu meneruskan ke backend:

```text
POST /api/v1/cni/forecast/runs
```

Dengan body:

```json
{
  "granularity": "daily",
  "horizon": 14,
  "methods": ["MA_3", "MA_5", "MA_7", "ETS", "PROPHET_STYLE", "SBA"],
  "persist": true
}
```

Artinya sistem menjalankan prediksi harian untuk 14 hari ke depan, memakai beberapa metode forecasting, lalu menyimpan hasilnya.

---

## 5. Alur Backend RFQ: Dari Teks Bebas Menjadi RFQ

RFQ berasal dari endpoint backend di:

`backend-kreasi-simkopdes/app/api/v1/endpoints/cni.py`

Sumber input yang didukung:

- WhatsApp webhook: `POST /api/v1/cni/webhooks/whatsapp`
- Mock WhatsApp text: `POST /api/v1/cni/mock/whatsapp-text`
- Direct text: `POST /api/v1/cni/direct/text`
- Direct voice: `POST /api/v1/cni/direct/voice`

Alurnya:

```text
WhatsApp / text / voice
        |
        v
ParsedSignal
        |
        v
RFQService.process_signals()
        |
        v
LLM / mock extractor mengekstrak field RFQ
        |
        v
Validasi + confidence scoring + duplicate check
        |
        v
Simpan ke tabel demand_signals dan rfq_requests
```

### Field yang Diekstrak AI

Extractor mengubah teks bebas menjadi field terstruktur:

- `is_procurement_request`
- `kopdes_name`
- `kopdes_id`
- `item_produk`
- `kategori`
- `spesifikasi`
- `jumlah`
- `satuan`
- `target_harga`
- `mata_uang`
- `batas_akhir`
- `catatan`
- `missing_fields`
- `confidence_score`

Contoh input:

```text
Kopdes Mekar Jaya butuh pupuk urea 2 ton maksimal Rp 4.000/kg sebelum akhir bulan
```

Contoh output logis:

```json
{
  "item_produk": "Pupuk Urea",
  "jumlah": 2000,
  "satuan": "kg",
  "target_harga": 4000,
  "mata_uang": "IDR",
  "batas_akhir": "akhir bulan",
  "confidence_score": 0.9
}
```

### Logic Confidence Score RFQ

RFQ dianggap lebih kuat jika:

- produk terdeteksi,
- jumlah dan satuan lengkap,
- target harga tersedia,
- deadline tersedia,
- field yang hilang sedikit.

Jika confidence tinggi, status RFQ menjadi `open`.
Jika confidence masih perlu dicek, status menjadi `in_review`.

Di frontend, status backend dipetakan menjadi:

```text
open / in_review / closed -> DIPROSES
cancelled                 -> DITOLAK
```

---

## 6. Alur Backend Forecasting

Forecasting dipakai pada tab **Forecasting**.

Endpoint utama:

```text
POST /api/v1/cni/forecast/runs
GET  /api/v1/cni/forecast/dashboard-context
GET  /api/v1/cni/forecast/llm-context
GET  /api/v1/cni/forecast/products/{product_name}
```

Input forecasting berasal dari tabel agregat transaksi:

```text
demand_item_daily_aggregates
```

Tabel ini menyimpan demand harian per produk:

- tanggal penjualan,
- nama produk,
- jumlah transaksi,
- total quantity,
- total sales,
- rata-rata harga.

### Metode Forecasting

Saat user klik **Buat Forecast**, sistem menjalankan beberapa metode:

- `MA_3`: moving average 3 periode,
- `MA_5`: moving average 5 periode,
- `MA_7`: moving average 7 periode,
- `ETS`: exponential smoothing,
- `PROPHET_STYLE`: pendekatan additive/calendar-style,
- `SBA`: metode untuk demand intermittent atau tidak rutin.

Backend lalu memilih metode rekomendasi terbaik berdasarkan karakter data.

### Output Forecasting

Setiap produk menghasilkan:

- total prediksi demand,
- rata-rata demand,
- titik forecast per tanggal,
- trend,
- confidence,
- risk,
- recommended action,
- catatan statistik,
- multi-method series untuk chart,
- konteks stok,
- rekomendasi restock.

### Logic Stok dan Rekomendasi

Forecasting tidak hanya menghitung angka demand. Sistem juga membandingkan hasil prediksi dengan stok.

Data stok berasal dari:

```text
commodity_stock_levels
```

Field penting:

- `on_hand_quantity`
- `reserved_quantity`
- `available_quantity`
- `reorder_point`
- `safety_stock`
- `avg_daily_sales`
- `coverage_days`

Logic rekomendasi:

```text
Jika stok <= safety stock
    -> status critical
    -> rekomendasi increase_procurement

Jika stok <= reorder point
    -> status reorder
    -> rekomendasi schedule_reorder

Jika stok masih cukup
    -> status healthy
    -> rekomendasi maintain_stock
```

Di UI, rekomendasi ini muncul sebagai:

- prediksi 1 bulan,
- stok tersedia,
- cakupan stok dalam hari,
- risiko,
- insight naratif.

---

## 7. Alur Backend External Demand: Google Trends + News

Tab **Analisis Trend** mengambil sinyal eksternal dari:

```text
GET /api/v1/cni/external-demand/llm-summaries/latest
```

Jika summary LLM belum tersedia, Next.js fallback ke:

```text
GET /api/v1/cni/external-demand/summary
```

Lalu detail trend points diambil dari:

```text
GET /api/v1/cni/external-demand/commodities/{commodity_id}
```

### Pipeline External Demand

```text
Commodity catalog
        |
        v
Google Trends fetch + Google Search/news fetch
        |
        v
Hitung trend features dan news features
        |
        v
Gabungkan menjadi external demand score
        |
        v
Simpan signal, trend points, dan news mentions
        |
        v
LLM summary membuat kartu analisis trend
```

### Perhitungan Trend Score

Backend menghitung beberapa indikator dari Google Trends:

- rata-rata interest 30 hari,
- rata-rata 7 hari terakhir,
- rata-rata 7 hari sebelumnya,
- perubahan persentase,
- slope 30 hari,
- jumlah spike days.

Lalu sistem menentukan arah:

```text
change >= 15% atau slope naik kuat -> increasing
change <= -15%                    -> decreasing
lainnya                           -> stable
```

### Perhitungan News Severity Score

Dari Google Search/news, backend mencari sinyal risiko seperti:

- kelangkaan,
- stok/pasokan,
- distribusi,
- harga naik,
- sumber berita,
- recency artikel.

Skor berita lebih tinggi jika banyak artikel menyebut kelangkaan, stok, harga, dan artikelnya masih baru.

### External Demand Score

Skor gabungan dihitung dengan bobot:

```text
55% trend score + 45% news severity score
```

Kategori hasil:

```text
>= 75 -> urgent_external_signal
>= 50 -> rising_external_signal
>= 25 -> watchlist
< 25  -> normal
```

### LLM Summary untuk UI

Backend juga dapat membuat ringkasan LLM untuk kartu UI:

- `source_badge`
- `display_score`
- `headline`
- `summary_text`
- `trend_direction`
- `risk_level`
- `recommended_action`
- `confidence`
- `citations`

Instruksi LLM dibuat agar tidak menampilkan istilah teknis seperti `external demand score` kepada user, tetapi mengubahnya menjadi narasi operasional yang mudah dipahami.

---

## 8. Detail Tampilan Frontend

### Header Halaman

Menampilkan judul:

```text
AI Demand Intelligence
RFQ database, forecasting statistik, dan analisis trend eksternal DKI Jakarta.
```

Ada tombol **Refresh Data** yang memanggil ulang `/api/demand`.

### Summary Cards

Frontend menampilkan 4 metrik:

1. Total RFQ Diajukan
2. RFQ Diproses
3. Rasio Diproses
4. Total Nilai RFQ

Nilai ini dihitung di Next.js API route dari `rfqHistory`.

### Produk Paling Banyak RFQ

Next.js API membuat agregasi:

```text
group by product
sum value
count RFQ
sort by count desc, lalu value desc
ambil top 5
```

Frontend menampilkan hasilnya dalam bentuk chart bar sederhana.

### Tab History RFQ

Menampilkan tabel:

- tanggal,
- produk,
- kopdes,
- volume,
- harga satuan,
- total nilai,
- sumber,
- status,
- tombol detail.

Filter status:

- Semua,
- Diproses,
- Ditolak.

Saat tombol **Detail** diklik:

```text
GET /api/demand?rfqId={id}
```

Lalu drawer menampilkan:

- data kopdes,
- PIC,
- jumlah,
- target harga,
- sumber,
- riwayat pesan,
- spesifikasi,
- enrichment.

### Tab Forecasting

Menampilkan:

- tombol **Buat Forecast**,
- insight utama dari forecast terbaik,
- rekomendasi restock,
- card per produk,
- mini line chart multi-metode,
- prediksi 1 bulan,
- stok,
- cakupan stok,
- risiko,
- ringkasan naratif.

Saat tombol **Buat Forecast** diklik:

```text
Frontend POST /api/demand
Next.js POST /api/v1/cni/forecast/runs
Backend menjalankan forecast dan persist hasil
Frontend refresh data
Frontend pindah ke tab Forecasting
```

### Tab Analisis Trend

Menampilkan maksimal 20 komoditas.

Setiap card berisi:

- badge sumber,
- region,
- nama komoditas,
- sparkline 30 hari,
- headline,
- summary,
- pertumbuhan,
- tingkat risiko,
- rekomendasi,
- sumber berita jika ada.

Jika tidak ada summary:

```text
Summary trend belum tersedia.
Jalankan fetch external demand dan LLM summary di backend.
```

---

## 9. Data Store yang Dipakai

### RFQ

- `demand_signals`
  Menyimpan input mentah dari WhatsApp/text/voice.

- `rfq_requests`
  Menyimpan hasil ekstraksi RFQ terstruktur.

- `rfq_enrichments`
  Menyimpan enrichment tambahan untuk RFQ.

### Forecasting

- `demand_item_daily_aggregates`
  Input utama forecasting dari transaksi harian.

- `demand_forecast_runs`
  Metadata proses forecast.

- `demand_forecast_points`
  Titik prediksi per produk, metode, dan tanggal.

- `demand_forecast_summaries`
  Ringkasan forecast per produk untuk dashboard dan LLM context.

- `commodity_stock_levels`
  Snapshot stok untuk rekomendasi restock.

### External Demand

- `external_demand_runs`
  Metadata proses fetch Google Trends/news.

- `external_commodity_signals`
  Skor gabungan per komoditas.

- `google_trend_points`
  Data interest-over-time dari Google Trends.

- `news_mentions`
  Artikel atau hasil pencarian terkait komoditas.

- `llm_demand_summary_runs`
  Metadata proses summary LLM.

- `llm_demand_summary_items`
  Kartu summary siap tampil di UI.

---

## 10. Ringkasan Alur End-to-End

```text
User membuka /dashboard/demand
        |
        v
Frontend menjalankan fetchData()
        |
        v
GET /api/demand
        |
        v
Next.js mengambil RFQ, forecast, dan trend dari FastAPI
        |
        v
Data dipetakan ke format UI
        |
        v
Frontend menampilkan summary, top product, history, forecast, trend
```

Jika user klik **Buat Forecast**:

```text
User klik Buat Forecast
        |
        v
POST /api/demand { action: "generateForecast" }
        |
        v
POST /api/v1/cni/forecast/runs
        |
        v
Backend menjalankan MA, ETS, Prophet-style, SBA
        |
        v
Hasil forecast disimpan
        |
        v
Frontend refresh data dan menampilkan insight terbaru
```

Jika user klik detail RFQ:

```text
User klik Detail
        |
        v
GET /api/demand?rfqId=...
        |
        v
GET /api/v1/cni/rfq/{rfqId}
        |
        v
Drawer menampilkan detail RFQ dan riwayat pesan
```

---

## 11. Inti Logika AI yang Berjalan

AI Demand Intelligence bukan hanya satu model AI, tetapi gabungan beberapa lapisan analisis:

1. **AI extraction**
   Mengubah teks bebas dari WhatsApp/text/voice menjadi RFQ terstruktur.

2. **Statistical forecasting**
   Menggunakan data historis transaksi untuk memprediksi kebutuhan barang.

3. **Stock-aware recommendation**
   Membandingkan prediksi demand dengan stok tersedia, safety stock, dan reorder point.

4. **External signal scoring**
   Menggabungkan Google Trends dan berita/search untuk membaca sinyal pasar eksternal.

5. **LLM summarization**
   Mengubah angka dan sinyal teknis menjadi narasi operasional yang mudah dipahami pengurus koperasi.

Output akhirnya adalah rekomendasi praktis seperti:

- tambah pengadaan,
- jadwalkan restock,
- pertahankan stok,
- monitor ketat,
- review manual,
- siapkan RFQ.

---

## 12. Kesimpulan Sederhana

Fitur **AI Demand Intelligence** bekerja sebagai pusat analisis kebutuhan barang koperasi.

Dari sisi backend, sistem:

- menerima sinyal kebutuhan,
- mengekstrak RFQ,
- membaca data transaksi,
- menghitung prediksi demand,
- mengecek stok,
- membaca trend eksternal,
- membuat rekomendasi.

Dari sisi frontend, sistem:

- mengambil semua data lewat `/api/demand`,
- menampilkan ringkasan cepat,
- menyediakan tabel RFQ,
- menyediakan tombol generate forecast,
- menampilkan grafik prediksi,
- menampilkan kartu analisis trend.

Dengan alur ini, koperasi tidak hanya melihat data masa lalu, tetapi juga mendapatkan sinyal awal untuk memutuskan barang apa yang perlu dipantau, dibeli, atau segera dibuatkan RFQ.
