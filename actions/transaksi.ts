"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dailyTransactionSchema } from "@/lib/validations/transaksi";
import { hitungSaldoAkhir } from "@/lib/calculations/transaksi";

export type TransaksiFormState = { error?: string };

function parseJsonArray(formData: FormData, field: string): unknown[] {
  const raw = formData.get(field);
  if (typeof raw !== "string" || raw.length === 0) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Baris biaya/PV yang kosong (belum pilih kategori/nama atau jumlah 0) diabaikan.
function filterBiayaRows(rows: { categoryId?: string; keterangan?: string; jumlah: number }[]) {
  return rows.filter((row) => row.categoryId && row.jumlah > 0);
}
function filterPvRows(rows: { personName: string; amount: number }[]) {
  return rows.filter((row) => row.personName && row.amount > 0);
}

export async function createDailyTransaction(
  _prevState: TransaksiFormState,
  formData: FormData
): Promise<TransaksiFormState> {
  const raw = Object.fromEntries(formData.entries());
  const tellerRows = parseJsonArray(formData, "tellerRowsJson");
  const biayaRows = parseJsonArray(formData, "biayaRowsJson");
  const pvEntries = parseJsonArray(formData, "pvEntriesJson");

  const parsed = dailyTransactionSchema.safeParse({ ...raw, tellerRows, biayaRows, pvEntries });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const data = parsed.data;
  const validBiayaRows = filterBiayaRows(data.biayaRows);
  const validPvRows = filterPvRows(data.pvEntries);
  const totalBiaya = validBiayaRows.reduce((sum, r) => sum + r.jumlah, 0);
  const saldoAkhir = hitungSaldoAkhir(data, totalBiaya);

  const existing = await db.dailyTransaction.findUnique({
    where: { branchId_date: { branchId: data.branchId, date: new Date(data.date) } },
  });
  if (existing) {
    return { error: "Transaksi untuk cabang & tanggal ini sudah ada. Silakan edit yang sudah ada." };
  }

  await db.$transaction([
    db.dailyTransaction.create({
      data: {
        branchId: data.branchId,
        date: new Date(data.date),
        status: data.status,
        brilinkPendapatan: data.brilinkPendapatan,
        brilinkPpob: data.brilinkPpob,
        brilinkFee: data.brilinkFee,
        accAicePendapatan: data.accAicePendapatan,
        accAicePengeluaran: data.accAicePengeluaran,
        lainKeterangan: data.lainKeterangan || null,
        lainPendapatan: data.lainPendapatan,
        lainPengeluaran: data.lainPengeluaran,
        asetPendapatan: data.asetPendapatan,
        asetPengeluaran: data.asetPengeluaran,
        gajiKasbon: data.gajiKasbon,
        plusMinus: data.plusMinus,
        saldoAwal: data.saldoAwal,
        saldoAkhir,
        pvEntries: { create: validPvRows },
        tellerBreakdown: {
          create: data.tellerRows.map((row) => ({
            tellerName: row.tellerName,
            transfer: row.transfer,
            eWallet: row.eWallet,
            itTt: row.itTt,
          })),
        },
      },
    }),
    ...(validBiayaRows.length > 0
      ? [
          db.expenseEntry.createMany({
            data: validBiayaRows.map((row) => ({
              branchId: data.branchId,
              date: new Date(data.date),
              categoryId: row.categoryId!,
              keterangan: row.keterangan || "-",
              totalPembayaran: row.jumlah,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/transaksi");
  revalidatePath("/biaya");
  redirect("/transaksi");
}

export async function updateDailyTransaction(
  id: string,
  _prevState: TransaksiFormState,
  formData: FormData
): Promise<TransaksiFormState> {
  const raw = Object.fromEntries(formData.entries());
  const tellerRows = parseJsonArray(formData, "tellerRowsJson");
  const biayaRows = parseJsonArray(formData, "biayaRowsJson");
  const pvEntries = parseJsonArray(formData, "pvEntriesJson");

  const existing = await db.dailyTransaction.findUnique({ where: { id } });
  if (!existing) {
    return { error: "Transaksi tidak ditemukan" };
  }

  const parsed = dailyTransactionSchema.safeParse({
    ...raw,
    branchId: existing.branchId,
    date: existing.date.toISOString().slice(0, 10),
    tellerRows,
    biayaRows,
    pvEntries,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const data = parsed.data;
  const validBiayaRows = filterBiayaRows(data.biayaRows);
  const validPvRows = filterPvRows(data.pvEntries);
  const totalBiaya = validBiayaRows.reduce((sum, r) => sum + r.jumlah, 0);
  const saldoAkhir = hitungSaldoAkhir(data, totalBiaya);

  await db.$transaction([
    db.transactionTellerBreakdown.deleteMany({ where: { dailyTransactionId: id } }),
    db.pvEntry.deleteMany({ where: { dailyTransactionId: id } }),
    db.dailyTransaction.update({
      where: { id },
      data: {
        status: data.status,
        brilinkPendapatan: data.brilinkPendapatan,
        brilinkPpob: data.brilinkPpob,
        brilinkFee: data.brilinkFee,
        accAicePendapatan: data.accAicePendapatan,
        accAicePengeluaran: data.accAicePengeluaran,
        lainKeterangan: data.lainKeterangan || null,
        lainPendapatan: data.lainPendapatan,
        lainPengeluaran: data.lainPengeluaran,
        asetPendapatan: data.asetPendapatan,
        asetPengeluaran: data.asetPengeluaran,
        gajiKasbon: data.gajiKasbon,
        plusMinus: data.plusMinus,
        saldoAwal: data.saldoAwal,
        saldoAkhir,
        pvEntries: { create: validPvRows },
        tellerBreakdown: {
          create: data.tellerRows.map((row) => ({
            tellerName: row.tellerName,
            transfer: row.transfer,
            eWallet: row.eWallet,
            itTt: row.itTt,
          })),
        },
      },
    }),
    db.expenseEntry.deleteMany({ where: { branchId: existing.branchId, date: existing.date } }),
    ...(validBiayaRows.length > 0
      ? [
          db.expenseEntry.createMany({
            data: validBiayaRows.map((row) => ({
              branchId: existing.branchId,
              date: existing.date,
              categoryId: row.categoryId!,
              keterangan: row.keterangan || "-",
              totalPembayaran: row.jumlah,
            })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/transaksi");
  revalidatePath("/biaya");
  redirect("/transaksi");
}

export async function deleteDailyTransaction(id: string) {
  await db.dailyTransaction.delete({ where: { id } });
  revalidatePath("/transaksi");
}
