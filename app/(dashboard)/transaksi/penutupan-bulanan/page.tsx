import Link from "next/link";
import { db } from "@/lib/db";
import { MonthlyClosingForm } from "@/components/monthly-closing-form";
import { deleteMonthlyClosing } from "@/actions/penutupan-bulanan";

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function PenutupanBulananPage() {
  const [branches, closings] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.monthlyClosing.findMany({
      include: { branch: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
  ]);

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Penutupan Bulanan</h1>
        <p className="text-sm text-neutral-500">
          Net Profit Usaha Tambahan (Acc &amp; Aice) — diinput satu kali per cabang per bulan. Ini terpisah dari
          Pendapatan/Pengeluaran Acc &amp; Aice harian di Transaksi Harian, yang tetap memengaruhi Saldo Akhir.
        </p>
      </div>

      <MonthlyClosingForm branches={branches} />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Periode</th>
              <th className="px-3 py-2">Cabang</th>
              <th className="px-3 py-2 text-right">Net Profit Aksesori</th>
              <th className="px-3 py-2 text-right">Net Profit Aice</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {closings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-neutral-400">
                  Belum ada penutupan bulanan.
                </td>
              </tr>
            )}
            {closings.map((c, i) => (
              <tr key={c.id} className={i % 2 === 1 ? "bg-neutral-50" : undefined}>
                <td className="px-3 py-2">
                  {BULAN_NAMA[c.month - 1]} {c.year}
                </td>
                <td className="px-3 py-2">{c.branch.name}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.netProfitAksesori !== null ? formatRupiah(Number(c.netProfitAksesori)) : "-"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {c.netProfitAice !== null ? formatRupiah(Number(c.netProfitAice)) : "-"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">{formatRupiah(Number(c.totalNetProfit))}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      c.status === "FINAL"
                        ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                    }
                  >
                    {c.status === "FINAL" ? "Final" : "Draft"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/transaksi/penutupan-bulanan/${c.id}`} className="text-xs text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteMonthlyClosing(c.id);
                      }}
                    >
                      <button className="text-xs text-red-600 hover:underline">Hapus</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
