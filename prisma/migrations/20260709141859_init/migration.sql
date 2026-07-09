-- CreateEnum
CREATE TYPE "StatusHari" AS ENUM ('BUKA', 'LIBUR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTransaction" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "StatusHari" NOT NULL DEFAULT 'BUKA',
    "brilinkPendapatan" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "brilinkPpob" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "brilinkFee" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "accAicePendapatan" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "accAicePengeluaran" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lainKeterangan" TEXT,
    "lainPendapatan" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "lainPengeluaran" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "asetPendapatan" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "asetPengeluaran" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gajiKasbon" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "plusMinus" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saldoAwal" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saldoAkhir" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PvEntry" (
    "id" TEXT NOT NULL,
    "dailyTransactionId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "PvEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionTellerBreakdown" (
    "id" TEXT NOT NULL,
    "dailyTransactionId" TEXT NOT NULL,
    "tellerName" TEXT NOT NULL,
    "transfer" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "eWallet" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "itTt" DECIMAL(14,2) NOT NULL DEFAULT 0,

    CONSTRAINT "TransactionTellerBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseEntry" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "categoryId" TEXT NOT NULL,
    "keterangan" TEXT NOT NULL,
    "totalPembayaran" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "statusSangatBaik" DECIMAL(14,2) NOT NULL DEFAULT 1000000,
    "statusBaik" DECIMAL(14,2) NOT NULL DEFAULT 500000,
    "statusPerluPerhatian" DECIMAL(14,2) NOT NULL DEFAULT 200000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_name_key" ON "Branch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "DailyTransaction_branchId_date_idx" ON "DailyTransaction"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTransaction_branchId_date_key" ON "DailyTransaction"("branchId", "date");

-- CreateIndex
CREATE INDEX "PvEntry_dailyTransactionId_idx" ON "PvEntry"("dailyTransactionId");

-- CreateIndex
CREATE INDEX "TransactionTellerBreakdown_dailyTransactionId_idx" ON "TransactionTellerBreakdown"("dailyTransactionId");

-- CreateIndex
CREATE INDEX "ExpenseEntry_branchId_date_idx" ON "ExpenseEntry"("branchId", "date");

-- AddForeignKey
ALTER TABLE "DailyTransaction" ADD CONSTRAINT "DailyTransaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PvEntry" ADD CONSTRAINT "PvEntry_dailyTransactionId_fkey" FOREIGN KEY ("dailyTransactionId") REFERENCES "DailyTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTellerBreakdown" ADD CONSTRAINT "TransactionTellerBreakdown_dailyTransactionId_fkey" FOREIGN KEY ("dailyTransactionId") REFERENCES "DailyTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseEntry" ADD CONSTRAINT "ExpenseEntry_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
