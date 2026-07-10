"use client";

import { useActionState } from "react";
import { createEmployee, type KepegawaianFormState } from "@/actions/kepegawaian";

const initialState: KepegawaianFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "text-xs font-medium text-neutral-600";

export function EmployeeForm() {
  const [state, formAction, pending] = useActionState(createEmployee, initialState);

  return (
    <form action={formAction} className="grid grid-cols-4 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="space-y-1">
        <label className={labelClass}>Nama</label>
        <input name="name" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Jabatan</label>
        <input name="jabatan" required placeholder="misal: Teller" className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Tanggal Masuk (opsional)</label>
        <input type="date" name="tanggalMasuk" className={inputClass} />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : "Tambah Karyawan"}
        </button>
      </div>
      {state.error && <p className="col-span-4 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
