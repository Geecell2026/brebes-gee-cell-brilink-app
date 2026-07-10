import "dotenv/config";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Nilai riil ditemukan di kolom "Acc & Aice NET PROFIT (DIISI AKHIR BULAN)" pada
// tab "BREBES" sheet "REKAP LAPORAN BREBES" - hanya 2 bulan yang sudah ditutup
// (Mei, Juni); Juli belum ditutup jadi tidak diisi. Data lama cuma gabungan
// (tidak ada pemisahan Aksesori/Aice), sesuai instruksi tidak dipaksa dipisah.
const HISTORICAL_NET_PROFIT = [
  { year: 2026, month: 5, total: 85897 },
  { year: 2026, month: 6, total: 211930 },
];

async function main() {
  const branch = await db.branch.findUnique({ where: { code: "KERSANA" } });
  if (!branch) throw new Error("Cabang KERSANA tidak ditemukan");

  for (const row of HISTORICAL_NET_PROFIT) {
    await db.monthlyClosing.upsert({
      where: { branchId_year_month: { branchId: branch.id, year: row.year, month: row.month } },
      update: {},
      create: {
        branchId: branch.id,
        year: row.year,
        month: row.month,
        netProfitAksesori: null,
        netProfitAice: null,
        totalNetProfit: row.total,
        keterangan: "Migrasi dari data historis sheet (gabungan, tidak terpisah Aksesori/Aice)",
        status: "FINAL",
      },
    });
    console.log(`OK: ${row.year}-${row.month} = Rp${row.total}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
