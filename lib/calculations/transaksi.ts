import type { Prisma } from "@/lib/generated/prisma/client";

type TxLike = {
  brilinkPendapatan: Prisma.Decimal | number;
  brilinkPpob: Prisma.Decimal | number;
  brilinkFee: Prisma.Decimal | number;
  accAicePendapatan: Prisma.Decimal | number;
  accAicePengeluaran: Prisma.Decimal | number;
  lainPendapatan: Prisma.Decimal | number;
  lainPengeluaran: Prisma.Decimal | number;
  asetPendapatan: Prisma.Decimal | number;
  asetPengeluaran: Prisma.Decimal | number;
  gajiKasbon: Prisma.Decimal | number;
  plusMinus: Prisma.Decimal | number;
  saldoAwal: Prisma.Decimal | number;
};

// Rumus diverifikasi cocok persis dengan data asli sheet "REKAP LAPORAN BREBES" (Juli 2026, Kersana):
// - Total Pendapatan (untuk laporan/dashboard) = Brilink (P.Adm+PPOB+Fee) + Lain-lain Pendapatan + Aset Pendapatan.
//   Acc & Aice TIDAK dihitung di sini karena punya metrik "Net Profit" sendiri (unit bisnis sampingan terpisah).
// - Total Pengeluaran (untuk laporan/dashboard) = Biaya (OPS+PROMOSI hari itu) + Lain-lain Pengeluaran + Aset Pengeluaran + Gaji.
// - Saldo Akhir (arus kas riil) = Saldo Awal + Total Pendapatan + Acc&Aice Pendapatan - Total Pengeluaran - Acc&Aice Pengeluaran + Plus Minus.
//   (Acc & Aice tetap memengaruhi kas meski tidak masuk metrik "Total Pendapatan/Pengeluaran" pelaporan.)
export function hitungTotalPendapatan(tx: TxLike) {
  return (
    Number(tx.brilinkPendapatan) +
    Number(tx.brilinkPpob) +
    Number(tx.brilinkFee) +
    Number(tx.lainPendapatan) +
    Number(tx.asetPendapatan)
  );
}

export function hitungTotalPengeluaran(tx: TxLike, totalBiayaHariItu = 0) {
  return (
    totalBiayaHariItu +
    Number(tx.lainPengeluaran) +
    Number(tx.asetPengeluaran) +
    Number(tx.gajiKasbon)
  );
}

export function hitungAccAiceNetProfit(tx: TxLike) {
  return Number(tx.accAicePendapatan) - Number(tx.accAicePengeluaran);
}

export function hitungSaldoAkhir(tx: TxLike, totalBiayaHariItu = 0) {
  return (
    Number(tx.saldoAwal) +
    hitungTotalPendapatan(tx) +
    Number(tx.accAicePendapatan) -
    hitungTotalPengeluaran(tx, totalBiayaHariItu) -
    Number(tx.accAicePengeluaran) +
    Number(tx.plusMinus)
  );
}
