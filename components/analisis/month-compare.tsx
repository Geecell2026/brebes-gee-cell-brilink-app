import type { BulanAgregat } from "@/types/analytics";

function formatAngka(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
}

export function MonthCompare({ bulanan }: { bulanan: BulanAgregat[] }) {
  if (bulanan.length < 2) {
    return (
      <p className="text-sm text-neutral-400">
        Butuh minimal 2 bulan data untuk perbandingan. Saat ini baru ada {bulanan.length} bulan.
      </p>
    );
  }

  const [bulanPertama, bulanKedua] = bulanan.slice(-2);
  const rows: { label: string; a: string; b: string }[] = [
    { label: "Total Transaksi", a: formatAngka(bulanPertama.total), b: formatAngka(bulanKedua.total) },
    { label: "Rata-rata Harian", a: formatAngka(bulanPertama.rataRataHarian), b: formatAngka(bulanKedua.rataRataHarian) },
    { label: "Tertinggi", a: formatAngka(bulanPertama.maksimum), b: formatAngka(bulanKedua.maksimum) },
    { label: "Terendah", a: formatAngka(bulanPertama.minimum), b: formatAngka(bulanKedua.minimum) },
    { label: "Hari Buka", a: String(bulanPertama.hariBuka), b: String(bulanKedua.hariBuka) },
  ];

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="py-2">Metrik</th>
              <th className="py-2 text-right">{bulanPertama.label}</th>
              <th className="py-2 text-right">{bulanKedua.label}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-neutral-100 last:border-0">
                <td className="py-2 text-neutral-700">{r.label}</td>
                <td className="py-2 text-right tabular-nums">{r.a}</td>
                <td className="py-2 text-right tabular-nums font-medium">{r.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bulanKedua.pertumbuhanPersen !== null && (
        <p
          className={`text-sm font-medium ${bulanKedua.pertumbuhanPersen >= 0 ? "text-green-700" : "text-red-700"}`}
        >
          Pertumbuhan {bulanKedua.label} vs {bulanPertama.label}: {bulanKedua.pertumbuhanPersen >= 0 ? "+" : ""}
          {bulanKedua.pertumbuhanPersen.toFixed(2)}%
        </p>
      )}
    </div>
  );
}
