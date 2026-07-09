import { NextResponse } from "next/server";

// ── In-memory transactions store ───────────────────────────────────────────
const transactions = [
  { id: "TRX-2026-001", date: "2026-07-01", time: "08:15", memberId: "KOP-00121", memberName: "Ahmad Subarjo",     items: [{ name: "Beras Premium 5kg", qty: 3, unit: "Karung", price: 85000 }],  category: "Sembako",    total: 255000,  paymentMethod: "Tunai",      status: "SELESAI" },
  { id: "TRX-2026-002", date: "2026-07-01", time: "09:30", memberId: "KOP-00244", memberName: "Siti Rahmawati",    items: [{ name: "Minyak Goreng 2L", qty: 5, unit: "Botol", price: 28000 }, { name: "Gula Pasir 1kg", qty: 3, unit: "Kg", price: 15500 }],  category: "Sembako",    total: 186500, paymentMethod: "Transfer",   status: "SELESAI" },
  { id: "TRX-2026-003", date: "2026-07-02", time: "10:00", memberId: "KOP-00089", memberName: "Budi Santoso",      items: [{ name: "Pupuk Urea Subsidi", qty: 2, unit: "Sak", price: 130000 }], category: "Pertanian",  total: 260000,  paymentMethod: "Kredit Anggota", status: "SELESAI" },
  { id: "TRX-2026-004", date: "2026-07-02", time: "11:45", memberId: "KOP-00187", memberName: "Dewi Lestari",      items: [{ name: "Gas LPG 3kg", qty: 2, unit: "Tabung", price: 21000 }],    category: "Energi",     total: 42000,   paymentMethod: "Tunai",      status: "SELESAI" },
  { id: "TRX-2026-005", date: "2026-07-03", time: "07:55", memberId: "KOP-00302", memberName: "Hendra Wijaya",     items: [{ name: "Semen Gresik 50kg", qty: 10, unit: "Sak", price: 65000 }], category: "Bangunan",   total: 650000,  paymentMethod: "Transfer",   status: "SELESAI" },
  { id: "TRX-2026-006", date: "2026-07-03", time: "13:20", memberId: "KOP-00045", memberName: "Lani Mulyani",      items: [{ name: "Mie Instan Soto Ayam", qty: 20, unit: "Pcs", price: 3500 }, { name: "Teh Celup 50s", qty: 2, unit: "Kotak", price: 12500 }], category: "Sembako", total: 95000, paymentMethod: "Tunai", status: "SELESAI" },
  { id: "TRX-2026-007", date: "2026-07-04", time: "08:30", memberId: "KOP-00158", memberName: "Prasetyo",          items: [{ name: "Beras Premium 5kg", qty: 5, unit: "Karung", price: 85000 }, { name: "Minyak Goreng 2L", qty: 3, unit: "Botol", price: 28000 }], category: "Sembako", total: 509000, paymentMethod: "Kredit Anggota", status: "SELESAI" },
  { id: "TRX-2026-008", date: "2026-07-04", time: "14:10", memberId: "KOP-00077", memberName: "Endah Kurniasih",   items: [{ name: "Pestisida Organik 500ml", qty: 3, unit: "Botol", price: 45000 }], category: "Pertanian", total: 135000, paymentMethod: "Tunai", status: "SELESAI" },
  { id: "TRX-2026-009", date: "2026-07-05", time: "09:00", memberId: "KOP-00213", memberName: "Sarwono",           items: [{ name: "Pupuk Phonska 50kg", qty: 1, unit: "Sak", price: 165000 }], category: "Pertanian", total: 165000, paymentMethod: "Transfer", status: "DIPROSES" },
  { id: "TRX-2026-010", date: "2026-07-05", time: "10:30", memberId: "KOP-00330", memberName: "Wati Suryani",      items: [{ name: "Gula Pasir 1kg", qty: 10, unit: "Kg", price: 15500 }, { name: "Kopi Bubuk 200g", qty: 5, unit: "Sachet", price: 22000 }], category: "Sembako", total: 265000, paymentMethod: "Tunai", status: "SELESAI" },
  { id: "TRX-2026-011", date: "2026-07-06", time: "11:00", memberId: "KOP-00062", memberName: "Ngatirah",          items: [{ name: "Gas LPG 3kg", qty: 3, unit: "Tabung", price: 21000 }], category: "Energi", total: 63000, paymentMethod: "Tunai", status: "SELESAI" },
  { id: "TRX-2026-012", date: "2026-07-06", time: "15:30", memberId: "KOP-00099", memberName: "Karno Wiyoto",      items: [{ name: "Semen Gresik 50kg", qty: 5, unit: "Sak", price: 65000 }, { name: "Paku Kayu Campur 1kg", qty: 2, unit: "Kg", price: 18000 }], category: "Bangunan", total: 361000, paymentMethod: "Kredit Anggota", status: "SELESAI" },
  { id: "TRX-2026-013", date: "2026-07-07", time: "08:00", memberId: "KOP-00121", memberName: "Ahmad Subarjo",     items: [{ name: "Minyak Goreng 2L", qty: 6, unit: "Botol", price: 28000 }], category: "Sembako", total: 168000, paymentMethod: "Tunai", status: "SELESAI" },
  { id: "TRX-2026-014", date: "2026-07-07", time: "12:45", memberId: "KOP-00244", memberName: "Siti Rahmawati",    items: [{ name: "Beras Premium 5kg", qty: 2, unit: "Karung", price: 85000 }], category: "Sembako", total: 170000, paymentMethod: "Transfer", status: "MENUNGGU" },
  { id: "TRX-2026-015", date: "2026-07-08", time: "09:15", memberId: "KOP-00187", memberName: "Dewi Lestari",      items: [{ name: "Pupuk Urea Subsidi", qty: 4, unit: "Sak", price: 130000 }, { name: "Pestisida Organik 500ml", qty: 2, unit: "Botol", price: 45000 }], category: "Pertanian", total: 610000, paymentMethod: "Kredit Anggota", status: "SELESAI" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("startDate");
  const endDate   = searchParams.get("endDate");
  const category  = searchParams.get("category");
  const status    = searchParams.get("status");

  let filtered = [...transactions];
  if (startDate) filtered = filtered.filter(t => t.date >= startDate);
  if (endDate)   filtered = filtered.filter(t => t.date <= endDate);
  if (category && category !== "SEMUA") filtered = filtered.filter(t => t.category === category);
  if (status   && status   !== "SEMUA") filtered = filtered.filter(t => t.status === status);

  const totalValue   = filtered.reduce((a, t) => a + t.total, 0);
  const avgValue     = filtered.length ? Math.round(totalValue / filtered.length) : 0;
  const categories   = [...new Set(transactions.map(t => t.category))];

  return NextResponse.json({
    success: true,
    transactions: filtered.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)),
    summary: {
      total: filtered.length,
      totalValue,
      avgValue,
      byStatus: {
        SELESAI:   filtered.filter(t => t.status === "SELESAI").length,
        DIPROSES:  filtered.filter(t => t.status === "DIPROSES").length,
        MENUNGGU:  filtered.filter(t => t.status === "MENUNGGU").length,
      },
    },
    categories,
  });
}
