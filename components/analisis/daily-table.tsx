"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import type { DailyPoint } from "@/types/analytics";

type SortKey = "date" | "namaHari" | "totalTransaksi";

export function DailyTable({ data }: { data: DailyPoint[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...data];
    copy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = a.date.getTime() - b.date.getTime();
      else if (sortKey === "namaHari") cmp = a.namaHari.localeCompare(b.namaHari);
      else cmp = a.totalTransaksi - b.totalTransaksi;
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [data, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const headerBtn = (key: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(key)} className="flex items-center gap-1 hover:text-neutral-800">
      {label}
      <ArrowUpDown className="h-3 w-3" strokeWidth={2} />
    </button>
  );

  if (data.length === 0) {
    return <p className="text-sm text-neutral-400">Belum ada data pada periode ini.</p>;
  }

  return (
    <div className="max-h-[28rem] overflow-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="sticky top-0 border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
          <tr>
            <th className="px-3 py-2">{headerBtn("date", "Tanggal")}</th>
            <th className="px-3 py-2">{headerBtn("namaHari", "Hari")}</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">{headerBtn("totalTransaksi", "Total Transaksi")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.date.toISOString()} className={i % 2 === 1 ? "bg-neutral-50" : undefined}>
              <td className="px-3 py-2">{p.date.toLocaleDateString("id-ID")}</td>
              <td className="px-3 py-2">{p.namaHari}</td>
              <td className="px-3 py-2">
                <span
                  className={
                    p.status === "LIBUR"
                      ? "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
                      : "rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
                  }
                >
                  {p.status === "LIBUR" ? "Libur" : "Buka"}
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-medium">{p.totalTransaksi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
