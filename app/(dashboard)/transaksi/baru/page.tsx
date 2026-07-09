import { db } from "@/lib/db";
import { TransaksiForm } from "@/components/transaksi-form";

export default async function TransaksiBaruPage() {
  const [branches, categories] = await Promise.all([
    db.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Input Transaksi Harian</h1>
        <p className="text-sm text-neutral-500">Satu cabang, satu tanggal — termasuk input biaya</p>
      </div>
      <TransaksiForm branches={branches} categories={categories} />
    </div>
  );
}
