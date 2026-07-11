import { z } from "zod";

// Batas aman di bawah kapasitas Decimal(14,2) - mencegah nilai tak wajar
// akibat salah ketik/paste sebelum masuk ke database.
const BATAS_NOMINAL_AMAN = 999_999_999_999;

const decimalField = z.coerce.number().default(0);

// Nominal uang biasa (pendapatan/pengeluaran/gaji/dll) - tidak boleh negatif.
// Plus Minus dikecualikan (lihat plusMinusField di bawah) karena secara
// definisi dipakai untuk koreksi/selisih kas yang bisa plus maupun minus.
const nominalNonNegatif = z.coerce
  .number()
  .refine((v) => Number.isFinite(v), "Nominal harus berupa angka.")
  .refine((v) => v >= 0, "Nominal tidak boleh negatif.")
  .refine((v) => Math.abs(v) <= BATAS_NOMINAL_AMAN, "Nominal terlalu besar.")
  .default(0);

const plusMinusField = z.coerce
  .number()
  .refine((v) => Number.isFinite(v), "Nominal harus berupa angka.")
  .refine((v) => Math.abs(v) <= BATAS_NOMINAL_AMAN, "Nominal terlalu besar.")
  .default(0);

export const pvEntrySchema = z.object({
  personName: z.string().min(1),
  amount: nominalNonNegatif,
});

export const tellerRowSchema = z.object({
  tellerName: z.string().optional().default(""),
  transfer: decimalField,
  eWallet: decimalField,
  itTt: decimalField,
});

export const biayaRowSchema = z.object({
  categoryId: z.string().optional().default(""),
  keterangan: z.string().optional().default(""),
  jumlah: nominalNonNegatif,
});

export const dailyTransactionSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  status: z.enum(["BUKA", "LIBUR"]).default("BUKA"),

  brilinkPendapatan: nominalNonNegatif,
  brilinkPpob: nominalNonNegatif,
  brilinkFee: nominalNonNegatif,

  accAicePendapatan: nominalNonNegatif,
  accAicePengeluaran: nominalNonNegatif,

  lainPendapatan: nominalNonNegatif,
  lainPengeluaran: nominalNonNegatif,

  asetKeterangan: z.string().optional(),
  asetPendapatan: nominalNonNegatif,
  asetPengeluaran: nominalNonNegatif,

  gajiKasbon: nominalNonNegatif,
  plusMinus: plusMinusField,

  saldoAwal: nominalNonNegatif,

  pvEntries: z.array(pvEntrySchema).default([]),
  tellerRows: z.array(tellerRowSchema).default([]),
  biayaRows: z.array(biayaRowSchema).default([]),
});

export type DailyTransactionInput = z.infer<typeof dailyTransactionSchema>;
