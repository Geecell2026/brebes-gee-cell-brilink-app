import { db } from "@/lib/db";
import { hitungTotalPendapatan, hitungTotalPengeluaran } from "@/lib/calculations/transaksi";
import { getAppSettings } from "@/lib/calculations/settings";
import { pertumbuhanPersen, rataRata } from "@/lib/analytics/statistics";
import { hitungProyeksiAkhirBulan } from "@/lib/forecast/forecast";
import { hitungNetProfitBreakdown, hitungLabaDenganNetProfit } from "@/lib/calculations/net-profit";
import type {
  DashboardKpi,
  DetailCabangDashboard,
  Growth,
  KomposisiTransaksi,
  PeriodeMode,
  ProyeksiSkenario,
  RincianPendapatan,
  StatusCabangDashboard,
  TransaksiPerJenisRow,
  TrendPoint,
} from "@/types/dashboard";

const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function fmtTanggalPendek(d: Date): string {
  return `${d.getUTCDate()} ${BULAN_SINGKAT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Poin 12 spesifikasi: default periode Dashboard = bulan berjalan (1 s/d hari ini),
// beda dari default 30-hari-terakhir di modul Analisis - supaya "Periode yang sama
// bulan lalu" langsung punya arti (band 1-9 Juli vs 1-9 Juni), bukan rentang geser.
export function resolveDashboardPeriod(params: { startDate?: string; endDate?: string }) {
  if (!params.startDate && !params.endDate) {
    const now = new Date();
    const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return {
      startDate,
      endDate,
      startDateStr: startDate.toISOString().slice(0, 10),
      endDateStr: new Date(endDate.getTime() - 86400000).toISOString().slice(0, 10),
    };
  }
  const startDate = params.startDate ? new Date(`${params.startDate}T00:00:00Z`) : new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const endDateInclusive = params.endDate ? new Date(`${params.endDate}T00:00:00Z`) : new Date();
  const endDate = new Date(endDateInclusive.getTime() + 86400000);
  return {
    startDate,
    endDate,
    startDateStr: startDate.toISOString().slice(0, 10),
    endDateStr: endDateInclusive.toISOString().slice(0, 10),
  };
}

function periodeLengthDays(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
}

function enumerateMonths(startDate: Date, endDate: Date): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
  const lastIncluded = new Date(endDate.getTime() - 1);
  while (cursor.getTime() <= lastIncluded.getTime()) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

// Penutupan Bulanan (Net Profit Acc & Aice) HANYA memengaruhi Laba/Rincian
// Pendapatan di sini - tidak pernah disentuh di hitungPendapatanBiayaLaba atau
// Saldo Akhir (lib/calculations/transaksi.ts tetap tidak diubah). Perhitungan
// murninya ada di hitungNetProfitBreakdown (lib/calculations/net-profit.ts,
// diuji unit test) - fungsi ini cuma wrapper query DB, sengaja mengambil semua
// status (bukan cuma FINAL) supaya logika "Draft tidak dihitung" tetap berada
// di fungsi murni yang sama dengan yang diuji, bukan diam-diam di query.
async function fetchNetProfitFinal(branchId: string | undefined, months: { year: number; month: number }[]) {
  if (months.length === 0) {
    return { total: 0, aksesori: null as number | null, aice: null as number | null, bulanBelumDitutup: [] as string[] };
  }
  const closings = await db.monthlyClosing.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      OR: months.map((m) => ({ year: m.year, month: m.month })),
    },
  });
  return hitungNetProfitBreakdown(closings, months);
}

// Poin F spesifikasi: estimasi HANYA untuk bulan berjalan yang belum Final, dan
// harus ditampilkan sebagai "Estimasi" terpisah, tidak pernah digabung ke laba aktual.
async function estimasiNetProfitBulanBerjalan(
  branchId: string | undefined,
  months: { year: number; month: number }[]
): Promise<number | null> {
  const now = new Date();
  const bulanIni = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const periodeMencakupBulanIni = months.some((m) => m.year === bulanIni.year && m.month === bulanIni.month);
  if (!periodeMencakupBulanIni) return null;

  const sudahFinal = await db.monthlyClosing.findFirst({
    where: { status: "FINAL", year: bulanIni.year, month: bulanIni.month, ...(branchId ? { branchId } : {}) },
  });
  if (sudahFinal) return null;

  const riwayat = await db.monthlyClosing.findMany({
    where: { status: "FINAL", ...(branchId ? { branchId } : {}) },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 3,
  });
  if (riwayat.length === 0) return null;
  return riwayat.reduce((sum, c) => sum + Number(c.totalNetProfit), 0) / riwayat.length;
}

// Poin 11 spesifikasi: perbandingan periode yang adil (bukan bulan-berjalan-parsial
// vs bulan-lalu-penuh). 3 mode pembanding sesuai poin 12.
function resolveComparablePeriod(startDate: Date, endDate: Date, mode: PeriodeMode) {
  const lastDayIncluded = new Date(endDate.getTime() - 86400000);

  if (mode === "BULAN_PENUH_SEBELUMNYA") {
    const prevMonthStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() - 1, 1));
    const prevMonthEnd = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
    return {
      prevStart: prevMonthStart,
      prevEnd: prevMonthEnd,
      pembandingLabel: `Bulan penuh sebelumnya (${BULAN_PANJANG[prevMonthStart.getUTCMonth()]} ${prevMonthStart.getUTCFullYear()})`,
      scaleToPeriodLength: false,
    };
  }

  if (mode === "RATA_HARIAN_BULAN_LALU") {
    const prevMonthStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() - 1, 1));
    const prevMonthEnd = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
    return {
      prevStart: prevMonthStart,
      prevEnd: prevMonthEnd,
      pembandingLabel: `Rata-rata harian bulan lalu (${BULAN_PANJANG[prevMonthStart.getUTCMonth()]} ${prevMonthStart.getUTCFullYear()}) x ${periodeLengthDays(startDate, endDate)} hari`,
      scaleToPeriodLength: true,
    };
  }

  // Default: SAMA_BULAN_LALU - geser mundur 1 bulan pada tanggal awal & akhir yang sama.
  const prevStart = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth() - 1, startDate.getUTCDate()));
  const prevEndInclusive = new Date(Date.UTC(lastDayIncluded.getUTCFullYear(), lastDayIncluded.getUTCMonth() - 1, lastDayIncluded.getUTCDate()));
  const prevEnd = new Date(prevEndInclusive.getTime() + 86400000);
  return {
    prevStart,
    prevEnd,
    pembandingLabel: `${fmtTanggalPendek(prevStart)} - ${fmtTanggalPendek(prevEndInclusive)}`,
    scaleToPeriodLength: false,
  };
}

type TxRow = Awaited<ReturnType<typeof fetchTransaksiPeriode>>[number];

async function fetchTransaksiPeriode(branchId: string | undefined, startDate: Date, endDate: Date) {
  return db.dailyTransaction.findMany({
    where: { ...(branchId ? { branchId } : {}), date: { gte: startDate, lt: endDate } },
    include: { branch: true, tellerBreakdown: true },
    orderBy: { date: "asc" },
  });
}

async function fetchBiayaByTanggalCabang(branchId: string | undefined, startDate: Date, endDate: Date) {
  const entries = await db.expenseEntry.groupBy({
    by: ["branchId", "date"],
    where: { ...(branchId ? { branchId } : {}), date: { gte: startDate, lt: endDate } },
    _sum: { totalPembayaran: true },
  });
  const map = new Map<string, number>();
  for (const e of entries) {
    map.set(`${e.branchId}_${e.date.toISOString()}`, Number(e._sum.totalPembayaran ?? 0));
  }
  return map;
}

// Total Biaya = modul Biaya (ExpenseEntry) + Lain-lain Pengeluaran + Aset
// Pengeluaran + Gaji/Kasbon yang tersimpan di Transaksi Harian - satu sumber
// kebenaran yang sama dengan yang sudah dipakai untuk Saldo Akhir, supaya Laba
// Operasional akurat tanpa dobel hitung (lihat lib/calculations/transaksi.ts).
function hitungPendapatanBiayaLaba(transaksi: TxRow[], biayaMap: Map<string, number>) {
  let pendapatan = 0;
  let biaya = 0;
  for (const tx of transaksi) {
    const biayaHariItu = biayaMap.get(`${tx.branchId}_${tx.date.toISOString()}`) ?? 0;
    pendapatan += hitungTotalPendapatan(tx);
    biaya += hitungTotalPengeluaran(tx, biayaHariItu);
  }
  const laba = pendapatan - biaya;
  const margin = pendapatan > 0 ? (laba / pendapatan) * 100 : null;
  return { pendapatan, biaya, laba, margin };
}

function hitungTransaksiBreakdown(transaksi: TxRow[]) {
  let transfer = 0;
  let eWallet = 0;
  let tarikTunai = 0;
  for (const tx of transaksi) {
    for (const t of tx.tellerBreakdown) {
      transfer += Number(t.transfer);
      eWallet += Number(t.eWallet);
      tarikTunai += Number(t.itTt);
    }
  }
  return { transfer, eWallet, tarikTunai, totalTransaksi: transfer + eWallet + tarikTunai };
}

function buatGrowth(sekarang: number, sebelumnya: number | null): Growth {
  if (sebelumnya === null || sebelumnya === 0) {
    return { persen: null, label: "Belum dapat dibandingkan" };
  }
  const persen = pertumbuhanPersen(sekarang, sebelumnya);
  return { persen, label: persen === null ? "Belum dapat dibandingkan" : "" };
}

export async function getDashboardKpi(params: {
  branchId?: string;
  startDate: Date;
  endDate: Date;
  comparisonMode: PeriodeMode;
}): Promise<DashboardKpi> {
  const { branchId, startDate, endDate, comparisonMode } = params;

  const [totalCabang, transaksi, biayaMap] = await Promise.all([
    db.branch.count({ where: { isActive: true } }),
    fetchTransaksiPeriode(branchId, startDate, endDate),
    fetchBiayaByTanggalCabang(branchId, startDate, endDate),
  ]);

  const { pendapatan, biaya } = hitungPendapatanBiayaLaba(transaksi, biayaMap);
  const { transfer, eWallet, tarikTunai, totalTransaksi } = hitungTransaksiBreakdown(transaksi);
  const adaDataRincianTransaksi = transaksi.some((tx) => tx.tellerBreakdown.length > 0);

  const bulanPeriode = enumerateMonths(startDate, endDate);
  const netProfit = await fetchNetProfitFinal(branchId, bulanPeriode);
  const estimasiNetProfit = await estimasiNetProfitBulanBerjalan(branchId, bulanPeriode);

  // Poin B spesifikasi: Pendapatan untuk Laba = pendapatan operasional + Net
  // Profit Acc & Aice (hanya yang berstatus FINAL). "totalPendapatan" KPI di
  // bawah TETAP pendapatan operasional saja (dipakai utk pertumbuhanPendapatan),
  // supaya perbandingan periode tidak melompat gara-gara input bulanan sekali.
  const { laba, margin } = hitungLabaDenganNetProfit(pendapatan, biaya, netProfit.total);

  let pendapatanAdmin = 0;
  let ppob = 0;
  let fee = 0;
  let pendapatanLain = 0;
  for (const tx of transaksi) {
    pendapatanAdmin += Number(tx.brilinkPendapatan);
    ppob += Number(tx.brilinkPpob);
    fee += Number(tx.brilinkFee);
    pendapatanLain += Number(tx.lainPendapatan) + Number(tx.asetPendapatan);
  }
  const rincianPendapatan: RincianPendapatan = {
    pendapatanAdmin,
    ppob,
    fee,
    pendapatanLain,
    netProfitAksesori: netProfit.aksesori,
    netProfitAice: netProfit.aice,
    totalNetProfit: netProfit.total,
    bulanBelumDitutup: netProfit.bulanBelumDitutup,
    estimasiNetProfitBulanBerjalan: estimasiNetProfit,
  };

  const { prevStart, prevEnd, pembandingLabel, scaleToPeriodLength } = resolveComparablePeriod(
    startDate,
    endDate,
    comparisonMode
  );
  const [prevTransaksi, prevBiayaMap] = await Promise.all([
    fetchTransaksiPeriode(branchId, prevStart, prevEnd),
    fetchBiayaByTanggalCabang(branchId, prevStart, prevEnd),
  ]);
  const prevFinansial = hitungPendapatanBiayaLaba(prevTransaksi, prevBiayaMap);
  const prevBreakdown = hitungTransaksiBreakdown(prevTransaksi);

  let prevPendapatanBaseline = prevFinansial.pendapatan;
  let prevTransaksiBaseline = prevBreakdown.totalTransaksi;
  if (scaleToPeriodLength) {
    const hariPembanding = periodeLengthDays(prevStart, prevEnd) || 1;
    const hariPeriode = periodeLengthDays(startDate, endDate);
    prevPendapatanBaseline = (prevFinansial.pendapatan / hariPembanding) * hariPeriode;
    prevTransaksiBaseline = (prevBreakdown.totalTransaksi / hariPembanding) * hariPeriode;
  }

  const hariLaporanTerinput = new Set(transaksi.map((tx) => tx.date.toISOString())).size;
  const hariLibur = transaksi.filter((tx) => tx.status === "LIBUR").length;
  const hariKalender = periodeLengthDays(startDate, endDate);
  const hariOperasional = Math.max(0, hariKalender - hariLibur);
  const hariBelumInput = Math.max(0, hariKalender - hariLaporanTerinput);
  const kelengkapanDataPersen = hariOperasional > 0 ? (hariLaporanTerinput / hariOperasional) * 100 : null;

  const inputTerakhir = transaksi.length > 0 ? transaksi[transaksi.length - 1].date : null;

  return {
    totalCabang,
    totalPendapatan: pendapatan,
    totalBiaya: biaya,
    labaOperasional: laba,
    marginOperasional: margin,
    totalTransaksi,
    transfer,
    eWallet,
    tarikTunai,
    hariLaporanTerinput,
    hariOperasional,
    hariBelumInput,
    kelengkapanDataPersen,
    inputTerakhir,
    pertumbuhanPendapatan: buatGrowth(pendapatan, prevPendapatanBaseline),
    pertumbuhanTransaksi: buatGrowth(totalTransaksi, prevTransaksiBaseline),
    periodeLabel: `${fmtTanggalPendek(startDate)} - ${fmtTanggalPendek(new Date(endDate.getTime() - 86400000))}`,
    pembandingLabel,
    adaDataRincianTransaksi,
    rincianPendapatan,
  };
}

export async function getDashboardTrend(
  mode: "keuangan" | "transaksi",
  branchId: string | undefined,
  bulanTerakhir = 6
): Promise<TrendPoint[]> {
  const now = new Date();
  const result: TrendPoint[] = [];

  for (let i = bulanTerakhir - 1; i >= 0; i--) {
    const targetDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const year = targetDate.getUTCFullYear();
    const month = targetDate.getUTCMonth() + 1;
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));

    const [transaksi, biayaMap, netProfit] = await Promise.all([
      fetchTransaksiPeriode(branchId, monthStart, monthEnd),
      fetchBiayaByTanggalCabang(branchId, monthStart, monthEnd),
      fetchNetProfitFinal(branchId, [{ year, month }]),
    ]);
    const { pendapatan, biaya } = hitungPendapatanBiayaLaba(transaksi, biayaMap);
    const { laba } = hitungLabaDenganNetProfit(pendapatan, biaya, netProfit.total);
    const { transfer, eWallet, tarikTunai, totalTransaksi } = hitungTransaksiBreakdown(transaksi);

    result.push({
      bulan: `${BULAN_SINGKAT[month - 1]} ${year}`,
      pendapatan,
      biaya,
      laba,
      totalTransaksi,
      transfer,
      eWallet,
      tarikTunai,
    });
  }

  void mode; // mode dipakai di layer komponen untuk memilih seri mana yang ditampilkan
  return result;
}

export async function getKomposisiTransaksi(branchId: string | undefined, startDate: Date, endDate: Date): Promise<KomposisiTransaksi[]> {
  const transaksi = await fetchTransaksiPeriode(branchId, startDate, endDate);
  const { transfer, eWallet, tarikTunai, totalTransaksi } = hitungTransaksiBreakdown(transaksi);
  if (totalTransaksi === 0) return [];

  return [
    { kategori: "Transfer", jumlah: transfer, persen: (transfer / totalTransaksi) * 100 },
    { kategori: "E-Wallet/PPOB", jumlah: eWallet, persen: (eWallet / totalTransaksi) * 100 },
    { kategori: "Tarik Tunai", jumlah: tarikTunai, persen: (tarikTunai / totalTransaksi) * 100 },
  ];
}

export async function getTransaksiPerJenis(params: {
  branchId?: string;
  startDate: Date;
  endDate: Date;
  comparisonMode: PeriodeMode;
}): Promise<TransaksiPerJenisRow[]> {
  const { branchId, startDate, endDate, comparisonMode } = params;
  const transaksi = await fetchTransaksiPeriode(branchId, startDate, endDate);
  const current = hitungTransaksiBreakdown(transaksi);
  const hariOperasional = Math.max(1, periodeLengthDays(startDate, endDate) - transaksi.filter((t) => t.status === "LIBUR").length);

  const { prevStart, prevEnd } = resolveComparablePeriod(startDate, endDate, comparisonMode);
  const prevTransaksi = await fetchTransaksiPeriode(branchId, prevStart, prevEnd);
  const prev = hitungTransaksiBreakdown(prevTransaksi);

  if (current.totalTransaksi === 0) return [];

  const rows: { jenis: TransaksiPerJenisRow["jenis"]; total: number; prevTotal: number }[] = [
    { jenis: "Transfer", total: current.transfer, prevTotal: prev.transfer },
    { jenis: "E-Wallet/PPOB", total: current.eWallet, prevTotal: prev.eWallet },
    { jenis: "Tarik Tunai", total: current.tarikTunai, prevTotal: prev.tarikTunai },
  ];

  return rows.map((r) => {
    const growth = r.prevTotal > 0 ? pertumbuhanPersen(r.total, r.prevTotal) : null;
    return {
      jenis: r.jenis,
      total: r.total,
      rataRataHarian: r.total / hariOperasional,
      kontribusiPersen: (r.total / current.totalTransaksi) * 100,
      pertumbuhanPersen: growth,
      tren: growth === null ? "Stabil" : growth > 2 ? "Naik" : growth < -2 ? "Turun" : "Stabil",
    };
  });
}

// Poin 18 spesifikasi: 3 skenario memakai fungsi proyeksi yang sudah ada &
// tervalidasi di modul Analisis (lib/forecast/forecast.ts) - tidak menulis ulang
// logika proyeksi, cuma dipetakan labelnya (Rata-rata Harian->Konservatif dst).
export async function getProyeksiAkhirBulan(branchId?: string): Promise<{
  pendapatan: ProyeksiSkenario[];
  totalTransaksi: ProyeksiSkenario[];
}> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const totalHariBulan = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();

  const [transaksi, biayaMap] = await Promise.all([
    fetchTransaksiPeriode(branchId, monthStart, monthEnd),
    fetchBiayaByTanggalCabang(branchId, monthStart, monthEnd),
  ]);

  const pendapatanHarian = transaksi.map((tx) => hitungTotalPendapatan(tx));
  const transaksiHarian = transaksi.map((tx) =>
    tx.tellerBreakdown.reduce((sum, t) => sum + Number(t.transfer) + Number(t.eWallet) + Number(t.itTt), 0)
  );
  void biayaMap;

  const labelMap = ["Konservatif", "Realistis", "Optimistis"] as const;
  const proyeksiPendapatan = hitungProyeksiAkhirBulan(pendapatanHarian, transaksi.length, totalHariBulan);
  const proyeksiTransaksi = hitungProyeksiAkhirBulan(transaksiHarian, transaksi.length, totalHariBulan);

  return {
    pendapatan: proyeksiPendapatan.map((p, i) => ({ skenario: labelMap[i], nilai: p.proyeksi })),
    totalTransaksi: proyeksiTransaksi.map((p, i) => ({ skenario: labelMap[i], nilai: p.proyeksi })),
  };
}

// Poin 19 spesifikasi: status cabang multi-faktor (bukan cuma nominal omset).
function tentukanStatusCabang(params: {
  isActive: boolean;
  hariLaporanTerinput: number;
  kelengkapanDataPersen: number | null;
  laba: number;
  margin: number | null;
  pertumbuhanPendapatan: number | null;
}): { status: StatusCabangDashboard; alasan: string } {
  const { isActive, hariLaporanTerinput, kelengkapanDataPersen, laba, margin, pertumbuhanPendapatan } = params;

  if (!isActive) return { status: "Belum Beroperasi", alasan: "Cabang belum aktif." };
  if (hariLaporanTerinput < 5 || kelengkapanDataPersen === null) {
    return { status: "Data Belum Cukup", alasan: "Laporan harian pada periode ini masih terlalu sedikit untuk dinilai." };
  }
  if (kelengkapanDataPersen < 75) {
    return {
      status: "Data Belum Cukup",
      alasan: `Kelengkapan data baru ${kelengkapanDataPersen.toFixed(1)}%, analisis belum sepenuhnya akurat.`,
    };
  }

  let skor = 0;
  const catatan: string[] = [];
  if (laba >= 0) {
    skor += 1;
    catatan.push("laba positif");
  } else {
    catatan.push("laba negatif");
  }
  if (margin !== null && margin >= 15) {
    skor += 1;
    catatan.push("margin sehat");
  } else if (margin !== null) {
    catatan.push(`margin ${margin.toFixed(1)}%`);
  }
  if (pertumbuhanPendapatan !== null) {
    if (pertumbuhanPendapatan >= 5) {
      skor += 1;
      catatan.push(`pendapatan tumbuh ${pertumbuhanPendapatan.toFixed(1)}%`);
    } else if (pertumbuhanPendapatan <= -15) {
      skor -= 1;
      catatan.push(`transaksi turun tajam ${Math.abs(pertumbuhanPendapatan).toFixed(1)}%`);
    } else {
      catatan.push(`pendapatan relatif stabil (${pertumbuhanPendapatan >= 0 ? "+" : ""}${pertumbuhanPendapatan.toFixed(1)}%)`);
    }
  }

  let status: StatusCabangDashboard;
  if (laba < 0) status = skor <= -1 ? "Perlu Evaluasi" : "Perlu Dipantau";
  else if (skor >= 3) status = "Sangat Baik";
  else if (skor >= 2) status = "Baik";
  else if (skor >= 0) status = "Perlu Dipantau";
  else status = "Perlu Evaluasi";

  return { status, alasan: catatan.join(", ") };
}

export async function getDashboardDetailCabang(params: {
  startDate: Date;
  endDate: Date;
  comparisonMode: PeriodeMode;
}): Promise<DetailCabangDashboard[]> {
  const { startDate, endDate, comparisonMode } = params;
  const branches = await db.branch.findMany({ orderBy: { name: "asc" } });
  const { prevStart, prevEnd, scaleToPeriodLength } = resolveComparablePeriod(startDate, endDate, comparisonMode);

  return Promise.all(
    branches.map(async (branch) => {
      const [transaksi, biayaMap, prevTransaksi, prevBiayaMap] = await Promise.all([
        fetchTransaksiPeriode(branch.id, startDate, endDate),
        fetchBiayaByTanggalCabang(branch.id, startDate, endDate),
        fetchTransaksiPeriode(branch.id, prevStart, prevEnd),
        fetchBiayaByTanggalCabang(branch.id, prevStart, prevEnd),
      ]);

      const { pendapatan, biaya } = hitungPendapatanBiayaLaba(transaksi, biayaMap);
      const netProfit = await fetchNetProfitFinal(branch.id, enumerateMonths(startDate, endDate));
      const { laba, margin } = hitungLabaDenganNetProfit(pendapatan, biaya, netProfit.total);
      const { transfer, eWallet, tarikTunai, totalTransaksi } = hitungTransaksiBreakdown(transaksi);
      const prevFinansial = hitungPendapatanBiayaLaba(prevTransaksi, prevBiayaMap);

      let prevBaseline = prevFinansial.pendapatan;
      if (scaleToPeriodLength) {
        const hariPembanding = periodeLengthDays(prevStart, prevEnd) || 1;
        prevBaseline = (prevFinansial.pendapatan / hariPembanding) * periodeLengthDays(startDate, endDate);
      }
      const pertumbuhanPendapatan = prevBaseline > 0 ? pertumbuhanPersen(pendapatan, prevBaseline) : null;

      const hariLaporanTerinput = transaksi.length;
      const hariLibur = transaksi.filter((t) => t.status === "LIBUR").length;
      const hariOperasional = Math.max(0, periodeLengthDays(startDate, endDate) - hariLibur);
      const kelengkapanDataPersen = hariOperasional > 0 ? (hariLaporanTerinput / hariOperasional) * 100 : null;

      const { status, alasan } = tentukanStatusCabang({
        isActive: branch.isActive,
        hariLaporanTerinput,
        kelengkapanDataPersen,
        laba,
        margin,
        pertumbuhanPendapatan,
      });

      return {
        branchId: branch.id,
        branchName: branch.name,
        isActive: branch.isActive,
        pendapatan,
        biaya,
        laba,
        margin,
        totalTransaksi,
        transfer,
        eWallet,
        tarikTunai,
        pertumbuhanPendapatan,
        kelengkapanDataPersen,
        status,
        alasanStatus: alasan,
      };
    })
  );
}

function formatRupiahSingkat(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `Rp${(n / 1_000).toFixed(0)}rb`;
  return `Rp${n.toFixed(0)}`;
}

// Poin 21 spesifikasi: insight otomatis dari data aktual, bukan teks statis.
export function buatInsightDashboard(params: {
  kpi: DashboardKpi;
  komposisi: KomposisiTransaksi[];
  transaksiPerJenis: TransaksiPerJenisRow[];
  detailCabang: DetailCabangDashboard[];
  proyeksi: { pendapatan: ProyeksiSkenario[] };
}): string[] {
  const { kpi, komposisi, transaksiPerJenis, detailCabang, proyeksi } = params;
  const insight: string[] = [];

  if (kpi.pertumbuhanPendapatan.persen !== null) {
    const arah = kpi.pertumbuhanPendapatan.persen >= 0 ? "tumbuh" : "turun";
    insight.push(`Pendapatan ${arah} ${Math.abs(kpi.pertumbuhanPendapatan.persen).toFixed(1)}% dibanding ${kpi.pembandingLabel.toLowerCase()}.`);
  }

  if (komposisi.length > 0) {
    const terbesar = [...komposisi].sort((a, b) => b.jumlah - a.jumlah)[0];
    insight.push(`${terbesar.kategori} merupakan layanan terbesar dengan kontribusi ${terbesar.persen.toFixed(1)}%.`);
  }

  const naik = transaksiPerJenis.filter((r) => r.tren === "Naik").sort((a, b) => (b.pertumbuhanPersen ?? 0) - (a.pertumbuhanPersen ?? 0));
  if (naik.length > 0) {
    insight.push(`${naik[0].jenis} memiliki pertumbuhan tertinggi (${naik[0].pertumbuhanPersen!.toFixed(1)}%).`);
  }
  const turun = transaksiPerJenis.filter((r) => r.tren === "Turun");
  if (turun.length > 0) {
    insight.push(`${turun.map((t) => t.jenis).join(", ")} mengalami penurunan dibanding periode sebelumnya.`);
  }

  if (kpi.kelengkapanDataPersen !== null && kpi.kelengkapanDataPersen < 100) {
    insight.push(`Kelengkapan data baru ${kpi.kelengkapanDataPersen.toFixed(1)}%, sehingga analisis belum sepenuhnya akurat.`);
  }

  if (proyeksi.pendapatan.length === 3) {
    insight.push(
      `Proyeksi pendapatan akhir bulan berada pada rentang ${formatRupiahSingkat(proyeksi.pendapatan[0].nilai)} sampai ${formatRupiahSingkat(proyeksi.pendapatan[2].nilai)}.`
    );
  }

  const cabangAktif = detailCabang.filter((c) => c.isActive && c.margin !== null);
  if (cabangAktif.length > 0) {
    const marginTertinggi = [...cabangAktif].sort((a, b) => (b.margin ?? -Infinity) - (a.margin ?? -Infinity))[0];
    insight.push(`Cabang ${marginTertinggi.branchName} memiliki margin tertinggi (${marginTertinggi.margin!.toFixed(1)}%).`);
  }

  return insight;
}

export { rataRata };
