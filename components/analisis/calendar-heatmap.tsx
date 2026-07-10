import type { DailyPoint } from "@/types/analytics";

const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const HARI_HEADER = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

type Level = "ramai" | "normal" | "sepi" | "kosong";

const LEVEL_STYLE: Record<Level, string> = {
  ramai: "bg-green-600 text-white",
  normal: "bg-blue-300 text-blue-900",
  sepi: "bg-amber-200 text-amber-900",
  kosong: "bg-neutral-100 text-neutral-300",
};

// Poin 6E spesifikasi: kalender aktivitas transaksi (heatmap sederhana per bulan).
export function CalendarHeatmap({ points }: { points: DailyPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-neutral-400">Belum ada data untuk ditampilkan.</p>;
  }

  const avg = points.reduce((s, p) => s + p.totalTransaksi, 0) / points.length;
  const sd = Math.sqrt(points.reduce((s, p) => s + (p.totalTransaksi - avg) ** 2, 0) / points.length);

  function levelFor(value: number): Level {
    if (value >= avg + 0.5 * sd) return "ramai";
    if (value <= avg - 0.5 * sd) return "sepi";
    return "normal";
  }

  const byDate = new Map(points.map((p) => [p.date.toISOString().slice(0, 10), p]));
  const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;

  const bulanList: { tahun: number; bulan: number }[] = [];
  const cursor = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
  const akhir = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1));
  while (cursor.getTime() <= akhir.getTime()) {
    bulanList.push({ tahun: cursor.getUTCFullYear(), bulan: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return (
    <div className="space-y-6">
      {bulanList.map(({ tahun, bulan }) => {
        const jumlahHari = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
        const hariPertama = new Date(Date.UTC(tahun, bulan - 1, 1)).getUTCDay();
        const cells: (number | null)[] = [...Array(hariPertama).fill(null), ...Array.from({ length: jumlahHari }, (_, i) => i + 1)];

        return (
          <div key={`${tahun}-${bulan}`}>
            <p className="mb-2 text-xs font-medium text-neutral-600">
              {NAMA_BULAN[bulan - 1]} {tahun}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-400">
              {HARI_HEADER.map((h) => (
                <div key={h}>{h}</div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dateKey = `${tahun}-${String(bulan).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const point = byDate.get(dateKey);
                const level: Level = point ? levelFor(point.totalTransaksi) : "kosong";
                return (
                  <div
                    key={i}
                    title={point ? `${dateKey}: ${point.totalTransaksi} transaksi` : `${dateKey}: tidak ada data`}
                    className={`flex aspect-square items-center justify-center rounded text-[10px] font-medium ${LEVEL_STYLE[level]}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex flex-wrap gap-3 text-xs text-neutral-600">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-green-600" /> Ramai
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-blue-300" /> Normal
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-amber-200" /> Sepi
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-neutral-100" /> Tidak Ada Data
        </span>
      </div>
    </div>
  );
}
