import { db } from "@/lib/db";

const BULAN_SINGKAT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export async function getTotalTransaksiTrend(bulanTerakhir = 6, branchId?: string) {
  const now = new Date();
  const result: { bulan: string; totalTrx: number }[] = [];

  for (let i = bulanTerakhir - 1; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));

    const rows = await db.transactionTellerBreakdown.findMany({
      where: {
        dailyTransaction: {
          date: { gte: monthStart, lt: monthEnd },
          ...(branchId ? { branchId } : {}),
        },
      },
      select: { transfer: true, eWallet: true, itTt: true },
    });
    const totalTrx = rows.reduce((sum, r) => sum + Number(r.transfer) + Number(r.eWallet) + Number(r.itTt), 0);

    result.push({ bulan: `${BULAN_SINGKAT[month - 1]} ${year}`, totalTrx });
  }

  return result;
}

export async function getTotalTransaksiDetail(params: { branchId?: string; startDate: Date; endDate: Date }) {
  const rows = await db.transactionTellerBreakdown.findMany({
    where: {
      dailyTransaction: {
        date: { gte: params.startDate, lt: params.endDate },
        ...(params.branchId ? { branchId: params.branchId } : {}),
      },
    },
    include: { dailyTransaction: { include: { branch: true } } },
    orderBy: { dailyTransaction: { date: "asc" } },
  });

  return rows.map((r) => ({
    id: r.id,
    date: r.dailyTransaction.date,
    branchName: r.dailyTransaction.branch.name,
    tellerName: r.tellerName,
    transfer: Number(r.transfer),
    eWallet: Number(r.eWallet),
    itTt: Number(r.itTt),
    total: Number(r.transfer) + Number(r.eWallet) + Number(r.itTt),
  }));
}
