"use client";

import { useActionState } from "react";
import { updateTarget, type PengaturanFormState } from "@/actions/pengaturan";

const initialState: PengaturanFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "text-xs font-medium text-neutral-600";

export function TargetForm({ defaultValue }: { defaultValue: number | null }) {
  const [state, formAction, pending] = useActionState(updateTarget, initialState);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-4">
      <div className="space-y-1">
        <label className={labelClass}>Target Transaksi per Hari (opsional)</label>
        <input
          type="number"
          name="targetTransaksiHarian"
          defaultValue={defaultValue ?? ""}
          placeholder="misal: 40"
          className={inputClass}
        />
      </div>

      {state.error && <p className="col-span-4 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="col-span-4 text-sm text-green-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="col-span-4 w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Target"}
      </button>
    </form>
  );
}
