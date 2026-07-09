"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/calculations/settings";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { thresholdSchema, changePasswordSchema, expenseCategorySchema } from "@/lib/validations/pengaturan";

export type PengaturanFormState = { error?: string; success?: string };

export async function updateThresholds(
  _prevState: PengaturanFormState,
  formData: FormData
): Promise<PengaturanFormState> {
  const parsed = thresholdSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const settings = await getAppSettings();
  await db.appSettings.update({ where: { id: settings.id }, data: parsed.data });

  revalidatePath("/pengaturan");
  revalidatePath("/");
  return { success: "Threshold berhasil disimpan" };
}

export async function changePassword(
  _prevState: PengaturanFormState,
  formData: FormData
): Promise<PengaturanFormState> {
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const session = await getSession();
  if (!session) return { error: "Sesi tidak valid, silakan login ulang" };

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "User tidak ditemukan" };

  const valid = await verifyPassword(parsed.data.passwordLama, user.passwordHash);
  if (!valid) return { error: "Password lama salah" };

  const newHash = await hashPassword(parsed.data.passwordBaru);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return { success: "Password berhasil diubah" };
}

export async function createExpenseCategory(
  _prevState: PengaturanFormState,
  formData: FormData
): Promise<PengaturanFormState> {
  const parsed = expenseCategorySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const existing = await db.expenseCategory.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { error: "Kategori sudah ada" };

  await db.expenseCategory.create({ data: { name: parsed.data.name } });
  revalidatePath("/pengaturan");
  return { success: "Kategori berhasil ditambahkan" };
}

export async function toggleExpenseCategoryActive(id: string) {
  const category = await db.expenseCategory.findUnique({ where: { id } });
  if (!category) return;
  await db.expenseCategory.update({ where: { id }, data: { isActive: !category.isActive } });
  revalidatePath("/pengaturan");
}
