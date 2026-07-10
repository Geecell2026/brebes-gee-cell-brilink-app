import type { StabilitasLevel, StatistikDeskriptif } from "@/types/analytics";

export function rataRata(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function standarDeviasi(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = rataRata(values);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function koefisienVariasi(values: number[]): number {
  const avg = rataRata(values);
  if (avg === 0) return 0;
  return (standarDeviasi(values) / avg) * 100;
}

export function hitungStatistikDeskriptif(values: number[]): StatistikDeskriptif {
  return {
    total: values.reduce((sum, v) => sum + v, 0),
    rataRata: rataRata(values),
    median: median(values),
    maksimum: values.length > 0 ? Math.max(...values) : 0,
    minimum: values.length > 0 ? Math.min(...values) : 0,
    standarDeviasi: standarDeviasi(values),
    koefisienVariasi: koefisienVariasi(values),
    jumlahHari: values.length,
  };
}

// Klasifikasi sesuai spesifikasi: <10% sangat stabil, 10-20% stabil, 20-35% cukup fluktuatif, >35% sangat fluktuatif.
export function klasifikasiStabilitas(cv: number): StabilitasLevel {
  if (cv < 10) return "Sangat Stabil";
  if (cv < 20) return "Stabil";
  if (cv < 35) return "Cukup Fluktuatif";
  return "Sangat Fluktuatif";
}

// Moving average sederhana, dihitung mundur dari index array (bukan tanggal kalender),
// jadi array input harus sudah terurut tanggal ascending tanpa gap yang signifikan.
export function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    const slice = values.slice(i - window + 1, i + 1);
    return rataRata(slice);
  });
}

export function pertumbuhanPersen(sekarang: number, sebelumnya: number): number | null {
  if (sebelumnya === 0) return null;
  return ((sekarang - sebelumnya) / sebelumnya) * 100;
}

// Regresi linear sederhana (least squares) - x = 0,1,2,... berdasarkan urutan hari.
export function regresiLinear(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const xs = values.map((_, i) => i);
  const xMean = rataRata(xs);
  const yMean = rataRata(values);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (values[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}
