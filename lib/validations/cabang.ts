import { z } from "zod";

export const branchSchema = z.object({
  name: z.string().min(1, "Nama cabang wajib diisi"),
  code: z
    .string()
    .min(1, "Kode cabang wajib diisi")
    .regex(/^[A-Z0-9_]+$/, "Kode hanya boleh huruf besar, angka, underscore"),
});
