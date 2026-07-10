"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MingguAgregat } from "@/types/analytics";

export function WeeklyChart({ data }: { data: MingguAgregat[] }) {
  const chartData = data.map((m) => ({
    label: m.label.split(" (")[0],
    total: m.total,
    rataRataPerHari: Math.round(m.rataRataPerHari * 10) / 10,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={35} allowDecimals={false} />
          <Tooltip formatter={(value, name) => [value, name === "total" ? "Total Transaksi" : "Rata-rata/Hari"]} />
          <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
