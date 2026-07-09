import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const BRANCHES = [{ name: "Kersana", code: "KERSANA" }];

const EXPENSE_CATEGORIES = ["OPS", "PROMOSI"];

async function main() {
  for (const branch of BRANCHES) {
    await db.branch.upsert({
      where: { code: branch.code },
      update: {},
      create: branch,
    });
  }

  for (const name of EXPENSE_CATEGORIES) {
    await db.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "landosidauruk94@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ganti-password-ini";

  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Lando",
      passwordHash: await hashPassword(adminPassword),
    },
  });

  console.log(`Seed selesai. Login awal: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
