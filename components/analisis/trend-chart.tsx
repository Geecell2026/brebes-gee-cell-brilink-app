"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendChartPoint = {
  tanggal: string; // label tampilan, misal "01 Jul"
  namaHari: string;
  aktual: number | null;
  ma7: number | null;
  target: number | null;
  forecast: number | null;
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendChartPoint }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-2 text-xs shadow-sm">
      <p className="font-medium text-neutral-800">
        {d.namaHari}, {d.tanggal}
      </p>
      <p className="text-neutral-600">Aktual: {d.aktual}</p>
      {d.ma7 !== null && <p className="text-blue-600">Rata-rata 7 hari: {d.ma7.toFixed(1)}</p>}
      {d.forecast !== null && <p className="text-amber-600">Forecast: {d.forecast.toFixed(1)}</p>}
      {d.target !== null && <p className="text-green-600">Target: {d.target}</p>}
    </div>
  );
}

export function TrendChart({ data }: { data: TrendChartPoint[] }) {
  const adaTarget = data.some((d) => d.target !== null);
  const adaForecast = data.some((d) => d.forecast !== null);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={35} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="aktual" stroke="#2563eb" strokeWidth={2} dot={false} name="Aktual" />
          <Line type="monotone" dataKey="ma7" stroke="#7c3aed" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="Rata-rata 7 Hari" />
          {adaTarget && (
            <Line type="monotone" dataKey="target" stroke="#16a34a" strokeWidth={1.5} dot={false} name="Target" />
          )}
          {adaForecast && (
            <Line type="monotone" dataKey="forecast" stroke="#d97706" strokeWidth={1.5} dot={false} strokeDasharray="2 2" name="Forecast" />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
