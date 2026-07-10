-- CreateEnum
CREATE TYPE "StatusPenutupan" AS ENUM ('DRAFT', 'FINAL');

-- CreateTable
CREATE TABLE "MonthlyClosing" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "netProfitAksesori" DECIMAL(14,2),
    "netProfitAice" DECIMAL(14,2),
    "totalNetProfit" DECIMAL(14,2) NOT NULL,
    "keterangan" TEXT,
    "status" "StatusPenutupan" NOT NULL DEFAULT 'DRAFT',
    "tanggalInput" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyClosing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyClosing_branchId_year_month_key" ON "MonthlyClosing"("branchId", "year", "month");

-- AddForeignKey
ALTER TABLE "MonthlyClosing" ADD CONSTRAINT "MonthlyClosing_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
