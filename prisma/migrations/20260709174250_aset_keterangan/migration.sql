/*
  Warnings:

  - You are about to drop the column `lainKeterangan` on the `DailyTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DailyTransaction" DROP COLUMN "lainKeterangan",
ADD COLUMN     "asetKeterangan" TEXT;
