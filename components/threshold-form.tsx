"use client";

import { useActionState } from "react";
import { updateThresholds, type PengaturanFormState } from "@/actions/pengaturan";

const initialState: PengaturanFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "text-xs font-medium text-neutral-600";

export function ThresholdForm({
  defaultValues,
}: {
  defaultValues: { statusSangatBaik: number; statusBaik: number; statusPerluPerhatian: number };
}) {
  const [state, formAction, pending] = useActionState(updateThresholds, initialState);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-3">
      <div className="space-y-1">
        <label className={labelClass}>Omset "Sangat Baik" mulai dari</label>
        <input type="number" name="statusSangatBaik" defaultValue={defaultValues.statusSangatBaik} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Omset "Baik" mulai dari</label>
        <input type="number" name="statusBaik" defaultValue={defaultValues.statusBaik} className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Omset "Perlu Perhatian" mulai dari</label>
        <input type="number" name="statusPerluPerhatian" defaultValue={defaultValues.statusPerluPerhatian} className={inputClass} />
      </div>

      {state.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="col-span-3 text-sm text-green-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="col-span-3 w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Threshold"}
      </button>
    </form>
  );
}
