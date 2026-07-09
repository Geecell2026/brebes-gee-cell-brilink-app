import { db } from "@/lib/db";
import { deleteExpenseEntry } from "@/actions/biaya";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export default async function BiayaPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; categoryId?: string; bulan?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const bulan = params.bulan || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, month] = bulan.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const [branches, categories, expenses] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.expenseCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.expenseEntry.findMany({
      where: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        date: { gte: startDate, lt: endDate },
      },
      include: { branch: true, category: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const total = expenses.reduce((sum, e) => sum + Number(e.totalPembayaran), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Biaya</h1>
        <p className="text-sm text-neutral-500">
          Total periode ini: {formatRupiah(total)} — input biaya lewat halaman Transaksi Harian
        </p>
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
        <select
          name="categoryId"
          defaultValue={params.categoryId || ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
              <th className="px-3 py-2">Jenis Biaya</th>
              <th className="px-3 py-2">Keterangan</th>
              <th className="px-3 py-2 text-right">Jumlah</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-400">
                  Belum ada biaya pada periode ini.
                </td>
              </tr>
            )}
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-3 py-2">{e.date.toLocaleDateString("id-ID")}</td>
                <td className="px-3 py-2">{e.branch.name}</td>
                <td className="px-3 py-2">{e.category.name}</td>
                <td className="px-3 py-2">{e.keterangan}</td>
                <td className="px-3 py-2 text-right">{formatRupiah(Number(e.totalPembayaran))}</td>
                <td className="px-3 py-2 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteExpenseEntry(e.id);
                    }}
                  >
                    <button className="text-xs text-red-600 hover:underline">Hapus</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
