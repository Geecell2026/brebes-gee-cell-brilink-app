import { describe, expect, it } from "vitest";
import { bersihkanAngkaInput, formatRupiahInput, parseRupiahInput } from "@/lib/format/currency-input";

describe("formatRupiahInput", () => {
  it("1. 1000 -> Rp1.000", () => {
    expect(formatRupiahInput(1000)).toBe("Rp1.000");
  });

  it("2. 1500000 -> Rp1.500.000", () => {
    expect(formatRupiahInput(1500000)).toBe("Rp1.500.000");
  });

  it("0 -> Rp0", () => {
    expect(formatRupiahInput(0)).toBe("Rp0");
  });

  it("null/undefined -> string kosong (bukan NaN)", () => {
    expect(formatRupiahInput(null)).toBe("");
    expect(formatRupiahInput(undefined)).toBe("");
  });

  it("NaN -> string kosong", () => {
    expect(formatRupiahInput(NaN)).toBe("");
  });

  it("angka negatif -> -Rp... (konsisten satu format)", () => {
    expect(formatRupiahInput(-50000)).toBe("-Rp50.000");
  });
});

describe("parseRupiahInput", () => {
  it("3. 'Rp1.500.000' diparse menjadi 1500000", () => {
    expect(parseRupiahInput("Rp1.500.000")).toBe(1500000);
  });

  it("7. paste 'Rp 1.500.000' tetap menjadi 1500000", () => {
    expect(parseRupiahInput("Rp 1.500.000")).toBe(1500000);
  });

  it("angka polos '1500000' tetap 1500000", () => {
    expect(parseRupiahInput("1500000")).toBe(1500000);
  });

  it("'1.500.000' (sudah ada titik ribuan) tetap 1500000", () => {
    expect(parseRupiahInput("1.500.000")).toBe(1500000);
  });

  it("10. koma dibersihkan jadi digit murni: '1,500,000' -> 1500000 (bukan NaN)", () => {
    expect(parseRupiahInput("1,500,000")).toBe(1500000);
  });

  it("8. field kosong -> null, bukan NaN", () => {
    expect(parseRupiahInput("")).toBeNull();
  });

  it("hanya tanda minus -> null (belum berupa angka)", () => {
    expect(parseRupiahInput("-", true)).toBeNull();
  });

  it("angka negatif hanya diproses saat allowNegative true", () => {
    expect(parseRupiahInput("-50000", true)).toBe(-50000);
    expect(parseRupiahInput("-50000", false)).toBe(50000);
  });

  it("tidak pernah menghasilkan NaN untuk input sembarang", () => {
    expect(Number.isNaN(parseRupiahInput("abc") ?? 0)).toBe(false);
    expect(parseRupiahInput("abc")).toBeNull();
  });
});

describe("bersihkanAngkaInput", () => {
  it("membuang semua karakter selain digit", () => {
    expect(bersihkanAngkaInput("Rp1.500.000", false)).toBe("1500000");
  });

  it("tidak menghasilkan RpRp atau pemisah ganda (output selalu digit murni)", () => {
    const cleaned = bersihkanAngkaInput("RpRp1..500...000", false);
    expect(cleaned).toBe("1500000");
  });

  it("tanda minus dibuang kalau allowNegative false", () => {
    expect(bersihkanAngkaInput("-50000", false)).toBe("50000");
  });

  it("satu tanda minus di depan dipertahankan kalau allowNegative true", () => {
    expect(bersihkanAngkaInput("-50000", true)).toBe("-50000");
  });
});

describe("round-trip format <-> parse (edit data lama tidak mengubah nilai)", () => {
  it("5 & 6. nilai database 1500000 -> tampil Rp1.500.000 -> disimpan ulang tetap 1500000", () => {
    const dariDatabase = 1500000;
    const tampilan = formatRupiahInput(dariDatabase);
    expect(tampilan).toBe("Rp1.500.000");
    const disimpanUlang = parseRupiahInput(tampilan);
    expect(disimpanUlang).toBe(dariDatabase);
  });

  it("nilai 0 dari database tidak berubah setelah format+parse ulang", () => {
    expect(parseRupiahInput(formatRupiahInput(0))).toBe(0);
  });
});
