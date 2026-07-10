import type { ForecastHasil, ForecastRange, ProyeksiAkhirBulan } from "@/types/analytics";
import { koefisienVariasi, rataRata, regresiLinear } from "@/lib/analytics/statistics";

// Rentang estimasi dilebarkan mengikuti volatilitas data (koefisien variasi),
// supaya toko yang datanya masih fluktuatif dapat rentang lebih lebar - bukan
// angka pasti. Poin 8 spesifikasi: forecast tidak boleh ditampilkan seolah pasti.
function buatRange(utama: number, cvPersen: number): ForecastRange {
  const margin = Math.min(Math.max(cvPersen / 100, 0.1), 0.35);
  return {
    bawah: Math.max(0, Math.round(utama * (1 - margin))),
    utama: Math.round(utama),
    atas: Math.round(utama * (1 + margin)),
  };
}

// Metode 1: rata-rata 7 hari terakhir.
function forecastRataRata7Hari(values: number[]): ForecastHasil {
  const last7 = values.slice(-7);
  const dailyAvg = rataRata(last7);
  const cv = koefisienVariasi(last7);
  return {
    metode: "Rata-rata 7 Hari",
    besok: buatRange(dailyAvg, cv),
    tujuhHari: buatRange(dailyAvg * 7, cv),
    empatBelasHari: buatRange(dailyAvg * 14, cv),
  };
}

// Metode 2: weighted moving average - 3 hari terakhir berbobot lebih besar.
function forecastWeightedMovingAverage(values: number[]): ForecastHasil {
  const last7 = values.slice(-7);
  const bobot = [0.5, 0.5, 0.5, 0.5, 1, 1.5, 2].slice(-last7.length);
  const totalBobot = bobot.reduce((s, w) => s + w, 0);
  const dailyAvg = last7.reduce((sum, v, i) => sum + v * bobot[i], 0) / (totalBobot || 1);
  const cv = koefisienVariasi(last7);
  return {
    metode: "Weighted Moving Average",
    besok: buatRange(dailyAvg, cv),
    tujuhHari: buatRange(dailyAvg * 7, cv),
    empatBelasHari: buatRange(dailyAvg * 14, cv),
  };
}

// Metode 3: tren linear (regresi sederhana atas seluruh data yang tersedia).
function forecastTrenLinear(values: number[]): ForecastHasil {
  const { slope, intercept } = regresiLinear(values);
  const n = values.length;
  const cv = koefisienVariasi(values.slice(-14));

  const prediksi = (index: number) => Math.max(0, slope * index + intercept);
  const besok = prediksi(n);
  let tujuh = 0;
  for (let i = n; i < n + 7; i++) tujuh += prediksi(i);
  let empatBelas = 0;
  for (let i = n; i < n + 14; i++) empatBelas += prediksi(i);

  return {
    metode: "Tren Linear",
    besok: buatRange(besok, cv),
    tujuhHari: buatRange(tujuh, cv),
    empatBelasHari: buatRange(empatBelas, cv),
  };
}

export function hitungForecast(values: number[]): ForecastHasil[] {
  if (values.length === 0) return [];
  return [
    forecastRataRata7Hari(values),
    forecastWeightedMovingAverage(values),
    forecastTrenLinear(values),
  ];
}

// Poin 9 spesifikasi: tiga pendekatan proyeksi akhir bulan.
export function hitungProyeksiAkhirBulan(
  values: number[],
  hariSudahBerjalan: number,
  totalHariOperasionalBulan: number
): ProyeksiAkhirBulan[] {
  const totalSekarang = values.reduce((sum, v) => sum + v, 0);
  const sisaHari = Math.max(0, totalHariOperasionalBulan - hariSudahBerjalan);

  const rataHarian = rataRata(values);
  const proyeksiRataHarian = totalSekarang + rataHarian * sisaHari;

  const last7Avg = rataRata(values.slice(-7));
  const proyeksi7Hari = totalSekarang + last7Avg * sisaHari;

  const { slope, intercept } = regresiLinear(values);
  let proyeksiTren = totalSekarang;
  for (let i = values.length; i < values.length + sisaHari; i++) {
    proyeksiTren += Math.max(0, slope * i + intercept);
  }

  return [
    { pendekatan: "Rata-rata Harian", proyeksi: Math.round(proyeksiRataHarian) },
    { pendekatan: "Rata-rata 7 Hari Terakhir", proyeksi: Math.round(proyeksi7Hari) },
    { pendekatan: "Tren Linear", proyeksi: Math.round(proyeksiTren) },
  ];
}

// Poin 8 spesifikasi: estimasi bulan berikutnya (dari rata-rata 3 proyeksi akhir
// bulan sebagai dasar, disesuaikan proporsi jumlah hari operasional).
export function estimasiBulanBerikutnya(
  proyeksiBulanIni: ProyeksiAkhirBulan[],
  hariOperasionalBulanIni: number,
  hariOperasionalBulanDepan: number
): ForecastRange {
  const rataProyeksi = rataRata(proyeksiBulanIni.map((p) => p.proyeksi));
  const rataHarian = hariOperasionalBulanIni > 0 ? rataProyeksi / hariOperasionalBulanIni : 0;
  const utama = rataHarian * hariOperasionalBulanDepan;
  return buatRange(utama, 20); // margin tetap 20% - data historis masih terbatas (<3 bulan)
}
