"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function deleteExpenseEntry(id: string) {
  await db.expenseEntry.delete({ where: { id } });
  revalidatePath("/biaya");
}
