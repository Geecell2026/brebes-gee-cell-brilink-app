import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/calculations/settings";
import { buildAnalisisData } from "@/lib/analytics/build-analisis-data";
import { resolveDateRange } from "@/lib/analytics/resolve-date-range";
import { FilterBar } from "@/components/analisis/filter-bar";
import type { ForecastRange } from "@/types/analytics";

function formatAngka(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}
function formatRange(r: ForecastRange): string {
  return `${formatAngka(r.bawah)}–${formatAngka(r.atas)} (utama: ${formatAngka(r.utama)})`;
}

export default async function AnalisisForecastPage({
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
        <h1 className="text-xl font-semibold text-neutral-900">Forecast</h1>
        <p className="text-sm text-neutral-500">
          Perkiraan transaksi ke depan — data historis masih terbatas, forecast hanya indikasi awal, bukan angka pasti.
        </p>
      </div>

      <FilterBar branches={branches} branchId={params.branchId} startDate={startDateStr} endDate={endDateStr} hari={hariFilter} action="/analisis/forecast" />

      {data.forecast.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
          Belum cukup data untuk membuat forecast.
        </p>
      ) : (
        <>
          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Perbandingan Metode Forecast</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="py-2">Metode</th>
                    <th className="py-2 text-right">Besok</th>
                    <th className="py-2 text-right">7 Hari</th>
                    <th className="py-2 text-right">14 Hari</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forecast.map((f) => (
                    <tr key={f.metode} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2 font-medium text-neutral-800">{f.metode}</td>
                      <td className="py-2 text-right tabular-nums">{formatRange(f.besok)}</td>
                      <td className="py-2 text-right tabular-nums">{formatRange(f.tujuhHari)}</td>
                      <td className="py-2 text-right tabular-nums">{formatRange(f.empatBelasHari)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Proyeksi Akhir Bulan Ini</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {data.proyeksiAkhirBulan.map((p) => (
                <div key={p.pendekatan} className="rounded-md border border-neutral-100 p-3">
                  <p className="text-xs text-neutral-500">{p.pendekatan}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">{formatAngka(p.proyeksi)}</p>
                </div>
              ))}
            </div>
            {data.proyeksiAkhirBulan.length > 0 && (
              <p className="mt-3 text-xs text-neutral-500">
                Kesimpulan: pendekatan <strong>Rata-rata 7 Hari Terakhir</strong> paling{" "}
                {data.proyeksiAkhirBulan[1]?.proyeksi >= data.proyeksiAkhirBulan[0]?.proyeksi ? "optimistis" : "konservatif"}
                {" "}dibanding rata-rata harian keseluruhan; gunakan angka tengah sebagai acuan realistis.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-neutral-800">Estimasi Bulan Berikutnya</h2>
            {data.estimasiBulanDepan ? (
              <p className="text-lg font-semibold tabular-nums text-neutral-900">
                {formatAngka(data.estimasiBulanDepan.bawah)}–{formatAngka(data.estimasiBulanDepan.atas)} transaksi
              </p>
            ) : (
              <p className="text-sm text-neutral-400">Belum cukup data untuk estimasi bulan berikutnya.</p>
            )}
            <p className="mt-2 text-xs text-neutral-400">
              Data historis baru sekitar 2 bulan — estimasi ini indikasi awal, bukan target pasti.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
