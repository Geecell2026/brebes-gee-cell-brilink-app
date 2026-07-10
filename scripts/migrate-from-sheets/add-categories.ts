import "dotenv/config";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const NEW_CATEGORIES = [
  "ADM MUTASI BANK",
  "MAKAN",
  "KONSUMSI TOKO",
  "KONSUMSI KARYAWAN",
  "TRANSPORT",
  "B. PROMOSI",
  "PERLENGKAPAN",
  "PERALATAN",
  "GAJI",
];

async function main() {
  for (const name of NEW_CATEGORIES) {
    await db.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Kategori ditambahkan:", NEW_CATEGORIES.join(", "));

  const all = await db.expenseCategory.findMany({ orderBy: { name: "asc" } });
  console.log("Semua kategori sekarang:", all.map((c) => `${c.name}${c.isActive ? "" : " (nonaktif)"}`).join(", "));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
