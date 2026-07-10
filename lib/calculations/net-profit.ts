import type { Prisma } from "@/lib/generated/prisma/client";

const BULAN_PANJANG = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export type MonthlyClosingLike = {
  year: number;
  month: number;
  status: "DRAFT" | "FINAL";
  totalNetProfit: Prisma.Decimal | number;
  netProfitAksesori: Prisma.Decimal | number | null;
  netProfitAice: Prisma.Decimal | number | null;
};

export type NetProfitBreakdown = {
  total: number;
  aksesori: number | null;
  aice: number | null;
  bulanBelumDitutup: string[];
};

// Fungsi murni (tanpa DB) - hanya baris berstatus FINAL yang dihitung sebagai
// aktual (poin D & H spesifikasi Acc & Aice: Draft tidak boleh masuk laba
// aktual). aksesori/aice jadi null kalau ADA bulan FINAL yang datanya cuma
// gabungan (migrasi historis), supaya UI tidak menampilkan angka split palsu.
export function hitungNetProfitBreakdown(
  closings: MonthlyClosingLike[],
  months: { year: number; month: number }[]
): NetProfitBreakdown {
  const finalClosings = closings.filter((c) => c.status === "FINAL");

  let total = 0;
  let aksesoriSum = 0;
  let aiceSum = 0;
  let adaSplitNull = false;
  const closedKeys = new Set(finalClosings.map((c) => `${c.year}-${c.month}`));

  for (const c of finalClosings) {
    total += Number(c.totalNetProfit);
    if (c.netProfitAksesori !== null) aksesoriSum += Number(c.netProfitAksesori);
    else adaSplitNull = true;
    if (c.netProfitAice !== null) aiceSum += Number(c.netProfitAice);
    else adaSplitNull = true;
  }

  const bulanBelumDitutup = months
    .filter((m) => !closedKeys.has(`${m.year}-${m.month}`))
    .map((m) => `${BULAN_PANJANG[m.month - 1]} ${m.year}`);

  return {
    total,
    aksesori: adaSplitNull ? null : aksesoriSum,
    aice: adaSplitNull ? null : aiceSum,
    bulanBelumDitutup,
  };
}

// Poin B: Laba Operasional = Pendapatan untuk Laba - Biaya. Net Profit Acc &
// Aice masuk ke pendapatan-untuk-laba, TIDAK PERNAH ke Saldo Akhir (fungsi ini
// sengaja tidak menyentuh saldo sama sekali - lihat hitungSaldoAkhir di
// lib/calculations/transaksi.ts yang independen dari modul ini).
export function hitungLabaDenganNetProfit(pendapatan: number, biaya: number, netProfitFinal: number) {
  const pendapatanUntukLaba = pendapatan + netProfitFinal;
  const laba = pendapatanUntukLaba - biaya;
  const margin = pendapatanUntukLaba > 0 ? (laba / pendapatanUntukLaba) * 100 : null;
  return { pendapatanUntukLaba, laba, margin };
}
