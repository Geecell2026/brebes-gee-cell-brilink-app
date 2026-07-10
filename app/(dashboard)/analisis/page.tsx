import {
  TrendingUp, Calendar, Clock, ArrowUpRight, Activity, ArrowUp, ArrowDown, Target, Gauge, LineChart as LineChartIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/calculations/settings";
import { buildAnalisisData } from "@/lib/analytics/build-analisis-data";
import { resolveDateRange } from "@/lib/analytics/resolve-date-range";
import { buildTrendChartData } from "@/lib/analytics/chart-helpers";
import { FilterBar } from "@/components/analisis/filter-bar";
import { KpiCard } from "@/components/analisis/kpi-card";
import { TrendChart } from "@/components/analisis/trend-chart";

function formatAngka(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
}

const STATUS_STYLE: Record<string, string> = {
  "Sangat Baik": "bg-green-100 text-green-700",
  Baik: "bg-blue-100 text-blue-700",
  "Perlu Dipantau": "bg-amber-100 text-amber-700",
  "Perlu Evaluasi": "bg-red-100 text-red-700",
};

export default async function AnalisisRingkasanPage({
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

  if (data.points.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-neutral-900">Analisis Transaksi — Ringkasan Owner</h1>
        <FilterBar branches={branches} branchId={params.branchId} startDate={startDateStr} endDate={endDateStr} hari={hariFilter} action="/analisis" />
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-400">
          Belum ada data transaksi untuk periode/filter ini.
        </p>
      </div>
    );
  }

  const hariBuka = data.points.filter((p) => p.status === "BUKA");
  const rataRataHariBuka = hariBuka.length > 0 ? hariBuka.reduce((s, p) => s + p.totalTransaksi, 0) / hariBuka.length : 0;
  const transaksiHariTerakhir = data.points[data.points.length - 1];
  const rata7Hari = data.ma7[data.ma7.length - 1];
  const tertinggi = [...data.points].sort((a, b) => b.totalTransaksi - a.totalTransaksi)[0];
  const terendah = [...data.points].sort((a, b) => a.totalTransaksi - b.totalTransaksi)[0];
  const proyeksiRataRata =
    data.proyeksiAkhirBulan.length > 0
      ? data.proyeksiAkhirBulan.reduce((s, p) => s + p.proyeksi, 0) / data.proyeksiAkhirBulan.length
      : null;

  const chartData = buildTrendChartData(data.points, data.ma7, settings.targetTransaksiHarian);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Analisis Transaksi — Ringkasan Owner</h1>
        <p className="text-sm text-neutral-500">
          Perkembangan toko, pola transaksi, dan proyeksi periode berikutnya
        </p>
      </div>

      <FilterBar branches={branches} branchId={params.branchId} startDate={startDateStr} endDate={endDateStr} hari={hariFilter} action="/analisis" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Transaksi Periode Ini" value={formatAngka(data.stats.total)} icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600" perubahanPersen={data.pertumbuhanPeriode} />
        <KpiCard label="Rata-rata / Hari Buka" value={formatAngka(rataRataHariBuka)} icon={Calendar} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <KpiCard label="Transaksi Hari Terakhir" value={formatAngka(transaksiHariTerakhir.totalTransaksi)} icon={Clock} iconBg="bg-neutral-100" iconColor="text-neutral-600" keterangan={transaksiHariTerakhir.date.toLocaleDateString("id-ID")} />
        <KpiCard label="Rata-rata 7 Hari Terakhir" value={rata7Hari !== null ? formatAngka(rata7Hari) : "-"} icon={Activity} iconBg="bg-indigo-50" iconColor="text-indigo-600" />
        <KpiCard label="Hari Transaksi Tertinggi" value={formatAngka(tertinggi.totalTransaksi)} icon={ArrowUp} iconBg="bg-green-50" iconColor="text-green-600" keterangan={tertinggi.date.toLocaleDateString("id-ID")} />
        <KpiCard label="Hari Transaksi Terendah" value={formatAngka(terendah.totalTransaksi)} icon={ArrowDown} iconBg="bg-red-50" iconColor="text-red-600" keterangan={terendah.date.toLocaleDateString("id-ID")} />
        <KpiCard label="Proyeksi Akhir Bulan" value={proyeksiRataRata !== null ? formatAngka(proyeksiRataRata) : "-"} icon={ArrowUpRight} iconBg="bg-amber-50" iconColor="text-amber-600" keterangan="rata-rata 3 pendekatan" />
        <KpiCard
          label="Pencapaian Target"
          value={data.persenPencapaianTarget !== null ? `${data.persenPencapaianTarget.toFixed(2)}%` : "Belum diset"}
          icon={Target}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
        />
        <KpiCard label="Tingkat Kestabilan" value={data.stabilitas} icon={Gauge} iconBg="bg-violet-50" iconColor="text-violet-600" keterangan={`CV ${data.stats.koefisienVariasi.toFixed(2)}%`} />
        <KpiCard label="Median Transaksi" value={formatAngka(data.stats.median)} icon={LineChartIcon} iconBg="bg-sky-50" iconColor="text-sky-600" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Tren Transaksi Harian (dengan Forecast 7 Hari)</h2>
        <TrendChart data={chartData} />
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
        <p className="mt-3 text-xs text-neutral-400">
          Catatan: data historis masih terbatas (kurang dari 3 bulan), proyeksi ini indikasi awal - bukan angka pasti.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Insight Otomatis</h2>
          {data.insight.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum cukup data untuk menghasilkan insight.</p>
          ) : (
            <ul className="space-y-2">
              {data.insight.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-700">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Status Performa Toko</h2>
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLE[data.performa.status]}`}>
            {data.performa.status}
          </span>
          <ul className="mt-3 space-y-1.5">
            {data.performa.alasan.map((a, i) => (
              <li key={i} className="text-sm text-neutral-600">
                • {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
