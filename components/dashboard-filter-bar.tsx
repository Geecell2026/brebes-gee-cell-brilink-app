type Branch = { id: string; name: string };

const PEMBANDING_OPTIONS: { value: string; label: string }[] = [
  { value: "SAMA_BULAN_LALU", label: "Periode yang sama bulan lalu" },
  { value: "BULAN_PENUH_SEBELUMNYA", label: "Bulan penuh sebelumnya" },
  { value: "RATA_HARIAN_BULAN_LALU", label: "Rata-rata harian bulan lalu" },
];

export function DashboardFilterBar({
  branches,
  branchId,
  startDate,
  endDate,
  pembanding,
}: {
  branches: Branch[];
  branchId?: string;
  startDate?: string;
  endDate?: string;
  pembanding?: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600">Cabang</label>
        <select name="branchId" defaultValue={branchId || ""} className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
          <option value="">Semua Cabang</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600">Dari Tanggal</label>
        <input type="date" name="startDate" defaultValue={startDate} className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600">Sampai Tanggal</label>
        <input type="date" name="endDate" defaultValue={endDate} className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600">Periode Pembanding</label>
        <select name="pembanding" defaultValue={pembanding || "SAMA_BULAN_LALU"} className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
          {PEMBANDING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
        Terapkan
      </button>
      <a href="/" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50">
        Reset Filter
      </a>
    </form>
  );
}
