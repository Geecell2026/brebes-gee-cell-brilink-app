"use client";

import { useActionState } from "react";
import { changePassword, type PengaturanFormState } from "@/actions/pengaturan";

const initialState: PengaturanFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none";
const labelClass = "text-xs font-medium text-neutral-600";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="grid grid-cols-3 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="space-y-1">
        <label className={labelClass}>Password Lama</label>
        <input type="password" name="passwordLama" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Password Baru</label>
        <input type="password" name="passwordBaru" required className={inputClass} />
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Konfirmasi Password Baru</label>
        <input type="password" name="konfirmasiPassword" required className={inputClass} />
      </div>

      {state.error && <p className="col-span-3 text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="col-span-3 text-sm text-green-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="col-span-3 w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Ganti Password"}
      </button>
    </form>
  );
}
