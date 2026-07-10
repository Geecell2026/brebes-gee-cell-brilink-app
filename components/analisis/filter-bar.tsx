type Branch = { id: string; name: string };

const HARI_OPTIONS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function FilterBar({
  branches,
  branchId,
  startDate,
  endDate,
  hari,
  action,
}: {
  branches: Branch[];
  branchId?: string;
  startDate?: string;
  endDate?: string;
  hari?: string[];
  action: string;
}) {
  return (
    <form className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-neutral-600">Cabang</label>
        <select
          name="branchId"
          defaultValue={branchId || ""}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
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
        <label className="text-xs font-medium text-neutral-600">Hari</label>
        <div className="flex flex-wrap gap-2 rounded-md border border-neutral-300 px-2 py-1.5">
          {HARI_OPTIONS.map((h) => (
            <label key={h} className="flex items-center gap-1 text-xs text-neutral-600">
              <input type="checkbox" name="hari" value={h} defaultChecked={hari?.includes(h)} />
              {h.slice(0, 3)}
            </label>
          ))}
        </div>
      </div>
      <button type="submit" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
        Terapkan
      </button>
      <a href={action} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50">
        Reset Filter
      </a>
    </form>
  );
}
