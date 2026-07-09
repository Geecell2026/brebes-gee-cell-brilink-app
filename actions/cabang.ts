"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { branchSchema } from "@/lib/validations/cabang";

export type CabangFormState = { error?: string };

export async function createBranch(
  _prevState: CabangFormState,
  formData: FormData
): Promise<CabangFormState> {
  const parsed = branchSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }

  const existing = await db.branch.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return { error: "Kode cabang sudah dipakai" };
  }

  await db.branch.create({ data: parsed.data });
  revalidatePath("/cabang");
  return {};
}

export async function toggleBranchActive(id: string) {
  const branch = await db.branch.findUnique({ where: { id } });
  if (!branch) return;
  await db.branch.update({ where: { id }, data: { isActive: !branch.isActive } });
  revalidatePath("/cabang");
}
