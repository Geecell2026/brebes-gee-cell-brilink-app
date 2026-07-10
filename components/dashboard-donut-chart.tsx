"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { KomposisiTransaksi } from "@/types/dashboard";

const WARNA: Record<KomposisiTransaksi["kategori"], string> = {
  Transfer: "#2563eb",
  "E-Wallet/PPOB": "#7c3aed",
  "Tarik Tunai": "#f59e0b",
};

export function DashboardDonutChart({ data }: { data: KomposisiTransaksi[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-neutral-400">Belum ada data transaksi pada periode ini.</p>;
  }

  const terbesar = [...data].sort((a, b) => b.jumlah - a.jumlah)[0];

  return (
    <div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="jumlah" nameKey="kategori" innerRadius={55} outerRadius={85} paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.kategori} fill={WARNA[d.kategori]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} (${data.find((d) => d.kategori === name)?.persen.toFixed(1)}%)`, name]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-xs text-neutral-500">
        Kategori terbesar: <span className="font-medium text-neutral-700">{terbesar.kategori}</span> ({terbesar.persen.toFixed(1)}%)
      </p>
    </div>
  );
}
