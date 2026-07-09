import {
  getKpiSummary,
  getTrendOmsetBulanan,
  getDetailPerCabang,
  type StatusCabang,
} from "@/lib/calculations/dashboard";
import { TrendOmsetChart } from "@/components/trend-omset-chart";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const STATUS_BADGE: Record<StatusCabang, string> = {
  "Sangat Baik": "bg-green-100 text-green-700",
  Baik: "bg-blue-100 text-blue-700",
  "Perlu Perhatian": "bg-amber-100 text-amber-700",
  Rendah: "bg-red-100 text-red-700",
};

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [kpi, trend, detailCabang] = await Promise.all([
    getKpiSummary(year, month),
    getTrendOmsetBulanan(6),
    getDetailPerCabang(year, month),
  ]);

  const kpiCards = [
    { label: "Total Cabang", value: kpi.totalCabang },
    { label: "Omset Bulan Ini", value: formatRupiah(kpi.omsetBulanIni) },
    { label: "Total Biaya Bulan Ini", value: formatRupiah(kpi.totalBiayaBulanIni) },
    { label: "Total Transaksi Bulan Ini", value: kpi.totalTransaksi },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Rekap omset &amp; operasional Wilayah Brebes</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Trend Omset 6 Bulan Terakhir</h2>
        <TrendOmsetChart data={trend} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Detail Per Cabang (Bulan Ini)</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="py-2">Cabang</th>
              <th className="py-2 text-right">Omset</th>
              <th className="py-2 text-right">Transaksi</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {detailCabang.map((row) => (
              <tr key={row.branchId} className="border-b border-neutral-100 last:border-0">
                <td className="py-2">{row.branchName}</td>
                <td className="py-2 text-right">{formatRupiah(row.omset)}</td>
                <td className="py-2 text-right">{row.transaksi}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_BADGE[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
