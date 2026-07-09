import { NextResponse } from "next/server";

// ── Types ──────────────────────────────────────────────────────────────────
interface RfqRecord {
  id: number; date: string; time: string;
  commodity: string; category: string;
  volume: number; price: number; value: number;
  status: "DISETUJUI" | "DIPROSES" | "DITOLAK" | "MENUNGGU";
  source: string;
}

interface NewsItem {
  id: number;
  source: "Google Trends" | "Berita Lokal Kabupaten";
  sourceIcon: string;
  title: string;
  text: string; // full text
  keyword: string;
  region: string;
  mediaName?: string;   // for Berita Lokal
  trendScore?: number;  // for Google Trends
  publishedAt: string;
}

interface Prediction {
  id: number; source: string; commodity: string; category: string;
  volume: number; unit: string; price: number; confidence: number;
  analysis: string; text: string; // full analysis text
}

// ── In-memory database ─────────────────────────────────────────────────────
let rfqHistory: RfqRecord[] = [
  { id: 1, date: "2026-06-12", time: "14:20 WIB", commodity: "Semen Gresik 40kg",          category: "Bahan Bangunan", volume: 1500, price: 65000, value: 97_500_000,  status: "DISETUJUI", source: "Google Trends" },
  { id: 2, date: "2026-06-10", time: "09:30 WIB", commodity: "Pupuk Urea Subsidi",          category: "Pertanian",     volume: 2000, price: 120000,value: 240_000_000, status: "DISETUJUI", source: "Berita Lokal Kabupaten" },
  { id: 3, date: "2026-06-05", time: "11:15 WIB", commodity: "Beras Cianjur Pandanwangi",   category: "Sembako",       volume: 3000, price: 15000, value: 45_000_000,  status: "DISETUJUI", source: "Berita Lokal Kabupaten" },
  { id: 4, date: "2026-06-01", time: "08:45 WIB", commodity: "Minyak Goreng Curah 1L",      category: "Sembako",       volume: 1800, price: 14500, value: 26_100_000,  status: "DISETUJUI", source: "Google Trends" },
  { id: 5, date: "2026-05-28", time: "16:00 WIB", commodity: "Bibit Jagung Hibrida",        category: "Pertanian",     volume: 500,  price: 95000, value: 47_500_000,  status: "DIPROSES",  source: "Berita Lokal Kabupaten" },
  { id: 6, date: "2026-05-25", time: "10:20 WIB", commodity: "Gas LPG 3kg",                 category: "Energi",        volume: 4000, price: 21000, value: 84_000_000,  status: "DISETUJUI", source: "Google Trends" },
  { id: 7, date: "2026-05-20", time: "13:00 WIB", commodity: "Gula Pasir Curah 1kg",        category: "Sembako",       volume: 2500, price: 16000, value: 40_000_000,  status: "DITOLAK",   source: "Berita Lokal Kabupaten" },
  { id: 8, date: "2026-05-15", time: "09:00 WIB", commodity: "Pestisida Organik 500ml",     category: "Pertanian",     volume: 300,  price: 75000, value: 22_500_000,  status: "DISETUJUI", source: "Google Trends" },
];

