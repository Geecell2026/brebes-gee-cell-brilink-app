import type { DailyPoint } from "@/types/analytics";

export type ValidationIssue = { jenis: string; detail: string; level: "info" | "warning" };

// Poin 3 spesifikasi, disesuaikan: karena sumber data adalah input Transaksi
// Harian yang sudah tervalidasi lewat Prisma (unique branchId+date, kolom numerik
// wajib), sebagian besar cek "otomatis lolos" - yang paling relevan diperiksa
// ulang di sini adalah gap tanggal dan variasi penulisan nama cabang.
export function validasiKualitasData(points: DailyPoint[], branchNames: string[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const negatif = points.filter((p) => p.totalTransaksi < 0);
  if (negatif.length > 0) {
    issues.push({ jenis: "Angka Negatif", detail: `${negatif.length} baris memiliki total transaksi negatif.`, level: "warning" });
  } else {
    issues.push({ jenis: "Angka Negatif", detail: "Tidak ditemukan nilai negatif.", level: "info" });
  }

  issues.push({
    jenis: "Data Duplikat",
    detail: "Tidak mungkin terjadi - kombinasi cabang+tanggal dijaga unik oleh database.",
    level: "info",
  });

  if (points.length >= 2) {
    const sorted = [...points].sort((a, b) => a.date.getTime() - b.date.getTime());
    const gaps: string[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const selisihHari = Math.round((sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / 86400000);
      if (selisihHari > 1) {
        gaps.push(`${sorted[i - 1].date.toLocaleDateString("id-ID")} → ${sorted[i].date.toLocaleDateString("id-ID")} (${selisihHari - 1} hari kosong)`);
      }
    }
    if (gaps.length > 0) {
      issues.push({ jenis: "Tanggal Tanpa Data", detail: gaps.join("; "), level: "warning" });
    } else {
      issues.push({ jenis: "Tanggal Tanpa Data", detail: "Tidak ada celah tanggal pada rentang data.", level: "info" });
    }
  }

  const normalisasi = new Map<string, string[]>();
  for (const name of branchNames) {
    const key = name.trim().toLowerCase();
    if (!normalisasi.has(key)) normalisasi.set(key, []);
    normalisasi.get(key)!.push(name);
  }
  const mungkinTidakKonsisten = Array.from(normalisasi.values()).filter((v) => new Set(v).size > 1);
  if (mungkinTidakKonsisten.length > 0) {
    issues.push({
      jenis: "Penulisan Cabang Tidak Konsisten",
      detail: mungkinTidakKonsisten.map((v) => v.join(" / ")).join(", "),
      level: "warning",
    });
  } else {
    issues.push({ jenis: "Penulisan Cabang Tidak Konsisten", detail: "Penulisan nama cabang konsisten.", level: "info" });
  }

  return issues;
}
