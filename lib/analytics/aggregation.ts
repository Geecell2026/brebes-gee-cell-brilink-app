import type {
  BulanAgregat,
  DailyPoint,
  MingguAgregat,
  PolaHari,
  PosisiBulan,
} from "@/types/analytics";
import { pertumbuhanPersen, rataRata } from "./statistics";

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function posisiBulanDari(hariKeBulan: number): PosisiBulan {
  if (hariKeBulan <= 10) return "AWAL";
  if (hariKeBulan <= 20) return "TENGAH";
  return "AKHIR";
}

export type RawTx = { date: Date; branchName: string; totalTransaksi: number; status: "BUKA" | "LIBUR" };

// Poin 3 spesifikasi: kolom turunan otomatis dari tanggal.
export function perkayaDailyPoints(rows: RawTx[]): DailyPoint[] {
  return rows.map((r) => {
    const day = r.date.getUTCDay();
    const hariKeBulan = r.date.getUTCDate();
    return {
      date: r.date,
      branchName: r.branchName,
      totalTransaksi: r.totalTransaksi,
      namaHari: NAMA_HARI[day],
      isoWeek: isoWeekNumber(r.date),
      mingguKeBulan: Math.ceil(hariKeBulan / 7),
      bulan: r.date.getUTCMonth() + 1,
      tahun: r.date.getUTCFullYear(),
      hariKeBulan,
      posisiBulan: posisiBulanDari(hariKeBulan),
      hariKerjaLibur: day === 0 || day === 6 ? "AKHIR_PEKAN" : "KERJA",
      status: r.status,
    };
  });
}

export function formatBulanLabel(bulan: number, tahun: number): string {
  return `${NAMA_BULAN[bulan - 1]} ${tahun}`;
}

// Agregasi mingguan (berdasarkan ISO week), diurutkan kronologis.
export function agregasiMingguan(points: DailyPoint[]): MingguAgregat[] {
  const groups = new Map<string, DailyPoint[]>();
  for (const p of points) {
    const key = `${p.tahun}-${p.isoWeek}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const [ya, wa] = a.split("-").map(Number);
    const [yb, wb] = b.split("-").map(Number);
    return ya !== yb ? ya - yb : wa - wb;
  });

  const result: MingguAgregat[] = [];
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const group = groups.get(key)!.sort((a, b) => a.date.getTime() - b.date.getTime());
    const [tahun, nomorMinggu] = key.split("-").map(Number);
    const total = group.reduce((sum, p) => sum + p.totalTransaksi, 0);
    const first = group[0].date;
    const last = group[group.length - 1].date;
    const label = `Minggu ${nomorMinggu} (${first.getUTCDate()}-${last.getUTCDate()} ${formatBulanLabel(last.getUTCMonth() + 1, tahun).split(" ")[0]})`;

    const prevKey = i > 0 ? sortedKeys[i - 1] : null;
    const prevTotal = prevKey ? groups.get(prevKey)!.reduce((sum, p) => sum + p.totalTransaksi, 0) : null;

    result.push({
      label,
      tahun,
      nomorMinggu,
      total,
      rataRataPerHari: rataRata(group.map((p) => p.totalTransaksi)),
      pertumbuhanPersen: prevTotal !== null ? pertumbuhanPersen(total, prevTotal) : null,
    });
  }
  return result;
}

// Agregasi bulanan.
export function agregasiBulanan(points: DailyPoint[]): BulanAgregat[] {
  const groups = new Map<string, DailyPoint[]>();
  for (const p of points) {
    const key = `${p.tahun}-${p.bulan}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const [ya, ma] = a.split("-").map(Number);
    const [yb, mb] = b.split("-").map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });

  const result: BulanAgregat[] = [];
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const group = groups.get(key)!;
    const [tahun, bulan] = key.split("-").map(Number);
    const values = group.map((p) => p.totalTransaksi);
    const total = values.reduce((sum, v) => sum + v, 0);

    const prevKey = i > 0 ? sortedKeys[i - 1] : null;
    const prevTotal = prevKey
      ? groups.get(prevKey)!.reduce((sum, p) => sum + p.totalTransaksi, 0)
      : null;

    result.push({
      label: formatBulanLabel(bulan, tahun),
      tahun,
      bulan,
      total,
      rataRataHarian: rataRata(values),
      maksimum: values.length > 0 ? Math.max(...values) : 0,
      minimum: values.length > 0 ? Math.min(...values) : 0,
      hariBuka: group.filter((p) => p.status === "BUKA").length,
      pertumbuhanPersen: prevTotal !== null ? pertumbuhanPersen(total, prevTotal) : null,
    });
  }
  return result;
}

// Pola rata-rata transaksi per hari dalam seminggu (Senin s/d Minggu, urut hari kerja Indonesia).
export function polaPerHari(points: DailyPoint[]): PolaHari[] {
  const urutan = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  return urutan.map((nama) => {
    const sampel = points.filter((p) => p.namaHari === nama).map((p) => p.totalTransaksi);
    return { namaHari: nama, rataRata: rataRata(sampel), jumlahSampel: sampel.length };
  });
}
