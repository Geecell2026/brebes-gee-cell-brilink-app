import { db } from "@/lib/db";
import { getTotalTransaksiTrend, getTotalTransaksiDetail } from "@/lib/calculations/total-transaksi";
import { TrendTransaksiChart } from "@/components/trend-transaksi-chart";

export default async function TotalTransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; bulan?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const bulan = params.bulan || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = bulan.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const [branches, trend, detail] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getTotalTransaksiTrend(6, params.branchId),
    getTotalTransaksiDetail({ branchId: params.branchId, startDate, endDate }),
  ]);

  const totalBulanIni = detail.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Total Transaksi</h1>
        <p className="text-sm text-neutral-500">Rekap jumlah transaksi (Transfer, E-Wallet/PPOB, Tarik Tunai) per cabang</p>
      </div>

      <form className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-3">
        <select
          name="branchId"
          defaultValue={params.branchId || ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="">Semua Cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="month"
          name="bulan"
          defaultValue={bulan}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Filter
        </button>
      </form>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-xs text-neutral-500">Total Transaksi Bulan Ini</p>
        <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">{totalBulanIni}</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Tren Total Transaksi 6 Bulan Terakhir</h2>
        <TrendTransaksiChart data={trend} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Tanggal</th>
              <th className="px-3 py-2">Cabang</th>
              <th className="px-3 py-2 text-right">Transfer</th>
              <th className="px-3 py-2 text-right">E-Wallet/PPOB</th>
              <th className="px-3 py-2 text-right">Tarik Tunai</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Nama Teller</th>
            </tr>
          </thead>
          <tbody>
            {detail.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-neutral-400">
                  Belum ada data transaksi pada periode ini.
                </td>
              </tr>
            )}
            {detail.map((d, i) => (
              <tr key={d.id} className={i % 2 === 1 ? "bg-neutral-50" : undefined}>
                <td className="px-3 py-2">{d.date.toLocaleDateString("id-ID")}</td>
                <td className="px-3 py-2">{d.branchName}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.transfer}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.eWallet}</td>
                <td className="px-3 py-2 text-right tabular-nums">{d.itTt}</td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{d.total}</td>
                <td className="px-3 py-2">{d.tellerName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
