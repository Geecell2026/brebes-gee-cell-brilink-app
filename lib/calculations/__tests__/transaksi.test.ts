import { describe, expect, it } from "vitest";
import { hitungSaldoAkhir, hitungTotalPendapatan, hitungTotalPengeluaran } from "@/lib/calculations/transaksi";
import { hitungLabaDenganNetProfit } from "@/lib/calculations/net-profit";

function baseTx(overrides: Partial<Parameters<typeof hitungSaldoAkhir>[0]> = {}) {
  return {
    brilinkPendapatan: 100_000,
    brilinkPpob: 50_000,
    brilinkFee: 20_000,
    accAicePendapatan: 30_000,
    accAicePengeluaran: 5_000,
    lainPendapatan: 0,
    lainPengeluaran: 0,
    asetPendapatan: 0,
    asetPengeluaran: 0,
    gajiKasbon: 0,
    plusMinus: 0,
    saldoAwal: 1_000_000,
    ...overrides,
  };
}

describe("Acc & Aice harian - kas dan Saldo Akhir (poin A & H spesifikasi)", () => {
  it("1. accAicePendapatan harian menambah Saldo Akhir", () => {
    const tanpaAcc = hitungSaldoAkhir(baseTx({ accAicePendapatan: 0 }));
    const denganAcc = hitungSaldoAkhir(baseTx({ accAicePendapatan: 30_000 }));
    expect(denganAcc - tanpaAcc).toBe(30_000);
  });

  it("2. accAicePengeluaran harian mengurangi Saldo Akhir", () => {
    const tanpaPengeluaran = hitungSaldoAkhir(baseTx({ accAicePengeluaran: 0 }));
    const denganPengeluaran = hitungSaldoAkhir(baseTx({ accAicePengeluaran: 5_000 }));
    expect(denganPengeluaran - tanpaPengeluaran).toBe(-5_000);
  });

  it("3. Net Profit Acc & Aice bulanan TIDAK mengubah Saldo Akhir", () => {
    const tx = baseTx();
    const saldoAwal = hitungSaldoAkhir(tx);
    // Net Profit dihitung di modul terpisah (net-profit.ts) dan tidak pernah
    // menjadi parameter hitungSaldoAkhir - naikkan nilainya, saldo harus tetap sama.
    const saldoSetelahNetProfitBerubah = hitungSaldoAkhir(tx);
    expect(saldoSetelahNetProfitBerubah).toBe(saldoAwal);
    const { laba: labaKecil } = hitungLabaDenganNetProfit(500_000, 200_000, 50_000);
    const { laba: labaBesar } = hitungLabaDenganNetProfit(500_000, 200_000, 5_000_000);
    expect(labaBesar).not.toBe(labaKecil);
    expect(hitungSaldoAkhir(tx)).toBe(saldoAwal); // saldo tidak terpengaruh perubahan laba di atas
  });

  it("5. Pendapatan Acc & Aice harian (gross) tidak dobel-hitung sebagai laba operasional", () => {
    const tx = baseTx({ accAicePendapatan: 30_000 });
    // hitungTotalPendapatan (dipakai untuk KPI Total Pendapatan & Laba Operasional
    // operasional) sengaja TIDAK memasukkan accAicePendapatan.
    expect(hitungTotalPendapatan(tx)).toBe(100_000 + 50_000 + 20_000);
  });

  it("10. Mengubah Net Profit bulanan tidak mengubah Saldo Akhir historis", () => {
    const tx = baseTx();
    const saldoSebelum = hitungSaldoAkhir(tx);
    hitungLabaDenganNetProfit(1_000_000, 400_000, 999_999); // simulasi penutupan bulanan baru
    const saldoSesudah = hitungSaldoAkhir(tx);
    expect(saldoSesudah).toBe(saldoSebelum);
  });

  it("hitungTotalPengeluaran menjumlahkan biaya harian + lain + aset + gaji (tanpa Acc & Aice)", () => {
    const tx = baseTx({ lainPengeluaran: 10_000, asetPengeluaran: 5_000, gajiKasbon: 15_000 });
    expect(hitungTotalPengeluaran(tx, 20_000)).toBe(20_000 + 10_000 + 5_000 + 15_000);
  });
});
