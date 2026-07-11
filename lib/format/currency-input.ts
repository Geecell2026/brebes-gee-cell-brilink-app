// Utility khusus untuk field input nominal di form Transaksi Harian.
// BUKAN pengganti formatRupiah tampilan yang sudah dipakai di Dashboard/tabel/
// laporan (masing-masing didefinisikan lokal per halaman dan sengaja tidak
// disentuh) - ini murni untuk mengubah tampilan input saat diketik.

const FORMATTER = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/**
 * Bersihkan input mentah (ketikan atau paste) jadi string digit murni,
 * opsional dengan satu tanda minus di depan. Menerima "Rp1.500.000",
 * "Rp 1.500.000", "1.500.000", "1500000" - semua jadi "1500000".
 */
export function bersihkanAngkaInput(raw: string, allowNegative: boolean): string {
  const isNegative = allowNegative && /^\s*-/.test(raw);
  const digitsOnly = raw.replace(/[^0-9]/g, "");
  return (isNegative && digitsOnly !== "" ? "-" : "") + digitsOnly;
}

/** String digit murni ("1500000" / "-50000" / "" / "-") -> number | null. */
export function parseRupiahInput(raw: string, allowNegative = false): number | null {
  const cleaned = bersihkanAngkaInput(raw, allowNegative);
  if (cleaned === "" || cleaned === "-") return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return value;
}

/** number | null -> tampilan "Rp1.500.000" / "-Rp50.000" / "" (kalau null/NaN). */
export function formatRupiahInput(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  const sign = value < 0 ? "-" : "";
  return `${sign}Rp${FORMATTER.format(Math.abs(value))}`;
}
