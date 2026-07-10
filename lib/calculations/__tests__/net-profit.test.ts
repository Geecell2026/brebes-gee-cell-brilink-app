import { describe, expect, it } from "vitest";
import { hitungLabaDenganNetProfit, hitungNetProfitBreakdown, type MonthlyClosingLike } from "@/lib/calculations/net-profit";

function closing(overrides: Partial<MonthlyClosingLike> = {}): MonthlyClosingLike {
  return {
    year: 2026,
    month: 7,
    status: "FINAL",
    totalNetProfit: 100_000,
    netProfitAksesori: 60_000,
    netProfitAice: 40_000,
    ...overrides,
  };
}

describe("Net Profit Acc & Aice bulanan - laba (poin B, D, F, G, H spesifikasi)", () => {
  it("4. Net Profit FINAL menambah Pendapatan untuk Laba dan Laba Operasional", () => {
    const tanpaNetProfit = hitungLabaDenganNetProfit(1_000_000, 400_000, 0);
    const denganNetProfit = hitungLabaDenganNetProfit(1_000_000, 400_000, 100_000);
    expect(denganNetProfit.pendapatanUntukLaba - tanpaNetProfit.pendapatanUntukLaba).toBe(100_000);
    expect(denganNetProfit.laba - tanpaNetProfit.laba).toBe(100_000);
  });

  it("6. Net Profit berstatus DRAFT tidak dihitung sebagai laba aktual", () => {
    const bulan = [{ year: 2026, month: 7 }];
    const hasil = hitungNetProfitBreakdown([closing({ status: "DRAFT", totalNetProfit: 999_999 })], bulan);
    expect(hasil.total).toBe(0);
    expect(hasil.bulanBelumDitutup).toEqual(["Juli 2026"]);
  });

  it("7. Net Profit berstatus FINAL dihitung sebagai laba aktual", () => {
    const bulan = [{ year: 2026, month: 7 }];
    const hasil = hitungNetProfitBreakdown([closing({ status: "FINAL", totalNetProfit: 150_000 })], bulan);
    expect(hasil.total).toBe(150_000);
    expect(hasil.bulanBelumDitutup).toEqual([]);
  });

  it("8. null (belum ada split Aksesori/Aice) dibedakan dari 0 (nilai nol yang benar-benar tercatat)", () => {
    const bulan = [{ year: 2026, month: 5 }, { year: 2026, month: 6 }];
    // Mei: migrasi historis (split null). Juni: split lengkap tapi Aice-nya nol asli.
    const hasil = hitungNetProfitBreakdown(
      [
        closing({ month: 5, netProfitAksesori: null, netProfitAice: null, totalNetProfit: 85_897 }),
        closing({ month: 6, netProfitAksesori: 211_930, netProfitAice: 0, totalNetProfit: 211_930 }),
      ],
      bulan
    );
    // Karena salah satu bulan null-split, breakdown Aksesori/Aice keseluruhan jadi null
    // (tidak boleh menampilkan angka split palsu) - tapi total tetap angka asli, bukan 0.
    expect(hasil.aksesori).toBeNull();
    expect(hasil.aice).toBeNull();
    expect(hasil.total).toBe(85_897 + 211_930);
  });

  it("bulan tanpa penutupan FINAL sama sekali menghasilkan total 0 (bukan null) tapi masuk bulanBelumDitutup", () => {
    const hasil = hitungNetProfitBreakdown([], [{ year: 2026, month: 8 }]);
    expect(hasil.total).toBe(0);
    expect(hasil.bulanBelumDitutup).toEqual(["Agustus 2026"]);
  });
});

describe("Constraint satu FINAL per cabang per bulan (poin D & H spesifikasi)", () => {
  it("9. schema Prisma mendeklarasikan @@unique([branchId, year, month]) pada MonthlyClosing", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const schema = await fs.readFile(path.resolve(__dirname, "../../../prisma/schema.prisma"), "utf-8");
    const modelMatch = schema.match(/model MonthlyClosing \{[\s\S]*?\n\}/);
    expect(modelMatch).not.toBeNull();
    expect(modelMatch![0]).toMatch(/@@unique\(\[branchId,\s*year,\s*month\]\)/);
  });
});
