# Implementation Plan: Tooltip Data RFM

## Overview
Menambahkan tooltip shadcn yang aksesibel dan konsisten pada seluruh label metrik utama halaman RFM tanpa mengubah kontrak API, perhitungan backend, atau struktur database.

## Architecture Decisions
- Gunakan primitive Radix Tooltip mengikuti pola shadcn, dibungkus sebagai komponen UI reusable.
- Sentralisasikan penjelasan istilah RFM dalam satu pemetaan agar copy konsisten dan mudah dirawat.
- Jadikan label sebagai trigger keyboard-focusable dengan ikon bantuan visual; nilai dan layout kartu tetap tidak berubah.

## Task List

### Phase 1: Foundation
- [x] Task 1: Tambahkan primitive tooltip shadcn dan dependency Radix Tooltip.
- [x] Task 2: Tambahkan kamus penjelasan metrik serta wrapper label tooltip.

### Checkpoint: Foundation
- [x] TypeScript mengenali komponen dan seluruh properti tooltip.

### Phase 2: Core Feature
- [x] Task 3: Terapkan tooltip pada KPI, metric pill/floating metric, dan kartu prioritas.
- [x] Task 4: Terapkan tooltip pada Recency, Frequency, dan Monetary score bar.

### Phase 3: Verification
- [x] Task 5: Jalankan lint dan build.
- [x] Task 6: Verifikasi seluruh trigger dan tampilan halaman `/dashboard/rfm` melalui browser.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Tooltip terpotong oleh container | Medium | Radix Tooltip memakai portal ke `body`. |
| Trigger mengubah layout label | Low | Gunakan inline-flex dan ikon berukuran tetap. |
| Istilah ambigu | Medium | Copy menjelaskan definisi, unit, dan arah interpretasi skor. |

## Open Questions
- Tidak ada; cakupan target dapat diturunkan dari label yang disebutkan dan dua gambar referensi.
