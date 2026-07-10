import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/calculations/settings";
import { buildAnalisisData } from "@/lib/analytics/build-analisis-data";
import { resolveDateRange } from "@/lib/analytics/resolve-date-range";
import { FilterBar } from "@/components/analisis/filter-bar";
import { WeeklyChart } from "@/components/analisis/weekly-chart";
import { DowChart } from "@/components/analisis/dow-chart";
import { CalendarHeatmap } from "@/components/analisis/calendar-heatmap";
import { MonthCompare } from "@/components/analisis/month-compare";

function formatAngka(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
}

export default async function AnalisisMingguanBulananPage({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Analisis Mingguan &amp; Bulanan</h1>
        <p className="text-sm text-neutral-500">Pertumbuhan mingguan, bulanan, dan pola transaksi</p>
      </div>

      <FilterBar branches={branches} branchId={params.branchId} startDate={startDateStr} endDate={endDateStr} hari={hariFilter} action="/analisis/mingguan-bulanan" />

      {data.points.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
          Belum ada data untuk periode/filter ini.
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Transaksi Mingguan</h2>
            <WeeklyChart data={data.mingguan} />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="py-2">Minggu</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Rata-rata/Hari</th>
                    <th className="py-2 text-right">Pertumbuhan WoW</th>
                  </tr>
                </thead>
                <tbody>
                  {data.mingguan.map((m) => (
                    <tr key={m.label} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2">{m.label}</td>
                      <td className="py-2 text-right tabular-nums">{formatAngka(m.total)}</td>
                      <td className="py-2 text-right tabular-nums">{formatAngka(m.rataRataPerHari)}</td>
                      <td className={`py-2 text-right tabular-nums ${m.pertumbuhanPersen === null ? "text-neutral-400" : m.pertumbuhanPersen >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {m.pertumbuhanPersen === null ? "-" : `${m.pertumbuhanPersen >= 0 ? "+" : ""}${m.pertumbuhanPersen.toFixed(2)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Transaksi Bulanan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="py-2">Bulan</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Rata-rata Harian</th>
                    <th className="py-2 text-right">Hari Buka</th>
                    <th className="py-2 text-right">Pertumbuhan MoM</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bulanan.map((b) => (
                    <tr key={b.label} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2">{b.label}</td>
                      <td className="py-2 text-right tabular-nums">{formatAngka(b.total)}</td>
                      <td className="py-2 text-right tabular-nums">{formatAngka(b.rataRataHarian)}</td>
                      <td className="py-2 text-right tabular-nums">{b.hariBuka}</td>
                      <td className={`py-2 text-right tabular-nums ${b.pertumbuhanPersen === null ? "text-neutral-400" : b.pertumbuhanPersen >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {b.pertumbuhanPersen === null ? "-" : `${b.pertumbuhanPersen >= 0 ? "+" : ""}${b.pertumbuhanPersen.toFixed(2)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Perbandingan Bulan Pertama vs Kedua</h2>
            <MonthCompare bulanan={data.bulanan} />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Pola Transaksi per Hari</h2>
            <DowChart data={data.polaHari} />
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Kalender Aktivitas Transaksi</h2>
            <CalendarHeatmap points={data.points} />
          </div>
        </>
      )}
    </div>
  );
}
