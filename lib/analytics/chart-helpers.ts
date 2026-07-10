import type { DailyPoint } from "@/types/analytics";
import type { TrendChartPoint } from "@/components/analisis/trend-chart";
import { regresiLinear } from "./statistics";

function formatTanggalSingkat(d: Date): string {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", timeZone: "UTC" });
}

// Gabungkan data aktual + rata-rata 7 hari + target + forecast (7 hari ke depan)
// jadi satu deret untuk grafik tren harian (poin 6A spesifikasi).
export function buildTrendChartData(
  points: DailyPoint[],
  ma7: (number | null)[],
  targetHarian: number | null,
  jumlahHariForecast = 7
): TrendChartPoint[] {
  const actualSeries: TrendChartPoint[] = points.map((p, i) => ({
    tanggal: formatTanggalSingkat(p.date),
    namaHari: p.namaHari,
    aktual: p.totalTransaksi,
    ma7: ma7[i],
    target: targetHarian,
    forecast: null,
  }));

  if (points.length < 3) return actualSeries;

  const values = points.map((p) => p.totalTransaksi);
  const { slope, intercept } = regresiLinear(values);
  const lastDate = points[points.length - 1].date;

  const forecastSeries: TrendChartPoint[] = [];
  for (let i = 1; i <= jumlahHariForecast; i++) {
    const idx = points.length - 1 + i;
    const forecastValue = Math.max(0, slope * idx + intercept);
    const date = new Date(lastDate);
    date.setUTCDate(date.getUTCDate() + i);
    forecastSeries.push({
      tanggal: formatTanggalSingkat(date),
      namaHari: date.toLocaleDateString("id-ID", { weekday: "long", timeZone: "UTC" }),
      aktual: null,
      ma7: null,
      target: targetHarian,
      forecast: Math.round(forecastValue),
    });
  }

  // Sambungkan garis forecast dengan titik aktual terakhir supaya tidak putus.
  if (actualSeries.length > 0) {
    actualSeries[actualSeries.length - 1].forecast = actualSeries[actualSeries.length - 1].aktual;
  }

  return [...actualSeries, ...forecastSeries];
}
