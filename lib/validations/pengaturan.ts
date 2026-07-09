import { z } from "zod";

export const thresholdSchema = z.object({
  statusSangatBaik: z.coerce.number().positive("Harus lebih dari 0"),
  statusBaik: z.coerce.number().positive("Harus lebih dari 0"),
  statusPerluPerhatian: z.coerce.number().positive("Harus lebih dari 0"),
});

export const changePasswordSchema = z
  .object({
    passwordLama: z.string().min(1, "Password lama wajib diisi"),
    passwordBaru: z.string().min(6, "Password baru minimal 6 karakter"),
    konfirmasiPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.passwordBaru === data.konfirmasiPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["konfirmasiPassword"],
  });

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
});
