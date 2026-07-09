"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function formatRupiahSingkat(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}Rb`;
  return `${n}`;
}

export function TrendOmsetChart({ data }: { data: { bulan: string; omset: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatRupiahSingkat} tick={{ fontSize: 12 }} width={50} />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                Number(value)
              )
            }
          />
          <Bar dataKey="omset" fill="#171717" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
