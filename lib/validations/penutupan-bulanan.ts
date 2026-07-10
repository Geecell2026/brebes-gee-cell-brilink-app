import { z } from "zod";

export const monthlyClosingSchema = z.object({
  branchId: z.string().min(1, "Cabang wajib dipilih"),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  netProfitAksesori: z.coerce.number().default(0),
  netProfitAice: z.coerce.number().default(0),
  keterangan: z.string().optional(),
  status: z.enum(["DRAFT", "FINAL"]).default("DRAFT"),
});

export type MonthlyClosingInput = z.infer<typeof monthlyClosingSchema>;
