import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TransaksiForm } from "@/components/transaksi-form";

export default async function TransaksiEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tx = await db.dailyTransaction.findUnique({
    where: { id },
    include: { branch: true, tellerBreakdown: true, pvEntries: true },
  });
  if (!tx) notFound();

  const [categories, biayaEntries] = await Promise.all([
    db.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.expenseEntry.findMany({
      where: { branchId: tx.branchId, date: tx.date },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Edit Transaksi Harian</h1>
        <p className="text-sm text-neutral-500">
          {tx.branch.name} — {tx.date.toLocaleDateString("id-ID")}
        </p>
      </div>
      <TransaksiForm
        branches={[]}
        categories={categories}
        transactionId={tx.id}
        initialData={{
          branchId: tx.branchId,
          branchName: tx.branch.name,
          date: tx.date.toISOString().slice(0, 10),
          status: tx.status,
          saldoAwal: Number(tx.saldoAwal),
          brilinkPendapatan: Number(tx.brilinkPendapatan),
          brilinkPpob: Number(tx.brilinkPpob),
          brilinkFee: Number(tx.brilinkFee),
          accAicePendapatan: Number(tx.accAicePendapatan),
          accAicePengeluaran: Number(tx.accAicePengeluaran),
          lainPendapatan: Number(tx.lainPendapatan),
          lainPengeluaran: Number(tx.lainPengeluaran),
          asetKeterangan: tx.asetKeterangan ?? "",
          asetPendapatan: Number(tx.asetPendapatan),
          asetPengeluaran: Number(tx.asetPengeluaran),
          gajiKasbon: Number(tx.gajiKasbon),
          plusMinus: Number(tx.plusMinus),
          pvEntries: tx.pvEntries.map((p) => ({
            personName: p.personName,
            amount: String(Number(p.amount)),
          })),
          tellerRows: tx.tellerBreakdown.map((t) => ({
            tellerName: t.tellerName,
            transfer: String(Number(t.transfer)),
            eWallet: String(Number(t.eWallet)),
            itTt: String(Number(t.itTt)),
          })),
          biayaRows: biayaEntries.map((b) => ({
            categoryId: b.categoryId,
            keterangan: b.keterangan,
            jumlah: String(Number(b.totalPembayaran)),
          })),
        }}
      />
    </div>
  );
}
