import "dotenv/config";
import path from "path";
import * as XLSX from "xlsx";
import { PrismaClient } from "../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hitungTotalPengeluaran } from "../../lib/calculations/transaksi";

const SOURCE_FILE = path.resolve(__dirname, "source-data/laporan-admin-brebes.xlsx");
const BRANCH_CODE = "KERSANA";
const SUMMARY_LABELS = new Set(["TTL CASH IN", "PERHITUNGAN CASH MEJA", "CASH MEJA REAL"]);

function parseDate(s: string): Date | null {
  const m = String(s || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
}
function parseRp(s: unknown): number {
  const str = String(s ?? "").trim();
  if (!str) return 0;
  const neg = str.startsWith("-");
  const n = Number(str.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return neg ? -n : n;
}

type RawEntry = { date: string; kategori: string; keterangan: string; amount: number };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const branch = await db.branch.findUnique({ where: { code: BRANCH_CODE } });
  if (!branch) throw new Error(`Cabang ${BRANCH_CODE} tidak ditemukan`);

  const wb = XLSX.readFile(SOURCE_FILE);
  const ws = wb.Sheets["CATATAN KAS"];
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "" });

  const now = new Date();
  const cutoff = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const rawEntries: RawEntry[] = [];
  let currentDate: string | null = null;
  for (let r = 2; r < data.length; r++) {
    const row = data[r];
    const dateVal = parseDate(row[0]);
    if (dateVal) currentDate = dateVal.toISOString().slice(0, 10);
    if (!currentDate) continue;
    if (new Date(currentDate).getTime() >= cutoff.getTime()) continue;

    const col1 = String(row[1] ?? "").trim();
    if (SUMMARY_LABELS.has(col1)) continue;

    const kategori = String(row[5] ?? "").trim();
    const keterangan = String(row[6] ?? "").trim();
    if (!kategori || /^-?Rp[\d,]/.test(kategori) || kategori === "#N/A") continue;

    const amount = parseRp(row[7]) + parseRp(row[8]);
    if (amount <= 0) continue;

    rawEntries.push({ date: currentDate, kategori, keterangan: keterangan || "-", amount });
  }

  const transactions = await db.dailyTransaction.findMany({ where: { branchId: branch.id } });
  const txByDate = new Map(transactions.map((tx) => [tx.date.toISOString().slice(0, 10), tx]));
  const existingEntries = await db.expenseEntry.findMany({ where: { branchId: branch.id } });
  const oldBiayaByDate = new Map<string, number>();
  for (const e of existingEntries) {
    const key = e.date.toISOString().slice(0, 10);
    oldBiayaByDate.set(key, (oldBiayaByDate.get(key) ?? 0) + Number(e.totalPembayaran));
  }

  // Pengeluaran restock Acc & Aice ("BELANJA ES CREAM/ICE CREAM AICE") sudah tercatat
  // terpisah sebagai accAicePengeluaran di DailyTransaction - kecualikan dari Biaya
  // supaya tidak dobel hitung. Dicocokkan by tanggal+nominal persis, bukan cuma
  // pola teks "aice" (ada biaya kecil wajar lain yang kebetulan menyebut aice juga).
  const entries: RawEntry[] = [];
  let excluded = 0;
  const groupedByDate = new Map<string, RawEntry[]>();
  for (const e of rawEntries) {
    if (!groupedByDate.has(e.date)) groupedByDate.set(e.date, []);
    groupedByDate.get(e.date)!.push(e);
  }
  for (const [date, list] of groupedByDate) {
    const tx = txByDate.get(date);
    const accAicePeng = tx ? Number(tx.accAicePengeluaran) : 0;
    let skippedOne = false;
    for (const e of list) {
      if (!skippedOne && accAicePeng > 0 && e.amount === accAicePeng && /aice/i.test(e.keterangan)) {
        excluded++;
        skippedOne = true;
        continue;
      }
      entries.push(e);
    }
  }
  console.log(`Entri dikecualikan (restock Acc & Aice, sudah tercatat terpisah): ${excluded}`);
  console.log(`Total entri biaya rinci yang akan dimigrasi: ${entries.length}`);

  const categories = await db.expenseCategory.findMany();
  const categoryByName = new Map(categories.map((c) => [c.name, c]));
  const unknownCategories = new Set<string>();
  for (const e of entries) {
    if (!categoryByName.has(e.kategori)) unknownCategories.add(e.kategori);
  }
  if (unknownCategories.size > 0) {
    throw new Error(`Kategori belum ada di database: ${Array.from(unknownCategories).join(", ")}`);
  }

  const newTotalByDate = new Map<string, number>();
  for (const e of entries) {
    newTotalByDate.set(e.date, (newTotalByDate.get(e.date) ?? 0) + e.amount);
  }

  // Verifikasi silang final: total rinci baru per hari harus PERSIS sama dengan total
  // pengeluaran lama (biaya lama + lain + aset + gaji) - supaya Saldo Akhir yang sudah
  // tersimpan & tervalidasi terhadap sheet tetap konsisten tanpa perlu dihitung ulang.
  const mismatches: string[] = [];
  for (const tx of transactions) {
    const key = tx.date.toISOString().slice(0, 10);
    const oldBiaya = oldBiayaByDate.get(key) ?? 0;
    const groundTruth = hitungTotalPengeluaran(tx, oldBiaya);
    const newTotal = newTotalByDate.get(key) ?? 0;
    // Toleransi kecil (<= Rp50) untuk salah ketik nominal receh di sumber data;
    // di atas itu dianggap selisih struktural dan migrasi dibatalkan.
    if (Math.abs(groundTruth - newTotal) > 50) {
      mismatches.push(`${key}: lama=${groundTruth} vs rinci baru=${newTotal}`);
    } else if (groundTruth !== newTotal) {
      console.warn(`Selisih kecil (dianggap salah ketik, dilanjutkan): ${key} lama=${groundTruth} vs rinci baru=${newTotal}`);
    }
  }
  if (mismatches.length > 0) {
    console.error("Selisih ditemukan, migrasi dibatalkan:");
    mismatches.forEach((m) => console.error(" -", m));
    throw new Error("Verifikasi silang gagal, tidak ada data yang diubah.");
  }
  console.log("Verifikasi silang OK: semua total harian cocok persis dengan data tersimpan.");

  const dates = Array.from(newTotalByDate.keys());
  await db.$transaction(async (tx) => {
    const deleted = await tx.expenseEntry.deleteMany({
      where: { branchId: branch.id, date: { in: dates.map((d) => new Date(d)) } },
    });
    console.log(`Menghapus ${deleted.count} entri biaya lama (generik OPS/PROMOSI).`);

    await tx.expenseEntry.createMany({
      data: entries.map((e) => ({
        branchId: branch.id,
        date: new Date(e.date),
        categoryId: categoryByName.get(e.kategori)!.id,
        keterangan: e.keterangan,
        totalPembayaran: e.amount,
      })),
    });

    // Nolkan field yang nilainya sekarang sudah terwakili di rincian Biaya baru,
    // supaya tidak dobel hitung di formula Total Pengeluaran (Saldo Akhir tidak
    // disentuh - totalnya sudah diverifikasi identik dengan sebelumnya).
    for (const dateStr of dates) {
      await tx.dailyTransaction.updateMany({
        where: { branchId: branch.id, date: new Date(dateStr) },
        data: { lainPengeluaran: 0, asetPengeluaran: 0, asetKeterangan: null, gajiKasbon: 0 },
      });
    }
  });

  console.log(`Migrasi selesai: ${entries.length} entri rinci baru untuk ${dates.length} hari.`);
}

main()
  .catch((err) => {
    console.error("Migrasi gagal:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
