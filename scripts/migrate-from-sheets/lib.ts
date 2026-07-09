const BULAN_EN: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

// Format: "Thursday, 07 May 2026 " (weekday, DD Month YYYY) - format asli sel tanggal
// di tab BREBES pada sheet "REKAP LAPORAN BREBES".
export function parseTanggalInggris(raw: string): Date | null {
  if (!raw) return null;
  const match = raw.trim().match(/,\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!match) return null;
  const [, dStr, monthName, yStr] = match;
  const month = BULAN_EN[monthName.toLowerCase()];
  if (!month) return null;
  return new Date(Date.UTC(Number(yStr), month - 1, Number(dStr)));
}

export function toNumber(val: unknown): number {
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
