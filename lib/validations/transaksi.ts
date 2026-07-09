import { z } from "zod";

const decimalField = z.coerce.number().default(0);

export const pvEntrySchema = z.object({
  personName: z.string().min(1),
  amount: decimalField,
});

export const tellerRowSchema = z.object({
  tellerName: z.string().min(1),
  transfer: decimalField,
  eWallet: decimalField,
  itTt: decimalField,
});

export const biayaRowSchema = z.object({
  categoryId: z.string().optional().default(""),
  keterangan: z.string().optional().default(""),
  jumlah: decimalField,
});

export const dailyTransactionSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  status: z.enum(["BUKA", "LIBUR"]).default("BUKA"),

  brilinkPendapatan: decimalField,
  brilinkPpob: decimalField,
  brilinkFee: decimalField,

  accAicePendapatan: decimalField,
  accAicePengeluaran: decimalField,

  lainKeterangan: z.string().optional(),
  lainPendapatan: decimalField,
  lainPengeluaran: decimalField,

  asetPendapatan: decimalField,
  asetPengeluaran: decimalField,

  gajiKasbon: decimalField,
  plusMinus: decimalField,

  saldoAwal: decimalField,

  pvEntries: z.array(pvEntrySchema).default([]),
  tellerRows: z.array(tellerRowSchema).default([]),
  biayaRows: z.array(biayaRowSchema).default([]),
});

export type DailyTransactionInput = z.infer<typeof dailyTransactionSchema>;
