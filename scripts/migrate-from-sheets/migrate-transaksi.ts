import "dotenv/config";
import path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { parseTanggalInggris, toNumber } from "./lib";
import {
  hitungTotalPendapatan,
  hitungTotalPengeluaran,
  hitungSaldoAkhir,
} from "../../lib/calculations/transaksi";

const SOURCE_FILE = path.resolve(__dirname, "source-data/brebes.xlsx");
const BRANCH_CODE = "KERSANA";

// Kolom (0-based) di tab "BREBES", sesuai merge header yang sudah diverifikasi:
// A=Tanggal | B-D=Brilink(P.ADM,PPOB,FEE) | E-G=Acc&Aice(Pend,Peng,NetProfit)
// | H-I=Lain-lain(Pend,Peng) | J-L=Aset(Ket,Pend,Peng) | M-N=Pengeluaran(OPS,PROMOSI)
// | O-P=PV(Erwin,Lando) | Q=Gaji | R=Plus minus | S=TTL Pendapatan(sheet) | T=TTL Pengeluaran(sheet)
// | U=Saldo Awal | V=Saldo Akhir(sheet) | W-AA=Quantity(Transfer,EWallet,ItTt,TotalTrx,NamaTeller) | AB=Status
const COL = {
  tanggal: 0,
  brilinkPendapatan: 1,
  brilinkPpob: 2,
  brilinkFee: 3,
  accAicePendapatan: 4,
  accAicePengeluaran: 5,
  lainPendapatan: 7,
  lainPengeluaran: 8,
  asetKeterangan: 9,
  asetPendapatan: 10,
  asetPengeluaran: 11,
  biayaOps: 12,
  biayaPromosi: 13,
  pvErwin: 14,
  pvLando: 15,
  gajiKasbon: 16,
  plusMinus: 17,
  sheetTotalPendapatan: 18,
  sheetTotalPengeluaran: 19,
  saldoAwal: 20,
  sheetSaldoAkhir: 21,
  transfer: 22,
  eWallet: 23,
  itTt: 24,
  totalTrx: 25,
  namaTeller: 26,
  status: 27,
};

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const branch = await db.branch.findUnique({ where: { code: BRANCH_CODE } });
  if (!branch) throw new Error(`Cabang ${BRANCH_CODE} tidak ditemukan`);

  const categories = await db.expenseCategory.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  const wb = XLSX.readFile(SOURCE_FILE);
  const ws = wb.Sheets["BREBES"];
  const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: true, defval: "" });
  const fmt = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "" });
  const dataRows = raw.slice(2);
  const dataRowsFmt = fmt.slice(2);

  // Pakai komponen tanggal LOKAL (proses ini jalan di WIB) supaya "hari ini" cocok
  // dengan kalender bisnis, bukan sekadar potongan UTC (yang bisa mundur 1 hari
  // karena WIB = UTC+7).
  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  let created = 0;
  let skippedFuture = 0;
  let skippedNoDate = 0;
  let skippedExisting = 0;
  let mismatchCount = 0;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let totalOmset = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const rowFmt = dataRowsFmt[i];
    const dateStr = String(rowFmt[COL.tanggal] ?? "").trim();
    if (!dateStr) continue;

    const date = parseTanggalInggris(dateStr);
    if (!date) {
      skippedNoDate++;
      console.warn(`Tidak bisa parse tanggal: "${dateStr}"`);
      continue;
    }
    if (date.getTime() >= cutoff.getTime()) {
      skippedFuture++;
      continue;
    }

    const existing = await db.dailyTransaction.findUnique({
      where: { branchId_date: { branchId: branch.id, date } },
    });
    if (existing) {
      skippedExisting++;
      continue;
    }

    const statusRaw = String(row[COL.status] ?? "").trim().toUpperCase();
    const status = statusRaw === "LIBUR" ? "LIBUR" : "BUKA";

    const fields = {
      brilinkPendapatan: toNumber(row[COL.brilinkPendapatan]),
      brilinkPpob: toNumber(row[COL.brilinkPpob]),
      brilinkFee: toNumber(row[COL.brilinkFee]),
      accAicePendapatan: toNumber(row[COL.accAicePendapatan]),
      accAicePengeluaran: toNumber(row[COL.accAicePengeluaran]),
      lainPendapatan: toNumber(row[COL.lainPendapatan]),
      lainPengeluaran: toNumber(row[COL.lainPengeluaran]),
      asetPendapatan: toNumber(row[COL.asetPendapatan]),
      asetPengeluaran: toNumber(row[COL.asetPengeluaran]),
      gajiKasbon: toNumber(row[COL.gajiKasbon]),
      plusMinus: toNumber(row[COL.plusMinus]),
      saldoAwal: toNumber(row[COL.saldoAwal]),
    };
    const asetKeterangan = String(row[COL.asetKeterangan] ?? "").trim() || null;

    const biayaOps = toNumber(row[COL.biayaOps]);
    const biayaPromosi = toNumber(row[COL.biayaPromosi]);
    const totalBiaya = biayaOps + biayaPromosi;

    const pvErwin = toNumber(row[COL.pvErwin]);
    const pvLando = toNumber(row[COL.pvLando]);

    const transfer = toNumber(row[COL.transfer]);
    const eWallet = toNumber(row[COL.eWallet]);
    const itTt = toNumber(row[COL.itTt]);
    const namaTeller = String(row[COL.namaTeller] ?? "").trim();

    const totalPendapatan = hitungTotalPendapatan(fields);
    const totalPengeluaran = hitungTotalPengeluaran(fields, totalBiaya);
    const saldoAkhir = hitungSaldoAkhir(fields, totalBiaya);

    const sheetSaldoAkhir = toNumber(row[COL.sheetSaldoAkhir]);
    if (Math.abs(saldoAkhir - sheetSaldoAkhir) > 1) {
      mismatchCount++;
      console.warn(
        `Selisih saldo akhir di ${dateStr}: hitung=${saldoAkhir} vs sheet=${sheetSaldoAkhir}`
      );
    }

    await db.$transaction(async (tx) => {
      await tx.dailyTransaction.create({
        data: {
          branchId: branch.id,
          date,
          status,
          ...fields,
          asetKeterangan,
          saldoAkhir,
          pvEntries: {
            create: [
              ...(pvErwin > 0 ? [{ personName: "ERWIN", amount: pvErwin }] : []),
              ...(pvLando > 0 ? [{ personName: "LANDO", amount: pvLando }] : []),
            ],
          },
          tellerBreakdown: {
            create:
              namaTeller || transfer > 0 || eWallet > 0 || itTt > 0
                ? [{ tellerName: namaTeller || "-", transfer, eWallet, itTt }]
                : [],
          },
        },
      });

      const biayaData = [];
      if (biayaOps > 0) {
        const cat = categoryByName.get("OPS");
        if (cat) biayaData.push({ branchId: branch.id, date, categoryId: cat.id, keterangan: "-", totalPembayaran: biayaOps });
      }
      if (biayaPromosi > 0) {
        const cat = categoryByName.get("PROMOSI");
        if (cat) biayaData.push({ branchId: branch.id, date, categoryId: cat.id, keterangan: "-", totalPembayaran: biayaPromosi });
      }
      if (biayaData.length > 0) {
        await tx.expenseEntry.createMany({ data: biayaData });
      }
    });

    created++;
    totalOmset += totalPendapatan;
    if (!minDate || date < minDate) minDate = date;
    if (!maxDate || date > maxDate) maxDate = date;
  }

  console.log("=== Ringkasan Migrasi Transaksi Brebes (Kersana) ===");
  console.log("Baris dibuat:", created);
  console.log("Dilewati (tanggal masa depan/belum terjadi):", skippedFuture);
  console.log("Dilewati (sudah ada di DB):", skippedExisting);
  console.log("Dilewati (tanggal tidak terbaca):", skippedNoDate);
  console.log("Selisih saldo akhir vs sheet (>Rp1):", mismatchCount);
  console.log("Rentang tanggal:", minDate?.toISOString().slice(0, 10), "s/d", maxDate?.toISOString().slice(0, 10));
  console.log("Total omset (Total Pendapatan) periode ini:", totalOmset);
}

main()
  .catch((err) => {
    console.error("Migrasi gagal:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