const rawNewsData: NewsItem[] = [
  {
    id: 1,
    source: "Google Trends",
    sourceIcon: "trending_up",
    title: "Lonjakan pencarian 'Semen harga terjangkau' di Kab. Blitar",
    text: "Kueri pencarian 'semen murah' dan 'harga semen terbaru' meroket 280% dalam 7 hari terakhir di wilayah Kabupaten Blitar, dipicu tingginya proyek rehab rumah tidak layak huni (RTLH) desa. Data Google Trends menunjukkan puncak pencarian terjadi pada hari Rabu–Kamis, bertepatan dengan pengumuman bantuan RTLH oleh Pemerintah Kabupaten. Volume pencarian mencapai 12.400 kueri unik per hari. Kategori terkait yang turut meningkat: cat tembok (+180%), pasir bangunan (+95%), bata merah (+120%).",
    keyword: "Semen Gresik 40kg",
    region: "Kab. Blitar",
    trendScore: 87,
    publishedAt: "2 jam lalu",
  },
  {
    id: 2,
    source: "Berita Lokal Kabupaten",
    sourceIcon: "newspaper",
    mediaName: "Radar Blitar",
    title: "Kelangkaan pupuk urea melanda petani Kab. Kediri menjelang musim tanam",
    text: "Ribuan petani di Kecamatan Pare, Kepung, dan Kandangan, Kabupaten Kediri, mengeluhkan sulitnya mendapatkan pupuk urea bersubsidi menjelang masa tanam kedua 2026. Penyuluh pertanian setempat mencatat lebih dari 4.200 petani terdampak. Harga pupuk non-subsidi melonjak 45% dari Rp 1.100.000 menjadi Rp 1.600.000 per kwintal. Dinas Pertanian Kab. Kediri telah berkoordinasi dengan distributor untuk percepatan penyaluran, namun hingga berita ini diturunkan, stok di tingkat pengecer masih sangat terbatas. Koperasi desa diharapkan segera mengajukan pengadaan darurat agar petani tidak beralih ke pupuk kimia tidak terstandar.",
    keyword: "Pupuk Urea Subsidi",
    region: "Kab. Kediri",
    trendScore: 92,
    publishedAt: "5 jam lalu",
  },
  {
    id: 3,
    source: "Google Trends",
    sourceIcon: "trending_up",
    title: "Gas LPG 3kg langka — pencarian melonjak 340% di Kab. Malang",
    text: "Penelusuran terkait kelangkaan gas LPG 3kg melonjak drastis di wilayah Kabupaten Malang selama sepekan terakhir, terutama di kecamatan Kepanjen, Singosari, dan Lawang. Volume pencarian harian mencapai 18.700 kueri unik, naik 340% dibandingkan rata-rata bulan sebelumnya. Tren ini berkorelasi dengan meningkatnya permintaan menjelang musim hajatan Juli–Agustus dan Hari Raya Idul Adha. Sub-topik terkait yang juga meningkat: 'agen LPG terdekat' (+410%), 'cara daftar subsidi LPG' (+220%). Koperasi desa disarankan untuk segera melakukan pengadaan darurat minimal 500 tabung untuk mengantisipasi lonjakan permintaan.",
    keyword: "Gas LPG 3kg",
    region: "Kab. Malang",
    trendScore: 95,
    publishedAt: "3 jam lalu",
  },
  {
    id: 4,
    source: "Berita Lokal Kabupaten",
    sourceIcon: "newspaper",
    mediaName: "Suara Mitra Jombang",
    title: "Petani Kab. Jombang butuhkan 1.500 ton bibit padi varietas Ciherang untuk MT III",
    text: "Menjelang musim tanam ketiga 2026, para petani di sentra padi Kecamatan Megaluh, Peterongan, dan Diwek, Kabupaten Jombang, menghadapi kesulitan mendapatkan bibit padi unggul varietas Ciherang dan Mekongga. Berdasarkan rekap kebutuhan dari 12 Gapoktan yang terdaftar di Dinas Pertanian Kab. Jombang, total kebutuhan bibit mencapai 1.500 ton. Sementara ketersediaan dari penangkar resmi hanya mencukupi 40% dari kebutuhan. Koperasi desa di kawasan tersebut diharapkan berkoordinasi dengan BULOG dan distributor benih bersertifikat untuk memastikan ketersediaan bibit tepat waktu sebelum 20 Juli 2026.",
    keyword: "Bibit Padi Ciherang",
    region: "Kab. Jombang",
    trendScore: 78,
    publishedAt: "8 jam lalu",
  },
  {
    id: 5,
    source: "Google Trends",
    sourceIcon: "trending_up",
    title: "Pencarian 'beras murah berkualitas' naik 156% di Kab. Tulungagung",
    text: "Data Google Trends minggu ini menunjukkan lonjakan signifikan pada kueri 'beras murah berkualitas', 'beras premium lokal', dan 'toko beras terdekat' di Kabupaten Tulungagung. Lonjakan terbesar terjadi di Kecamatan Tulungagung (kota), Kedungwaru, dan Ngunut. Sebanyak 9.200 pencarian unik per hari tercatat, naik 156% dari rata-rata mingguan sebelumnya. Analisis sub-topik menunjukkan masyarakat mencari alternatif beras premium dengan harga kompetitif di tengah kenaikan harga beras IR 64 di pasaran. Varietas yang paling banyak dicari: Cianjur Pandanwangi, Beras Merah Organik, dan Pandan Wangi lokal.",
    keyword: "Beras Premium 5kg",
    region: "Kab. Tulungagung",
    trendScore: 74,
    publishedAt: "4 jam lalu",
  },
  {
    id: 6,
    source: "Berita Lokal Kabupaten",
    sourceIcon: "newspaper",
    mediaName: "TribunJatim.com — Ngawi",
    title: "Harga cabai rawit Kab. Ngawi melonjak 320% — koperasi diharapkan jadi penyangga",
    text: "Harga cabai rawit merah di Pasar Besar Ngawi melonjak dari Rp 28.000 menjadi Rp 118.000 per kilogram dalam dua pekan terakhir, dipicu curah hujan tinggi yang merusak panen di sentra cabai Kecamatan Ngrambe dan Paron. Dinas Perdagangan Kab. Ngawi mencatat kenaikan mencapai 320% dibandingkan harga normal bulan Juni. Warga dan pedagang makanan kecil sangat terdampak. Pemerintah Kabupaten mengharapkan koperasi desa dan BUMDes dapat berperan sebagai penyangga harga dengan melakukan pembelian langsung dari petani yang masih panen untuk kemudian didistribusikan ke masyarakat dengan harga terjangkau.",
    keyword: "Cabai Rawit Merah",
    region: "Kab. Ngawi",
    trendScore: 88,
    publishedAt: "12 jam lalu",
  },
];

