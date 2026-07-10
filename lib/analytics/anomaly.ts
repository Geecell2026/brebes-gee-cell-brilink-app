import type { Anomali, DailyPoint, JenisAnomali } from "@/types/analytics";
import { rataRata, standarDeviasi } from "./statistics";

// Poin 11 spesifikasi. Penyebab ditampilkan sebagai saran (bukan fakta) karena
// tidak ada data pendukung lain (jaringan, sistem, dll) yang bisa dicek otomatis.
function saranPenyebab(jenis: JenisAnomali, point: DailyPoint): string[] {
  if (jenis === "Tidak Ada Data") {
    return ["input data belum lengkap", "toko tutup"];
  }
  if (jenis.startsWith("Sangat Rendah") || jenis.startsWith("Penurunan")) {
    const saran = ["toko tutup", "gangguan jaringan", "gangguan sistem", "input data belum lengkap"];
    if (point.hariKerjaLibur === "AKHIR_PEKAN") saran.push("hari libur");
    return saran;
  }
  return ["lonjakan aktivitas nasabah", "kegiatan promosi"];
}

export function deteksiAnomali(points: DailyPoint[]): Anomali[] {
  if (points.length < 3) return [];
  const values = points.map((p) => p.totalTransaksi);
  const avg = rataRata(values);
  const sd = standarDeviasi(values);
  const anomali: Anomali[] = [];

  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const prev = i > 0 ? sorted[i - 1] : null;
    let jenis: JenisAnomali | null = null;

    if (p.totalTransaksi < avg - 2 * sd) {
      jenis = "Sangat Rendah (di bawah rata-rata - 2SD)";
    } else if (p.totalTransaksi > avg + 2 * sd) {
      jenis = "Sangat Tinggi (di atas rata-rata + 2SD)";
    } else if (prev && prev.totalTransaksi > 0) {
      const perubahan = (p.totalTransaksi - prev.totalTransaksi) / prev.totalTransaksi;
      if (perubahan <= -0.4) jenis = "Penurunan Drastis (>40% vs hari sebelumnya)";
      else if (perubahan >= 0.5) jenis = "Kenaikan Drastis (>50% vs hari sebelumnya)";
    }

    if (jenis) {
      anomali.push({
        date: p.date,
        branchName: p.branchName,
        totalTransaksi: p.totalTransaksi,
        jenis,
        kemungkinanPenyebab: saranPenyebab(jenis, p),
      });
    }
  }
  return anomali;
}
