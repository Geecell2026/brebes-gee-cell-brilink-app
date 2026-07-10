"use client";

import { useActionState, useState } from "react";
import { saveMonthlyClosing, type PenutupanBulananFormState } from "@/actions/penutupan-bulanan";

const initialState: PenutupanBulananFormState = {};
const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500";
const labelClass = "text-xs font-medium text-neutral-600";

type Branch = { id: string; name: string };
type InitialData = {
  branchId: string;
  year: number;
  month: number;
  netProfitAksesori: number;
  netProfitAice: number;
  keterangan: string;
  status: "DRAFT" | "FINAL";
};

const BULAN_OPTIONS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function MonthlyClosingForm({
  branches,
  initialData,
  isEdit,
}: {
  branches: Branch[];
  initialData?: InitialData;
  isEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveMonthlyClosing, initialState);
  const [aksesori, setAksesori] = useState(String(initialData?.netProfitAksesori ?? 0));
  const [aice, setAice] = useState(String(initialData?.netProfitAice ?? 0));
  const total = (Number(aksesori) || 0) + (Number(aice) || 0);
  const now = new Date();

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="space-y-1">
          <label className={labelClass}>Cabang</label>
          {isEdit ? (
            <>
              <input value={branches.find((b) => b.id === initialData?.branchId)?.name ?? ""} disabled className={inputClass} />
              <input type="hidden" name="branchId" value={initialData?.branchId} />
            </>
          ) : (
            <select name="branchId" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Pilih cabang
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Bulan</label>
          <select name="month" defaultValue={initialData?.month ?? now.getMonth() + 1} disabled={isEdit} className={inputClass}>
            {BULAN_OPTIONS.map((b, i) => (
              <option key={b} value={i + 1}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Tahun</label>
          <input type="number" name="year" defaultValue={initialData?.year ?? now.getFullYear()} disabled={isEdit} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Status</label>
          <select name="status" defaultValue={initialData?.status ?? "DRAFT"} className={inputClass}>
            <option value="DRAFT">Draft</option>
            <option value="FINAL">Final</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className={labelClass}>Net Profit Aksesori</label>
          <input
            type="number"
            name="netProfitAksesori"
            value={aksesori}
            onChange={(e) => setAksesori(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Net Profit Aice</label>
          <input type="number" name="netProfitAice" value={aice} onChange={(e) => setAice(e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Total Net Profit Acc &amp; Aice</label>
          <input value={total} disabled className={inputClass} />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass}>Keterangan (opsional)</label>
        <textarea name="keterangan" rows={2} defaultValue={initialData?.keterangan} className={inputClass} />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700">{state.success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Penutupan Bulanan"}
      </button>
    </form>
  );
}