const predictionTemplates: Prediction[] = [
  { id: 1, source: "Google Trends",           commodity: "Semen Gresik 40kg",      category: "Bahan Bangunan", volume: 1500, unit: "Sak",    price: 65000,  confidence: 87, analysis: "Tren pencarian proyek RTLH desa meningkat pesat",   text: "Kueri 'semen murah' meroket 280% di Kab. Blitar selama 7 hari. Volume pencarian mencapai 12.400 kueri unik/hari, dipicu pengumuman bantuan RTLH oleh Pemkab." },
  { id: 2, source: "Berita Lokal Kabupaten",  commodity: "Pupuk Urea Subsidi",     category: "Pertanian",     volume: 2000, unit: "Kg",    price: 120000, confidence: 92, analysis: "Kelangkaan kritis menjelang musim tanam kedua MT II",  text: "Lebih dari 4.200 petani di Kab. Kediri terdampak kelangkaan pupuk urea. Harga non-subsidi naik 45% ke Rp 1.600.000/kwintal. (Radar Blitar, 09 Jul 2026)" },
  { id: 3, source: "Google Trends",           commodity: "Gas LPG 3kg",            category: "Energi",        volume: 4000, unit: "Tabung",price: 21000,  confidence: 95, analysis: "Kelangkaan kritis jelang Idul Adha — prioritas tinggi", text: "Pencarian LPG 3kg melonjak 340% di Kab. Malang. Sub-topik 'agen LPG terdekat' naik 410%. Puncak permintaan diprediksi pada 15–25 Juli 2026." },
  { id: 4, source: "Berita Lokal Kabupaten",  commodity: "Bibit Padi Ciherang",    category: "Pertanian",     volume: 1500, unit: "Kg",    price: 45000,  confidence: 78, analysis: "Kebutuhan bibit padi MT III lebih besar dari ketersediaan",text: "12 Gapoktan di Kab. Jombang butuhkan 1.500 ton bibit, namun penangkar resmi hanya mampu penuhi 40%. Deadline pengadaan sebelum 20 Juli 2026. (Suara Mitra Jombang)" },
  { id: 5, source: "Google Trends",           commodity: "Beras Premium 5kg",      category: "Sembako",       volume: 700,  unit: "Karung",price: 75000,  confidence: 74, analysis: "Permintaan beras premium naik untuk acara hajatan musiman", text: "Pencarian 'beras murah berkualitas' naik 156% di Kab. Tulungagung. Varietas Cianjur Pandanwangi paling dicari. Puncak permintaan musim hajatan Juli–Agustus." },
  { id: 6, source: "Berita Lokal Kabupaten",  commodity: "Cabai Rawit Merah 1kg",  category: "Sembako",       volume: 300,  unit: "Kg",    price: 105000, confidence: 88, analysis: "Harga melonjak 320% akibat gagal panen di Kab. Ngawi",   text: "Harga cabai rawit Pasar Ngawi naik Rp 28.000 → Rp 118.000/kg. Gagal panen di Kec. Ngrambe dan Paron. Koperasi diharapkan jadi penyangga harga. (TribunJatim.com)" },
];

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET() {
  const totalRfq    = rfqHistory.length;
  const approvedRfq = rfqHistory.filter(r => r.status === "DISETUJUI").length;
  const approvalRate = totalRfq ? Math.round((approvedRfq / totalRfq) * 100) : 0;

  const catMap: Record<string, number> = {};
  rfqHistory.filter(r => r.status === "DISETUJUI").forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.value; });
  const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([category, value]) => ({ category, value }));

  return NextResponse.json({
    success: true,
    summary: { totalRfq, approvedRfq, approvalRate, totalValue: rfqHistory.reduce((a, r) => a + r.value, 0) },
    topCategories,
    news: rawNewsData,
    rfqHistory,
  });
}

// ── POST ────────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, commodity, category, volume, price, source, startDate, endDate } = body;

    if (action === "generate") {
      // Simulate AI delay – just return predictions (date range passed for future API use)
      const meta = { startDate, endDate };
      return NextResponse.json({ success: true, predictions: predictionTemplates, meta });
    }

    if (action === "approve") {
      const now = new Date();
      const newRfq: RfqRecord = {
        id: rfqHistory.length + 1,
        date: now.toISOString().split("T")[0],
        time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        commodity, category,
        volume: Number(volume),
        price: Number(price),
        value: Number(volume) * Number(price),
        status: "MENUNGGU",
        source,
      };
      rfqHistory = [newRfq, ...rfqHistory];
      return NextResponse.json({ success: true, rfq: newRfq, history: rfqHistory });
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
