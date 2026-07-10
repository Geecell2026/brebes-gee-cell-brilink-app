import type { Anomali } from "@/types/analytics";

export function AnomalyTable({ data }: { data: Anomali[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-400">Tidak ada anomali terdeteksi pada periode ini.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
          <tr>
            <th className="px-3 py-2">Tanggal</th>
            <th className="px-3 py-2">Cabang</th>
            <th className="px-3 py-2 text-right">Transaksi</th>
            <th className="px-3 py-2">Jenis Anomali</th>
            <th className="px-3 py-2">Kemungkinan Penyebab</th>
          </tr>
        </thead>
        <tbody>
          {data.map((a, i) => (
            <tr key={i} className={i % 2 === 1 ? "bg-neutral-50" : undefined}>
              <td className="px-3 py-2">{a.date.toLocaleDateString("id-ID")}</td>
              <td className="px-3 py-2">{a.branchName}</td>
              <td className="px-3 py-2 text-right tabular-nums">{a.totalTransaksi ?? "-"}</td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {a.jenis}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-neutral-500">{a.kemungkinanPenyebab.join(", ")} (saran, belum tentu)</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
