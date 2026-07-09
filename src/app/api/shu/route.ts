import { NextResponse } from "next/server";

// ── In-memory "database" ───────────────────────────────────────────────────
let membersShu = [
  { id: 1,  name: "Ahmad Subarjo",    memberId: "KOP-00121", simpananPokok: 500_000,  simpananWajib: 2_400_000, totalBelanja: 18_500_000, jasaModal: 250_000, jasaAnggota: 450_000, total: 700_000,   blastStatus: "BELUM", phone: "08123456001" },
  { id: 2,  name: "Siti Rahmawati",   memberId: "KOP-00244", simpananPokok: 500_000,  simpananWajib: 3_000_000, totalBelanja: 24_200_000, jasaModal: 300_000, jasaAnggota: 550_000, total: 850_000,   blastStatus: "TERKIRIM", phone: "08123456002" },
  { id: 3,  name: "Budi Santoso",     memberId: "KOP-00089", simpananPokok: 500_000,  simpananWajib: 1_800_000, totalBelanja: 12_800_000, jasaModal: 150_000, jasaAnggota: 350_000, total: 500_000,   blastStatus: "BELUM", phone: "08123456003" },
  { id: 4,  name: "Dewi Lestari",     memberId: "KOP-00187", simpananPokok: 500_000,  simpananWajib: 4_200_000, totalBelanja: 35_600_000, jasaModal: 500_000, jasaAnggota: 900_000, total: 1_400_000, blastStatus: "BELUM", phone: "08123456004" },
  { id: 5,  name: "Hendra Wijaya",    memberId: "KOP-00302", simpananPokok: 500_000,  simpananWajib: 3_600_000, totalBelanja: 28_900_000, jasaModal: 400_000, jasaAnggota: 750_000, total: 1_150_000, blastStatus: "TERKIRIM", phone: "08123456005" },
  { id: 6,  name: "Lani Mulyani",     memberId: "KOP-00045", simpananPokok: 500_000,  simpananWajib: 1_500_000, totalBelanja: 10_200_000, jasaModal: 180_000, jasaAnggota: 320_000, total: 500_000,   blastStatus: "BELUM", phone: "08123456006" },
  { id: 7,  name: "Prasetyo",         memberId: "KOP-00158", simpananPokok: 500_000,  simpananWajib: 5_100_000, totalBelanja: 42_100_000, jasaModal: 620_000, jasaAnggota: 980_000, total: 1_600_000, blastStatus: "BELUM", phone: "08123456007" },
  { id: 8,  name: "Endah Kurniasih",  memberId: "KOP-00077", simpananPokok: 500_000,  simpananWajib: 2_100_000, totalBelanja: 16_700_000, jasaModal: 220_000, jasaAnggota: 410_000, total: 630_000,   blastStatus: "TERKIRIM", phone: "08123456008" },
  { id: 9,  name: "Sarwono",          memberId: "KOP-00213", simpananPokok: 500_000,  simpananWajib: 1_200_000, totalBelanja:  8_400_000, jasaModal: 120_000, jasaAnggota: 230_000, total: 350_000,   blastStatus: "BELUM", phone: "08123456009" },
  { id: 10, name: "Wati Suryani",     memberId: "KOP-00330", simpananPokok: 500_000,  simpananWajib: 2_700_000, totalBelanja: 21_300_000, jasaModal: 280_000, jasaAnggota: 520_000, total: 800_000,   blastStatus: "BELUM", phone: "08123456010" },
  { id: 11, name: "Ngatirah",         memberId: "KOP-00062", simpananPokok: 500_000,  simpananWajib: 1_650_000, totalBelanja: 13_500_000, jasaModal: 165_000, jasaAnggota: 340_000, total: 505_000,   blastStatus: "TERKIRIM", phone: "08123456011" },
  { id: 12, name: "Karno Wiyoto",     memberId: "KOP-00099", simpananPokok: 500_000,  simpananWajib: 3_300_000, totalBelanja: 26_600_000, jasaModal: 360_000, jasaAnggota: 680_000, total: 1_040_000, blastStatus: "BELUM", phone: "08123456012" },
];

// ── Aggregate SHU calculation ─────────────────────────────────────────────
// Keuntungan bruto - biaya operasional - gaji - pajak - cadangan = SHU bersih
const shuAggregate = {
  grossProfit:     2_450_000_000,
  deductions: {
    operational:     420_000_000,
    salaries:        310_000_000,
    taxes:           135_000_000,
    reserveFund:      85_000_000,
  },
  netShu:        1_500_000_000,   // = grossProfit - sum(deductions)
  // Alokasi SHU bersih
  allocation: {
    jasaModal:       450_000_000, // 30% — proporsional simpanan
    jasaAnggota:     750_000_000, // 50% — proporsional belanja
    danaPendidikan:  150_000_000, // 10%
    cadanganKoperasi: 150_000_000, // 10%
  },
  period: "Januari – Juni 2026",
  totalMembers: 785,
  blastSentCount: 0,
};

export async function GET() {
  const sent = membersShu.filter(m => m.blastStatus === "TERKIRIM").length;
  return NextResponse.json({
    success: true,
    aggregate: { ...shuAggregate, blastSentCount: sent },
    members: membersShu,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, memberId } = body;

    if (action === "blast_all") {
      membersShu = membersShu.map(m => ({ ...m, blastStatus: "TERKIRIM" }));
      return NextResponse.json({
        success: true,
        message: `Rincian SHU ${membersShu.length} anggota berhasil diblast via WhatsApp!`,
        members: membersShu,
      });
    }

    if (action === "blast_single") {
      const idx = membersShu.findIndex(m => m.memberId === memberId);
      if (idx !== -1) {
        membersShu[idx].blastStatus = "TERKIRIM";
        return NextResponse.json({
          success: true,
          message: `Rincian SHU untuk ${membersShu[idx].name} (${memberId}) berhasil diblast!`,
          members: membersShu,
        });
      }
      return NextResponse.json({ success: false, message: "Anggota tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: false, message: "Action tidak valid" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
