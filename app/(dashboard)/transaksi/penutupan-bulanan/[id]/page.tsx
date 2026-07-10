import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MonthlyClosingForm } from "@/components/monthly-closing-form";

const BULAN_NAMA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default async function PenutupanBulananEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [closing, branches] = await Promise.all([
    db.monthlyClosing.findUnique({ where: { id }, include: { branch: true } }),
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!closing) notFound();

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Edit Penutupan Bulanan</h1>
        <p className="text-sm text-neutral-500">
          {closing.branch.name} — {BULAN_NAMA[closing.month - 1]} {closing.year}
        </p>
        {closing.netProfitAksesori === null && closing.netProfitAice === null && (
          <p className="mt-1 text-xs text-amber-600">
            Data ini berasal dari migrasi historis (cuma angka gabungan). Menyimpan perubahan akan mengisi rincian
            Aksesori/Aice sesuai yang Anda masukkan di bawah.
          </p>
        )}
      </div>
      <MonthlyClosingForm
        branches={branches}
        isEdit
        initialData={{
          branchId: closing.branchId,
          year: closing.year,
          month: closing.month,
          netProfitAksesori: Number(closing.netProfitAksesori ?? closing.totalNetProfit),
          netProfitAice: Number(closing.netProfitAice ?? 0),
          keterangan: closing.keterangan ?? "",
          status: closing.status,
        }}
      />
    </div>
  );
}
