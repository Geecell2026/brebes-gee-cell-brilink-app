"use client";

import { Download } from "lucide-react";

type Row = {
  tanggal: string;
  cabang: string;
  namaHari: string;
  status: string;
  totalTransaksi: number;
};

export function DownloadCsvButton({ rows, filename }: { rows: Row[]; filename: string }) {
  function handleDownload() {
    const header = "Tanggal,Cabang,Hari,Status,Total Transaksi";
    const lines = rows.map((r) => `${r.tanggal},${r.cabang},${r.namaHari},${r.status},${r.totalTransaksi}`);
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
    >
      <Download className="h-3.5 w-3.5" strokeWidth={2} />
      Download Data Bersih (CSV)
    </button>
  );
}
