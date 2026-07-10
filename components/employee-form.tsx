"use client";

import { useActionState } from "react";
import { createEmployee, updateEmployee, type KepegawaianFormState } from "@/actions/kepegawaian";

const initialState: KepegawaianFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "text-xs font-medium text-neutral-600";

type InitialData = {
  name: string;
  jabatan: string;
  tanggalMasuk: string;
  tanggalKeluar: string;
};

export function EmployeeForm({
  employeeId,
  initialData,
}: {
  employeeId?: string;
  initialData?: InitialData;
}) {
  const isEdit = Boolean(employeeId);
  const action = isEdit ? updateEmployee.bind(null, employeeId!) : createEmployee;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid grid-cols-4 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="space-y-1">
        <label className={labelClass}>Nama</label>
        <input name="name" required defaultValue={initialData?.name} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Jabatan</label>
        <input
          name="jabatan"
          required
          placeholder="misal: Teller"
          defaultValue={initialData?.jabatan}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Tanggal Masuk (opsional)</label>
        <input type="date" name="tanggalMasuk" defaultValue={initialData?.tanggalMasuk} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Tanggal Keluar (opsional)</label>
        <input type="date" name="tanggalKeluar" defaultValue={initialData?.tanggalKeluar} className={inputClass} />
      </div>
      <div className="col-span-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Karyawan"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
