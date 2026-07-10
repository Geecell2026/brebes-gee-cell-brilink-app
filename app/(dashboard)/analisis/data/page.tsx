import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/calculations/settings";
import { buildAnalisisData } from "@/lib/analytics/build-analisis-data";
import { resolveDateRange } from "@/lib/analytics/resolve-date-range";
import { validasiKualitasData } from "@/lib/validation/data-quality";
import { FilterBar } from "@/components/analisis/filter-bar";
import { DailyTable } from "@/components/analisis/daily-table";
import { DownloadCsvButton } from "@/components/analisis/download-csv-button";

export default async function AnalisisDataPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; startDate?: string; endDate?: string; hari?: string | string[] }>;
}) {
  const params = await searchParams;
  const [branches, settings, allBranchNames] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getAppSettings(),
    db.branch.findMany({ select: { name: true } }),
  ]);

  const hariFilter = params.hari ? (Array.isArray(params.hari) ? params.hari : [params.hari]) : undefined;
  const { startDate, endDate, startDateStr, endDateStr } = resolveDateRange(params);

  const data = await buildAnalisisData(
    { branchId: params.branchId, startDate, endDate, hariFilter },
    settings.targetTransaksiHarian
  );

  const validasi = validasiKualitasData(data.points, allBranchNames.map((b) => b.name));
  const csvRows = data.points.map((p) => ({
    tanggal: p.date.toISOString().slice(0, 10),
    cabang: p.branchName,
    namaHari: p.namaHari,
    status: p.status,
    totalTransaksi: p.totalTransaksi,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Data &amp; Validasi</h1>
        <p className="text-sm text-neutral-500">
          Data ini bersumber langsung dari Transaksi Harian yang sudah diinput — bukan dari upload file terpisah.
        </p>
      </div>

      <FilterBar branches={branches} branchId={params.branchId} startDate={startDateStr} endDate={endDateStr} hari={hariFilter} action="/analisis/data" />

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Ringkasan Validasi</h2>
        <ul className="space-y-2">
          {validasi.map((v, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                  v.level === "warning" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                }`}
              >
                {v.jenis}
              </span>
              <span className="text-neutral-600">{v.detail}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">Preview Data ({data.points.length} baris)</h2>
          <DownloadCsvButton rows={csvRows} filename="data-transaksi-bersih.csv" />
        </div>
        <DailyTable data={data.points} />
      </div>
    </div>
  );
}
