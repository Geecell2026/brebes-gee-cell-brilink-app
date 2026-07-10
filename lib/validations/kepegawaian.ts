import { z } from "zod";

export const employeeSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  tanggalMasuk: z.string().optional(),
});
