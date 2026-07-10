"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/types/dashboard";

function formatRupiahSingkat(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}Rb`;
  return `${n}`;
}

type Mode = "keuangan" | "transaksi";

export function DashboardTrendChart({ data }: { data: TrendPoint[] }) {
  const [mode, setMode] = useState<Mode>("keuangan");

  return (
    <div>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("keuangan")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${mode === "keuangan" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"}`}
        >
          Mode Keuangan
        </button>
        <button
          type="button"
          onClick={() => setMode("transaksi")}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${mode === "transaksi" ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-600"}`}
        >
          Mode Transaksi
        </button>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={mode === "keuangan" ? formatRupiahSingkat : undefined} tick={{ fontSize: 11 }} width={40} allowDecimals={false} />
            <Tooltip
              formatter={(value, name) =>
                mode === "keuangan"
                  ? [new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value)), name]
                  : [value, name]
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {mode === "keuangan" ? (
              <>
                <Bar dataKey="pendapatan" name="Pendapatan" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="biaya" name="Biaya" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="laba" name="Laba" fill="#16a34a" radius={[3, 3, 0, 0]} />
              </>
            ) : (
              <>
                <Bar dataKey="transfer" name="Transfer" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="eWallet" name="E-Wallet/PPOB" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                <Bar dataKey="tarikTunai" name="Tarik Tunai" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
