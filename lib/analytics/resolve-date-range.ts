// Default rentang tanggal saat user belum menerapkan filter apa pun: 30 hari
// terakhir (dari "hari ini"), supaya KPI pertumbuhan periode & grafik langsung
// terisi tanpa perlu filter manual dulu. `startDateStr`/`endDateStr` dikembalikan
// juga supaya kolom filter di UI menampilkan rentang yang sedang aktif.
export function resolveDateRange(params: { startDate?: string; endDate?: string }) {
  if (!params.startDate && !params.endDate) {
    const now = new Date();
    const endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const start = new Date(endExclusive);
    start.setUTCDate(start.getUTCDate() - 30);
    const endInclusive = new Date(endExclusive.getTime() - 86400000);
    return {
      startDate: start,
      endDate: endExclusive,
      startDateStr: start.toISOString().slice(0, 10),
      endDateStr: endInclusive.toISOString().slice(0, 10),
    };
  }

  const endDate = params.endDate ? new Date(`${params.endDate}T00:00:00Z`) : undefined;
  const startDate = params.startDate ? new Date(`${params.startDate}T00:00:00Z`) : undefined;
  return {
    startDate,
    endDate: endDate ? new Date(endDate.getTime() + 86400000) : undefined,
    startDateStr: params.startDate,
    endDateStr: params.endDate,
  };
}
