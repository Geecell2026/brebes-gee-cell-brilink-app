import Link from "next/link";
import { db } from "@/lib/db";
import { hitungTotalPendapatan, hitungTotalPengeluaran } from "@/lib/calculations/transaksi";
import { deleteDailyTransaction } from "@/actions/transaksi";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function TransaksiPage({
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

  const [branches, transactions] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.dailyTransaction.findMany({
      where: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        date: { gte: startDate, lt: endDate },
      },
      include: { branch: true },
      orderBy: [{ date: "asc" }, { branch: { name: "asc" } }],
    }),
  ]);

  const biayaByBranchDate = new Map<string, number>();
  if (transactions.length > 0) {
    const entries = await db.expenseEntry.groupBy({
      by: ["branchId", "date"],
      where: { date: { gte: startDate, lt: endDate } },
      _sum: { totalPembayaran: true },
    });
    for (const e of entries) {
      biayaByBranchDate.set(`${e.branchId}_${e.date.toISOString()}`, Number(e._sum.totalPembayaran ?? 0));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Transaksi Harian</h1>
          <p className="text-sm text-neutral-500">Rekap harian per cabang</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/transaksi/penutupan-bulanan" className="text-sm text-neutral-600 hover:underline">
            Penutupan Bulanan
          </Link>
          <Link
            href="/transaksi/baru"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Input Transaksi
          </Link>
        </div>
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

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Tanggal</th>
              <th className="px-3 py-2">Cabang</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Omset Admin</th>
              <th className="px-3 py-2 text-right">Pendapatan Acc/Aksesoris &amp; Aice</th>
              <th className="px-3 py-2 text-right">Total Pengeluaran</th>
              <th className="px-3 py-2 text-right">Plus Minus</th>
              <th className="px-3 py-2 text-right">Saldo Akhir</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-neutral-400">
                  Belum ada transaksi pada periode ini.
                </td>
              </tr>
            )}
            {transactions.map((tx, i) => {
              const totalBiaya = biayaByBranchDate.get(`${tx.branchId}_${tx.date.toISOString()}`) ?? 0;
              return (
                <tr key={tx.id} className={i % 2 === 1 ? "bg-neutral-50" : undefined}>
                  <td className="px-3 py-2">{tx.date.toLocaleDateString("id-ID")}</td>
                  <td className="px-3 py-2">{tx.branch.name}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        tx.status === "LIBUR"
                          ? "rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500"
                          : "rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                      }
                    >
                      {tx.status === "LIBUR" ? "Libur" : "Buka"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(hitungTotalPendapatan(tx))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(Number(tx.accAicePendapatan))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(hitungTotalPengeluaran(tx, totalBiaya))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(Number(tx.plusMinus))}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatRupiah(Number(tx.saldoAkhir))}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/transaksi/${tx.id}`} className="text-xs text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteDailyTransaction(tx.id);
                        }}
                      >
                        <button className="text-xs text-red-600 hover:underline">Hapus</button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
