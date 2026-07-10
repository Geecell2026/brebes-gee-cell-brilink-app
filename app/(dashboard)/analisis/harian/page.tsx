import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/calculations/settings";
import { buildAnalisisData } from "@/lib/analytics/build-analisis-data";
import { resolveDateRange } from "@/lib/analytics/resolve-date-range";
import { buildTrendChartData } from "@/lib/analytics/chart-helpers";
import { FilterBar } from "@/components/analisis/filter-bar";
import { TrendChart } from "@/components/analisis/trend-chart";
import { DailyTable } from "@/components/analisis/daily-table";
import { AnomalyTable } from "@/components/analisis/anomaly-table";

function formatAngka(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
}

export default async function AnalisisHarianPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; startDate?: string; endDate?: string; hari?: string | string[] }>;
}) {
  const params = await searchParams;
  const [branches, settings] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getAppSettings(),
  ]);

  const hariFilter = params.hari ? (Array.isArray(params.hari) ? params.hari : [params.hari]) : undefined;
  const { startDate, endDate, startDateStr, endDateStr } = resolveDateRange(params);

  const data = await buildAnalisisData(
    { branchId: params.branchId, startDate, endDate, hariFilter },
    settings.targetTransaksiHarian
  );

  const chartData = buildTrendChartData(data.points, data.ma7, settings.targetTransaksiHarian, 0);
  const tertinggi = data.points.length > 0 ? [...data.points].sort((a, b) => b.totalTransaksi - a.totalTransaksi)[0] : null;
  const terendah = data.points.length > 0 ? [...data.points].sort((a, b) => a.totalTransaksi - b.totalTransaksi)[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Analisis Harian</h1>
        <p className="text-sm text-neutral-500">Detail transaksi per hari, moving average, dan anomali</p>
      </div>

      <FilterBar branches={branches} branchId={params.branchId} startDate={startDateStr} endDate={endDateStr} hari={hariFilter} action="/analisis/harian" />

      {data.points.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
          Belum ada data untuk periode/filter ini.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">Rata-rata Harian</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatAngka(data.stats.rataRata)}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">Median</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatAngka(data.stats.median)}</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">Hari Terbaik</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-green-700">
                {tertinggi ? `${tertinggi.totalTransaksi} (${tertinggi.date.toLocaleDateString("id-ID")})` : "-"}
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4">
              <p className="text-xs text-neutral-500">Hari Terburuk</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-red-700">
                {terendah ? `${terendah.totalTransaksi} (${terendah.date.toLocaleDateString("id-ID")})` : "-"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Grafik Transaksi per Hari + Moving Average</h2>
            <TrendChart data={chartData} />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Tabel Harian</h2>
            <DailyTable data={data.points} />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Deteksi Anomali</h2>
            <AnomalyTable data={data.anomali} />
          </div>
        </>
      )}
    </div>
  );
}
