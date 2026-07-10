"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TrendTransaksiChart({ data }: { data: { bulan: string; totalTrx: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={40} allowDecimals={false} />
          <Tooltip formatter={(value) => [`${value} transaksi`, "Total"]} />
          <Bar dataKey="totalTrx" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
