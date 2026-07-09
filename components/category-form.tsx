"use client";

import { useActionState } from "react";
import { createExpenseCategory, type PengaturanFormState } from "@/actions/pengaturan";

const initialState: PengaturanFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "text-xs font-medium text-neutral-600";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createExpenseCategory, initialState);

  return (
    <form action={formAction} className="flex items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex-1 space-y-1">
        <label className={labelClass}>Nama Kategori Biaya Baru</label>
        <input name="name" required className={inputClass} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Tambah Kategori"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
