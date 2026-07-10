"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import type { PolaHari } from "@/types/analytics";

export function DowChart({ data }: { data: PolaHari[] }) {
  const maks = Math.max(...data.map((d) => d.rataRata), 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="namaHari" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={35} allowDecimals={false} />
          <Tooltip formatter={(value) => [Number(value).toFixed(1), "Rata-rata Transaksi"]} />
          <Bar dataKey="rataRata" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.rataRata === maks && maks > 0 ? "#2563eb" : "#93c5fd"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
