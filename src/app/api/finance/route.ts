import { NextResponse } from "next/server";

const financialMetrics = {
  totalRevenue: 1285400000,
  totalExpense: 420150000,
  netDifference: 865250000
};

const revenueVsExpense = [
  { month: "Jan", revenue: 95000000, expense: 35000000 },
  { month: "Feb", revenue: 105000000, expense: 38000000 },
  { month: "Mar", revenue: 120000000, expense: 42000000 },
  { month: "Apr", revenue: 140000000, expense: 39000000 },
  { month: "Mei", revenue: 135000000, expense: 41000000 },
  { month: "Jun", revenue: 155000000, expense: 45000000 }
];

const categoryExpenses = [
  { category: "Operasional Toko", amount: 150000000, percentage: 35.7 },
  { category: "Gaji & Pegawai", amount: 120000000, percentage: 28.6 },
  { category: "Logistik & Transport", amount: 75000000, percentage: 17.8 },
  { category: "Pajak & Administrasi", amount: 45000000, percentage: 10.7 },
  { category: "Lain-lain", amount: 30150000, percentage: 7.2 }
];

const sakEpLedger = [
  { code: "1-1000", name: "Kas & Setara Kas", category: "Aset Lancar", debit: 850250000, credit: 0, balance: 850250000 },
  { code: "1-1200", name: "Persediaan Komoditas", category: "Aset Lancar", debit: 320000000, credit: 0, balance: 320000000 },
  { code: "1-1300", name: "Piutang Anggota (Mikro)", category: "Aset Lancar", debit: 115150000, credit: 0, balance: 115150000 },
  { code: "2-1000", name: "Utang Dagang Penyuplai", category: "Kewajiban Lancar", debit: 0, credit: 120000000, balance: 120000000 },
  { code: "3-1000", name: "Simpanan Pokok Anggota", category: "Ekuitas", debit: 0, credit: 150000000, balance: 150000000 },
  { code: "3-1100", name: "Simpanan Wajib & Sukarela", category: "Ekuitas", debit: 0, credit: 480250000, balance: 480250000 },
  { code: "4-1000", name: "Pendapatan Usaha Toko", category: "Pendapatan", debit: 0, credit: 1285400000, balance: 1285400000 },
  { code: "5-1000", name: "Beban Operasional & Gaji", category: "Beban", debit: 420150000, credit: 0, balance: 420150000 }
];

const aiInsights = [
  { type: "STANDARD", title: "Kepatuhan SAK-EP", desc: "Pencatatan arus kas dan penyusunan buku besar memenuhi standar SAK-EP 100% secara sistematis." },
  { type: "SECURITY", title: "Rasio Likuiditas", desc: "Kas yang tersedia (Rp 850.2M) sangat mencukupi untuk memenuhi kewajiban jangka pendek utang dagang (Rp 120M)." },
  { type: "HELP", title: "Rekomendasi Alokasi", desc: "Kelebihan kas dapat dialokasikan sebesar 15% untuk ekspansi inventaris komoditas pertanian bersubsidi." }
];

export async function GET() {
  return NextResponse.json({
    success: true,
    metrics: financialMetrics,
    chartData: revenueVsExpense,
    categories: categoryExpenses,
    ledger: sakEpLedger,
    insights: aiInsights
  });
}
