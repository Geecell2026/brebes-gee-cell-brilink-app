import { Store, TrendingUp, Wallet, Receipt, ArrowUp, ArrowDown } from "lucide-react";
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
    { label: "Total Cabang", value: String(kpi.totalCabang), icon: Store, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    {
      label: "Omset Bulan Ini",
      value: formatRupiah(kpi.omsetBulanIni),
      icon: TrendingUp,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      perubahan: kpi.omsetPerubahanPersen,
    },
    { label: "Total Biaya Bulan Ini", value: formatRupiah(kpi.totalBiayaBulanIni), icon: Wallet, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Total Transaksi Bulan Ini", value: String(kpi.totalTransaksi), icon: Receipt, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Rekap omset &amp; operasional Wilayah Brebes</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <p className="text-xs text-neutral-500">{card.label}</p>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} strokeWidth={2} />
                </div>
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">{card.value}</p>
              {card.perubahan !== undefined && card.perubahan !== null && (
                <p
                  className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${
                    card.perubahan >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {card.perubahan >= 0 ? (
                    <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
                  )}
                  {Math.abs(card.perubahan).toFixed(1)}% vs bulan lalu
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Trend Omset 6 Bulan Terakhir</h2>
        <TrendOmsetChart data={trend} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Detail Per Cabang (Bulan Ini)</h2>
        <div className="overflow-x-auto">
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
              {detailCabang.map((row, i) => (
                <tr key={row.branchId} className={i % 2 === 1 ? "bg-neutral-50" : undefined}>
                  <td className="py-2 px-2">{row.branchName}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatRupiah(row.omset)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{row.transaksi}</td>
                  <td className="py-2 px-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
