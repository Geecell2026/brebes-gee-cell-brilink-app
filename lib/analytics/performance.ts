import type { BulanAgregat, DailyPoint, StatistikDeskriptif, StatusPerforma } from "@/types/analytics";
import { movingAverage } from "./statistics";

// Poin 12 spesifikasi: penilaian performa awal toko dari 5 faktor sederhana
// (skor 0-2 tiap faktor, dijumlah lalu dipetakan ke status).
export function nilaiPerforma(params: {
  bulanan: BulanAgregat[];
  stats: StatistikDeskriptif;
  points: DailyPoint[];
  persenPencapaianTarget: number | null;
}): { status: StatusPerforma; alasan: string[] } {
  const { bulanan, stats, points, persenPencapaianTarget } = params;
  const alasan: string[] = [];
  let skor = 0;

  const bulanTerakhir = bulanan[bulanan.length - 1];
  if (bulanTerakhir?.pertumbuhanPersen !== null && bulanTerakhir?.pertumbuhanPersen !== undefined) {
    if (bulanTerakhir.pertumbuhanPersen >= 10) {
      skor += 2;
      alasan.push(`Transaksi tumbuh ${bulanTerakhir.pertumbuhanPersen.toFixed(1)}% dibanding bulan sebelumnya.`);
    } else if (bulanTerakhir.pertumbuhanPersen >= 0) {
      skor += 1;
      alasan.push(`Transaksi tumbuh tipis (${bulanTerakhir.pertumbuhanPersen.toFixed(1)}%) dibanding bulan sebelumnya.`);
    } else {
      alasan.push(`Transaksi turun ${Math.abs(bulanTerakhir.pertumbuhanPersen).toFixed(1)}% dibanding bulan sebelumnya.`);
    }
  }

  if (stats.koefisienVariasi < 20) {
    skor += 2;
    alasan.push("Volume transaksi tergolong stabil.");
  } else if (stats.koefisienVariasi < 35) {
    skor += 1;
    alasan.push("Volume transaksi masih cukup fluktuatif.");
  } else {
    alasan.push("Volume transaksi sangat fluktuatif.");
  }

  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const values = sorted.map((p) => p.totalTransaksi);
  if (values.length >= 15) {
    const ma7 = movingAverage(values, 7).filter((v): v is number => v !== null);
    if (ma7.length >= 8) {
      const trenNaik = ma7[ma7.length - 1] > ma7[ma7.length - 8];
      if (trenNaik) {
        skor += 2;
        alasan.push("Tren 14 hari terakhir masih positif.");
      } else {
        alasan.push("Tren 14 hari terakhir cenderung melambat.");
      }
    }
  }

  if (persenPencapaianTarget !== null) {
    if (persenPencapaianTarget >= 100) {
      skor += 2;
      alasan.push(`Target tercapai (${persenPencapaianTarget.toFixed(1)}%).`);
    } else if (persenPencapaianTarget >= 80) {
      skor += 1;
      alasan.push(`Pencapaian target mendekati 100% (${persenPencapaianTarget.toFixed(1)}%).`);
    } else {
      alasan.push(`Pencapaian target masih di bawah 80% (${persenPencapaianTarget.toFixed(1)}%).`);
    }
  }

  const skorMaks = persenPencapaianTarget !== null ? 8 : 6;
  const rasio = skor / skorMaks;
  let status: StatusPerforma;
  if (rasio >= 0.75) status = "Sangat Baik";
  else if (rasio >= 0.5) status = "Baik";
  else if (rasio >= 0.25) status = "Perlu Dipantau";
  else status = "Perlu Evaluasi";

  return { status, alasan };
}
