"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { employeeSchema } from "@/lib/validations/kepegawaian";

export type KepegawaianFormState = { error?: string };

export async function createEmployee(
  _prevState: KepegawaianFormState,
  formData: FormData
): Promise<KepegawaianFormState> {
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  await db.employee.create({
    data: {
      name: parsed.data.name,
      jabatan: parsed.data.jabatan,
      tanggalMasuk: parsed.data.tanggalMasuk ? new Date(parsed.data.tanggalMasuk) : null,
    },
  });
  revalidatePath("/kepegawaian");
  revalidatePath("/transaksi/baru");
  return {};
}

export async function toggleEmployeeActive(id: string) {
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) return;
  await db.employee.update({ where: { id }, data: { isActive: !employee.isActive } });
  revalidatePath("/kepegawaian");
  revalidatePath("/transaksi/baru");
}
