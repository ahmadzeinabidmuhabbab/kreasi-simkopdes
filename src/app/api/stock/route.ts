import { NextResponse } from "next/server";

// ── In-memory stock store ──────────────────────────────────────────────────
let stockItems = [
  { id: 1,  sku: "SKU-001", name: "Beras Premium 5kg",       category: "Sembako",   stock: 48,  minStock: 20, unit: "Karung", buyPrice: 75000,  sellPrice: 85000,  supplier: "UD Sumber Pangan",   lastRestock: "2026-07-01" },
  { id: 2,  sku: "SKU-002", name: "Minyak Goreng 2L",        category: "Sembako",   stock: 62,  minStock: 30, unit: "Botol",  buyPrice: 22000,  sellPrice: 28000,  supplier: "CV Nusantara Mitra",  lastRestock: "2026-07-01" },
  { id: 3,  sku: "SKU-003", name: "Gula Pasir 1kg",          category: "Sembako",   stock: 95,  minStock: 40, unit: "Kg",     buyPrice: 13000,  sellPrice: 15500,  supplier: "UD Sumber Pangan",   lastRestock: "2026-07-02" },
  { id: 4,  sku: "SKU-004", name: "Gas LPG 3kg",             category: "Energi",    stock: 5,   minStock: 15, unit: "Tabung", buyPrice: 18000,  sellPrice: 21000,  supplier: "Pertamina Sub-agen", lastRestock: "2026-06-28" },
  { id: 5,  sku: "SKU-005", name: "Mie Instan Soto Ayam",    category: "Sembako",   stock: 320, minStock: 100, unit: "Pcs",   buyPrice: 2800,   sellPrice: 3500,   supplier: "Distributor Indofood", lastRestock: "2026-07-03" },
  { id: 6,  sku: "SKU-006", name: "Teh Celup 50s",           category: "Sembako",   stock: 88,  minStock: 30, unit: "Kotak", buyPrice: 9000,   sellPrice: 12500,  supplier: "Sariwangi Dist.",    lastRestock: "2026-07-02" },
  { id: 7,  sku: "SKU-007", name: "Kopi Bubuk 200g",         category: "Sembako",   stock: 44,  minStock: 20, unit: "Sachet",buyPrice: 18000,  sellPrice: 22000,  supplier: "Kapal Api Dist.",    lastRestock: "2026-07-01" },
  { id: 8,  sku: "SKU-008", name: "Pupuk Urea Subsidi 50kg", category: "Pertanian", stock: 38,  minStock: 25, unit: "Sak",   buyPrice: 110000, sellPrice: 130000, supplier: "Pupuk Kaltim",      lastRestock: "2026-06-25" },
  { id: 9,  sku: "SKU-009", name: "Pupuk Phonska 50kg",      category: "Pertanian", stock: 22,  minStock: 20, unit: "Sak",   buyPrice: 140000, sellPrice: 165000, supplier: "Pupuk Indonesia",    lastRestock: "2026-06-20" },
  { id: 10, sku: "SKU-010", name: "Pestisida Organik 500ml", category: "Pertanian", stock: 18,  minStock: 10, unit: "Botol", buyPrice: 35000,  sellPrice: 45000,  supplier: "PT Agro Kimia",      lastRestock: "2026-06-30" },
  { id: 11, sku: "SKU-011", name: "Semen Gresik 50kg",       category: "Bangunan",  stock: 120, minStock: 50, unit: "Sak",   buyPrice: 55000,  sellPrice: 65000,  supplier: "Semen Gresik Dist.", lastRestock: "2026-07-04" },
  { id: 12, sku: "SKU-012", name: "Paku Kayu Campur 1kg",    category: "Bangunan",  stock: 65,  minStock: 20, unit: "Kg",    buyPrice: 13000,  sellPrice: 18000,  supplier: "UD Besi Jaya",       lastRestock: "2026-07-02" },
  { id: 13, sku: "SKU-013", name: "Cat Tembok 5kg",          category: "Bangunan",  stock: 7,   minStock: 10, unit: "Kaleng",buyPrice: 72000,  sellPrice: 89000,  supplier: "Distributor Avian",   lastRestock: "2026-06-15" },
  { id: 14, sku: "SKU-014", name: "Sabun Mandi 65g",         category: "Kebersihan",stock: 200, minStock: 50, unit: "Pcs",   buyPrice: 2500,   sellPrice: 3500,   supplier: "Unilever Dist.",     lastRestock: "2026-07-03" },
  { id: 15, sku: "SKU-015", name: "Deterjen Bubuk 1kg",      category: "Kebersihan",stock: 85,  minStock: 30, unit: "Pcs",   buyPrice: 16000,  sellPrice: 20000,  supplier: "Rinso Dist.",        lastRestock: "2026-07-01" },
  { id: 16, sku: "SKU-016", name: "Shampoo Sachet 10ml",     category: "Kebersihan",stock: 12,  minStock: 50, unit: "Pcs",   buyPrice: 700,    sellPrice: 1000,   supplier: "Unilever Dist.",     lastRestock: "2026-06-10" },
  { id: 17, sku: "SKU-017", name: "Paracetamol 500mg Strip", category: "Kesehatan", stock: 45,  minStock: 20, unit: "Strip", buyPrice: 3000,   sellPrice: 4500,   supplier: "Kimia Farma",        lastRestock: "2026-07-02" },
  { id: 18, sku: "SKU-018", name: "Masker Medis 3 Ply",      category: "Kesehatan", stock: 8,   minStock: 20, unit: "Box",   buyPrice: 18000,  sellPrice: 25000,  supplier: "PT Medika Prima",    lastRestock: "2026-05-30" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status   = searchParams.get("status");

  const getStatus = (item: typeof stockItems[0]) => {
    if (item.stock === 0) return "HABIS";
    if (item.stock <= item.minStock * 0.5) return "KRITIS";
    if (item.stock <= item.minStock) return "RENDAH";
    return "AMAN";
  };

  let items = stockItems.map(i => ({ ...i, stockStatus: getStatus(i) }));
  if (category && category !== "SEMUA") items = items.filter(i => i.category === category);
  if (status && status !== "SEMUA") items = items.filter(i => i.stockStatus === status);

  const categories = [...new Set(stockItems.map(i => i.category))];
  const totalValue = stockItems.reduce((a, i) => a + i.stock * i.buyPrice, 0);

  return NextResponse.json({
    success: true,
    items,
    summary: {
      totalSku: stockItems.length,
      aman:    items.filter(i => i.stockStatus === "AMAN").length,
      rendah:  items.filter(i => i.stockStatus === "RENDAH").length,
      kritis:  items.filter(i => i.stockStatus === "KRITIS").length,
      habis:   items.filter(i => i.stockStatus === "HABIS").length,
      totalValue,
    },
    categories,
  });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, stock, minStock, buyPrice, sellPrice } = body;

    const idx = stockItems.findIndex(i => i.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: "Item tidak ditemukan" }, { status: 404 });

    stockItems[idx] = {
      ...stockItems[idx],
      ...(stock !== undefined && { stock }),
      ...(minStock !== undefined && { minStock }),
      ...(buyPrice !== undefined && { buyPrice }),
      ...(sellPrice !== undefined && { sellPrice }),
      lastRestock: stock !== undefined ? new Date().toISOString().split("T")[0] : stockItems[idx].lastRestock,
    };

    return NextResponse.json({ success: true, message: `Stok ${stockItems[idx].name} berhasil diperbarui`, item: stockItems[idx] });
  } catch {
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
