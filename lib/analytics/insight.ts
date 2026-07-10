import type {
  BulanAgregat,
  DailyPoint,
  ForecastRange,
  MingguAgregat,
  PolaHari,
  StatistikDeskriptif,
} from "@/types/analytics";
import { klasifikasiStabilitas, movingAverage } from "./statistics";

function formatAngka(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}
function formatPersen(n: number): string {
  return n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// Poin 10 spesifikasi: insight otomatis dalam Bahasa Indonesia, menyesuaikan data
// aktual (bukan teks statis) - tiap kalimat hanya muncul jika datanya relevan/ada.
export function buatInsightOtomatis(params: {
  points: DailyPoint[];
  bulanan: BulanAgregat[];
  mingguan: MingguAgregat[];
  polaHari: PolaHari[];
  stats: StatistikDeskriptif;
  estimasiBulanDepan: ForecastRange | null;
}): string[] {
  const { points, bulanan, mingguan, polaHari, stats, estimasiBulanDepan } = params;
  const insight: string[] = [];

  if (bulanan.length >= 2) {
    const bulanKedua = bulanan[bulanan.length - 1];
    if (bulanKedua.pertumbuhanPersen !== null) {
      const arah = bulanKedua.pertumbuhanPersen >= 0 ? "tumbuh" : "turun";
      insight.push(
        `Transaksi ${bulanKedua.label} ${arah} ${formatPersen(Math.abs(bulanKedua.pertumbuhanPersen))}% dibanding bulan sebelumnya.`
      );
    }
  }

  const hariRamai = polaHari.filter((h) => h.jumlahSampel > 0).sort((a, b) => b.rataRata - a.rataRata)[0];
  if (hariRamai) {
    insight.push(`Rata-rata transaksi tertinggi terjadi pada hari ${hariRamai.namaHari}.`);
  }

  if (points.length >= 14) {
    const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
    const values = sorted.map((p) => p.totalTransaksi);
    const ma7 = movingAverage(values, 7).filter((v): v is number => v !== null);
    if (ma7.length >= 8) {
      const arah = ma7[ma7.length - 1] > ma7[ma7.length - 8] ? "meningkat" : "menurun";
      insight.push(`Transaksi dalam 14 hari terakhir menunjukkan tren ${arah}.`);
    }
  }

  if (mingguan.length > 0) {
    const terbaik = [...mingguan].sort((a, b) => b.total - a.total)[0];
    insight.push(`${terbaik.label.split(" (")[0]} merupakan minggu terbaik dengan ${formatAngka(terbaik.total)} transaksi.`);
  }

  const level = klasifikasiStabilitas(stats.koefisienVariasi);
  if (level === "Cukup Fluktuatif" || level === "Sangat Fluktuatif") {
    insight.push(
      `Volume transaksi masih ${level.toLowerCase()} dengan koefisien variasi ${formatPersen(stats.koefisienVariasi)}%.`
    );
  }

  if (estimasiBulanDepan) {
    insight.push(
      `Jika tren berlanjut, transaksi bulan berikutnya diperkirakan mencapai ${formatAngka(estimasiBulanDepan.bawah)}–${formatAngka(estimasiBulanDepan.atas)} transaksi.`
    );
  }

  return insight;
}
