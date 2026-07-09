"use client";

import { useActionState } from "react";
import { createBranch, type CabangFormState } from "@/actions/cabang";

const initialState: CabangFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "text-xs font-medium text-neutral-600";

export function BranchForm() {
  const [state, formAction, pending] = useActionState(createBranch, initialState);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="space-y-1">
        <label className={labelClass}>Nama Cabang</label>
        <input name="name" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Kode</label>
        <input name="code" required placeholder="misal: CABANG_BARU" className={inputClass} />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Tambah Cabang"}
        </button>
      </div>
      {state.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
