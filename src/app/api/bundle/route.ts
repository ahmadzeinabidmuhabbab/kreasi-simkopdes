import { NextResponse } from "next/server";

const currentInventory = [
  { id: 1, name: "Pupuk Urea Subsidi", unit: "Sak", stock: 12, minStock: 80, reorderPoint: 50, velocity: 85, restock: 150, status: "Kritis", category: "Pertanian" },
  { id: 2, name: "Beras Cianjur 5kg", unit: "Karung", stock: 45, minStock: 100, reorderPoint: 60, velocity: 120, restock: 100, status: "Normal", category: "Sembako" },
  { id: 3, name: "Minyak Goreng Kita 1L", unit: "Pcs", stock: 8, minStock: 100, reorderPoint: 50, velocity: 190, restock: 250, status: "Kritis", category: "Sembako" },
  { id: 4, name: "Semen Gresik 50kg", unit: "Sak", stock: 80, minStock: 40, reorderPoint: 30, velocity: 65, restock: 0, status: "Aman", category: "Bahan Bangunan" },
  { id: 5, name: "Gula Pasir Lokal 1kg", unit: "Pcs", stock: 15, minStock: 60, reorderPoint: 40, velocity: 95, restock: 80, status: "Perhatian", category: "Sembako" },
  { id: 6, name: "Gas LPG 3kg", unit: "Tabung", stock: 5, minStock: 200, reorderPoint: 80, velocity: 210, restock: 300, status: "Kritis", category: "Energi" },
  { id: 7, name: "Pestisida Organik 500ml", unit: "Botol", stock: 28, minStock: 30, reorderPoint: 20, velocity: 35, restock: 0, status: "Perhatian", category: "Pertanian" },
  { id: 8, name: "Mie Instan Soto Ayam", unit: "Kardus", stock: 60, minStock: 40, reorderPoint: 25, velocity: 150, restock: 0, status: "Aman", category: "Makanan" },
];

// 6×3 shelf layout — row A/B/C, col 1/2/3
const shelfLayout = [
  // Row A — pintu masuk (traffic tinggi)
  { cell: "A1", item: "Minyak Goreng Kita 1L", traffic: "HOT", visits: 380, placement: "Eye-level", tip: "Simpan di depan — item terlaris" },
  { cell: "A2", item: "Gula Pasir Lokal 1kg", traffic: "HOT", visits: 310, placement: "Eye-level", tip: "Pasangkan dengan Minyak Goreng" },
  { cell: "A3", item: "Beras Cianjur 5kg", traffic: "HOT", visits: 295, placement: "Bottom", tip: "Letakkan di bawah karena berat" },
  // Row B — tengah toko
  { cell: "B1", item: "Mie Instan Soto Ayam", traffic: "HOT", visits: 280, placement: "Eye-level", tip: "Margin baik, tempatkan strategis" },
  { cell: "B2", item: "Teh Celup Lokal", traffic: "WARM", visits: 190, placement: "Eye-level", tip: "Cross-sell dengan Gula Pasir" },
  { cell: "B3", item: "Gas LPG 3kg", traffic: "HOT", visits: 260, placement: "Floor", tip: "Di area terpisah khusus LPG" },
  // Row C — area belakang (barang slow-moving)
  { cell: "C1", item: "Semen Gresik 50kg", traffic: "COLD", visits: 85, placement: "Floor", tip: "Pindah ke gudang — berat & bulky" },
  { cell: "C2", item: "Pupuk Urea Subsidi", traffic: "WARM", visits: 145, placement: "Bulk", tip: "Dekat kasir musim tanam" },
  { cell: "C3", item: "Pestisida Organik 500ml", traffic: "COLD", visits: 70, placement: "Top-shelf", tip: "Pindah dekat pupuk urea" },
];

const basketAnalysis = [
  { itemA: "Minyak Goreng 1L", itemB: "Gula Pasir 1kg", confidence: 85, support: 12, lift: 3.2 },
  { itemA: "Pupuk Urea Subsidi", itemB: "Pestisida Organik 500ml", confidence: 92, support: 8, lift: 4.1 },
  { itemA: "Beras Cianjur 5kg", itemB: "Minyak Goreng 1L", confidence: 78, support: 15, lift: 2.8 },
  { itemA: "Semen Gresik 50kg", itemB: "Paku Kayu Campur 1kg", confidence: 64, support: 5, lift: 2.1 },
  { itemA: "Mie Instan", itemB: "Teh Celup Lokal", confidence: 71, support: 9, lift: 2.5 },
];

const smartBundles = [
  {
    id: 1,
    name: "Paket Sembako Berkah",
    items: ["Beras Cianjur 5kg", "Minyak Goreng Kita 1L", "Gula Pasir 1kg"],
    normalPrice: 112_000,
    bundlePrice: 99_000,
    discount: 11,
    sold: 87,
    stock: 50,
    impact: "Mendorong perputaran minyak goreng yang menipis stoknya",
    badge: "Terlaris",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    id: 2,
    name: "Paket Tani Makmur",
    items: ["Pupuk Urea Subsidi 2 Sak", "Pestisida Organik 500ml"],
    normalPrice: 310_000,
    bundlePrice: 285_000,
    discount: 8,
    sold: 54,
    stock: 30,
    impact: "Menstimulasi penjualan pestisida menjelang musim tanam",
    badge: "Musiman",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    id: 3,
    name: "Paket Bangun Mandiri",
    items: ["Semen Gresik 5 Sak", "Paku Kayu Campur 1kg"],
    normalPrice: 345_000,
    bundlePrice: 320_000,
    discount: 7,
    sold: 22,
    stock: 25,
    impact: "Meningkatkan utilitas semen yang berlebih di gudang",
    badge: "Clearance",
    badgeColor: "bg-sky-100 text-sky-700",
  },
];

// Dynamic pricing / promo
const dynamicPricing = [
  { id: 1, item: "Gas LPG 3kg", currentPrice: 21_000, suggestedPrice: 19_500, reason: "Stok kritis — turunkan harga untuk kurangi permintaan lonjakan", type: "discount", urgency: "high" },
  { id: 2, item: "Semen Gresik 50kg", currentPrice: 65_000, suggestedPrice: 61_000, reason: "Stok berlebih — promo untuk clearance sebelum daluwarsa gudang", type: "promo", urgency: "medium" },
  { id: 3, item: "Mie Instan Soto Ayam", currentPrice: 3_500, suggestedPrice: 3_200, reason: "MBA: pembelian bersama teh celup meningkat 71% — bundling promo", type: "bundle-promo", urgency: "low" },
  { id: 4, item: "Beras Cianjur 5kg", currentPrice: 75_000, suggestedPrice: 78_000, reason: "Permintaan tinggi + stok menipis — naikkan harga secara wajar", type: "surge", urgency: "medium" },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    inventory: currentInventory,
    shelf: shelfLayout,
    basket: basketAnalysis,
    bundles: smartBundles,
    dynamicPricing,
  });
}
