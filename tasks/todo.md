# Tooltip Data RFM

Status: selesai. Build dan lint file yang diubah lulus; lint global tetap memiliki dua error baseline pada halaman Finance dan SHU yang tidak terkait perubahan ini.

## Task 1: Primitive tooltip
**Acceptance criteria:** primitive shadcn tersedia dan mendukung hover serta keyboard focus.
**Verification:** lint dan build berhasil.
**Dependencies:** None.
**Files likely touched:** `src/components/ui/tooltip.tsx`, `package.json`.
**Estimated scope:** S.

## Task 2: Integrasi seluruh metrik RFM
**Acceptance criteria:** semua label Target, RFM, Avg, Churn, CLV, Prioritas, Avg Churn, High CLV, Avg CLV, KPI ringkasan, serta R/F/M score menampilkan penjelasan kontekstual.
**Verification:** inspeksi UI pada `/dashboard/rfm` dengan hover dan keyboard.
**Dependencies:** Task 1.
**Files likely touched:** `src/app/dashboard/rfm/page.tsx`.
**Estimated scope:** S.

## Task 3: Quality gate
**Acceptance criteria:** tidak ada error lint/build dan tooltip tidak terpotong atau merusak layout responsif.
**Verification:** `npm run lint`, `npm run build`, pemeriksaan browser.
**Dependencies:** Tasks 1-2.
**Estimated scope:** S.
