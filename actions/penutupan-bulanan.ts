"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { monthlyClosingSchema } from "@/lib/validations/penutupan-bulanan";

export type PenutupanBulananFormState = { error?: string; success?: string };

// Upsert by (branchId, year, month) - poin D spesifikasi: input ulang periode
// yang sama TIDAK membuat data ganda, tapi meng-update record yang sudah ada.
export async function saveMonthlyClosing(
  _prevState: PenutupanBulananFormState,
  formData: FormData
): Promise<PenutupanBulananFormState> {
  const parsed = monthlyClosingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const { branchId, year, month, netProfitAksesori, netProfitAice, keterangan, status } = parsed.data;
  const totalNetProfit = netProfitAksesori + netProfitAice;

  await db.monthlyClosing.upsert({
    where: { branchId_year_month: { branchId, year, month } },
    update: {
      netProfitAksesori,
      netProfitAice,
      totalNetProfit,
      keterangan: keterangan || null,
      status,
      tanggalInput: new Date(),
    },
    create: {
      branchId,
      year,
      month,
      netProfitAksesori,
      netProfitAice,
      totalNetProfit,
      keterangan: keterangan || null,
      status,
    },
  });

  revalidatePath("/transaksi/penutupan-bulanan");
  revalidatePath("/");
  return { success: "Penutupan bulanan berhasil disimpan" };
}

export async function deleteMonthlyClosing(id: string) {
  await db.monthlyClosing.delete({ where: { id } });
  revalidatePath("/transaksi/penutupan-bulanan");
  revalidatePath("/");
}
