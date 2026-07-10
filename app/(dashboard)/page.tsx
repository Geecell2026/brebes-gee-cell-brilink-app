import {
  Store, TrendingUp, Wallet, PiggyBank, Percent, ArrowLeftRight, Landmark, Smartphone, Banknote,
  CalendarCheck, ClipboardCheck, ArrowUpRight,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  resolveDashboardPeriod,
  getDashboardKpi,
  getDashboardTrend,
  getKomposisiTransaksi,
  getTransaksiPerJenis,
  getProyeksiAkhirBulan,
  getDashboardDetailCabang,
  buatInsightDashboard,
} from "@/lib/calculations/dashboard";
import type { PeriodeMode, StatusCabangDashboard } from "@/types/dashboard";
import { DashboardFilterBar } from "@/components/dashboard-filter-bar";
import { KpiCard } from "@/components/analisis/kpi-card";
import { DashboardTrendChart } from "@/components/dashboard-trend-chart";
import { DashboardDonutChart } from "@/components/dashboard-donut-chart";

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function formatPersen(n: number): string {
  return `${n.toFixed(2)}%`;
}
function formatAngka(n: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);
}

const STATUS_BADGE: Record<StatusCabangDashboard, string> = {
  "Sangat Baik": "bg-green-100 text-green-700",
  Baik: "bg-blue-100 text-blue-700",
  "Perlu Dipantau": "bg-amber-100 text-amber-700",
  "Perlu Evaluasi": "bg-red-100 text-red-700",
  "Data Belum Cukup": "bg-neutral-200 text-neutral-600",
  "Belum Beroperasi": "bg-neutral-100 text-neutral-400",
};

const KELENGKAPAN_LABEL = (p: number | null) => {
  if (p === null) return "Belum tersedia";
  if (p >= 100) return "Lengkap";
  if (p >= 90) return "Hampir Lengkap";
  if (p >= 75) return "Perlu Dilengkapi";
  return "Tidak Lengkap";
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string; startDate?: string; endDate?: string; pembanding?: string }>;
}) {
  const params = await searchParams;
  const comparisonMode = (params.pembanding as PeriodeMode) || "SAMA_BULAN_LALU";
  const { startDate, endDate, startDateStr, endDateStr } = resolveDashboardPeriod(params);

  const [branches, kpi, trend, komposisi, transaksiPerJenis, proyeksi, detailCabang] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getDashboardKpi({ branchId: params.branchId, startDate, endDate, comparisonMode }),
    getDashboardTrend("keuangan", params.branchId, 6),
    getKomposisiTransaksi(params.branchId, startDate, endDate),
    getTransaksiPerJenis({ branchId: params.branchId, startDate, endDate, comparisonMode }),
    getProyeksiAkhirBulan(params.branchId),
    getDashboardDetailCabang({ startDate, endDate, comparisonMode }),
  ]);

  const insight = buatInsightDashboard({ kpi, komposisi, transaksiPerJenis, detailCabang, proyeksi });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Rekap pendapatan &amp; operasional Wilayah Brebes</p>
      </div>

      <DashboardFilterBar
        branches={branches}
        branchId={params.branchId}
        startDate={startDateStr}
        endDate={endDateStr}
        pembanding={comparisonMode}
      />

      <div className="rounded-lg border border-neutral-200 bg-blue-50 px-4 py-2 text-xs text-blue-800">
        Periode: <span className="font-medium">{kpi.periodeLabel}</span> — Dibandingkan dengan:{" "}
        <span className="font-medium">{kpi.pembandingLabel}</span>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">KPI Keuangan</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard label="Total Cabang" value={String(kpi.totalCabang)} icon={Store} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KpiCard
            label="Total Pendapatan Periode Ini"
            value={formatRupiah(kpi.totalPendapatan)}
            icon={TrendingUp}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            perubahanPersen={kpi.pertumbuhanPendapatan.persen}
            keterangan={kpi.pertumbuhanPendapatan.persen === null ? kpi.pertumbuhanPendapatan.label : undefined}
          />
          <KpiCard label="Total Biaya" value={formatRupiah(kpi.totalBiaya)} icon={Wallet} iconBg="bg-amber-50" iconColor="text-amber-600" />
          <KpiCard
            label="Laba Operasional"
            value={formatRupiah(kpi.labaOperasional)}
            icon={PiggyBank}
            iconBg={kpi.labaOperasional >= 0 ? "bg-green-50" : "bg-red-50"}
            iconColor={kpi.labaOperasional >= 0 ? "text-green-600" : "text-red-600"}
          />
          <KpiCard
            label="Margin Operasional"
            value={kpi.marginOperasional !== null ? formatPersen(kpi.marginOperasional) : "Belum tersedia"}
            icon={Percent}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
          />
        </div>
        <p className="mt-2 text-xs text-neutral-400">
          Total Pendapatan terdiri dari pendapatan administrasi, PPOB, fee BRILink, dan pendapatan lain — nilai ini bukan total nominal uang transaksi nasabah.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">Rincian Pendapatan</h2>
          <span
            className="text-xs text-neutral-400"
            title="Net Profit Acc & Aice merupakan laba bersih bulanan usaha tambahan. Nilai ini menambah laba, tetapi tidak menambah Saldo Akhir karena bukan arus kas baru."
          >
            ⓘ Tentang Net Profit Acc &amp; Aice
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500">Pendapatan Admin BRILink</p>
            <p className="font-medium tabular-nums">{formatRupiah(kpi.rincianPendapatan.pendapatanAdmin)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">PPOB</p>
            <p className="font-medium tabular-nums">{formatRupiah(kpi.rincianPendapatan.ppob)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Fee</p>
            <p className="font-medium tabular-nums">{formatRupiah(kpi.rincianPendapatan.fee)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Pendapatan Lain</p>
            <p className="font-medium tabular-nums">{formatRupiah(kpi.rincianPendapatan.pendapatanLain)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Net Profit Aksesori</p>
            <p className="font-medium tabular-nums">
              {kpi.rincianPendapatan.netProfitAksesori !== null ? formatRupiah(kpi.rincianPendapatan.netProfitAksesori) : "Belum tersedia"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Net Profit Aice</p>
            <p className="font-medium tabular-nums">
              {kpi.rincianPendapatan.netProfitAice !== null ? formatRupiah(kpi.rincianPendapatan.netProfitAice) : "Belum tersedia"}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Total Net Profit Acc &amp; Aice</p>
            <p className="font-medium tabular-nums">{formatRupiah(kpi.rincianPendapatan.totalNetProfit)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Total Pendapatan untuk Laba</p>
            <p className="font-semibold tabular-nums">
              {formatRupiah(
                kpi.rincianPendapatan.pendapatanAdmin +
                  kpi.rincianPendapatan.ppob +
                  kpi.rincianPendapatan.fee +
                  kpi.rincianPendapatan.pendapatanLain +
                  kpi.rincianPendapatan.totalNetProfit
              )}
            </p>
          </div>
        </div>
        {kpi.rincianPendapatan.bulanBelumDitutup.length > 0 && (
          <p className="mt-3 text-xs text-amber-600">
            Net Profit Acc &amp; Aice belum ditutup untuk: {kpi.rincianPendapatan.bulanBelumDitutup.join(", ")}.
            {kpi.rincianPendapatan.estimasiNetProfitBulanBerjalan !== null && (
              <> Estimasi bulan berjalan: {formatRupiah(kpi.rincianPendapatan.estimasiNetProfitBulanBerjalan)} (bukan angka aktual).</>
            )}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">KPI Transaksi &amp; Kelengkapan</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Total Transaksi"
            value={kpi.adaDataRincianTransaksi ? formatAngka(kpi.totalTransaksi) : "Belum tersedia"}
            icon={ArrowLeftRight}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            perubahanPersen={kpi.adaDataRincianTransaksi ? kpi.pertumbuhanTransaksi.persen : undefined}
            keterangan="Transfer + E-Wallet/PPOB + Tarik Tunai"
          />
          <KpiCard label="Transfer" value={kpi.adaDataRincianTransaksi ? formatAngka(kpi.transfer) : "Belum tersedia"} icon={Landmark} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <KpiCard label="E-Wallet/PPOB" value={kpi.adaDataRincianTransaksi ? formatAngka(kpi.eWallet) : "Belum tersedia"} icon={Smartphone} iconBg="bg-purple-50" iconColor="text-purple-600" />
          <KpiCard label="Tarik Tunai" value={kpi.adaDataRincianTransaksi ? formatAngka(kpi.tarikTunai) : "Belum tersedia"} icon={Banknote} iconBg="bg-amber-50" iconColor="text-amber-600" />
          <KpiCard label="Hari Laporan Terinput" value={String(kpi.hariLaporanTerinput)} icon={CalendarCheck} iconBg="bg-sky-50" iconColor="text-sky-600" keterangan={`dari ${kpi.hariOperasional} hari operasional (estimasi)`} />
          <KpiCard
            label="Kelengkapan Data"
            value={kpi.kelengkapanDataPersen !== null ? formatPersen(kpi.kelengkapanDataPersen) : "Belum tersedia"}
            icon={ClipboardCheck}
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            keterangan={KELENGKAPAN_LABEL(kpi.kelengkapanDataPersen)}
          />
          <KpiCard
            label="Proyeksi Akhir Bulan (Realistis)"
            value={formatRupiah(proyeksi.pendapatan[1]?.nilai ?? 0)}
            icon={ArrowUpRight}
            iconBg="bg-green-50"
            iconColor="text-green-600"
            keterangan="Estimasi — lihat detail di bawah"
          />
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Tren Keuangan dan Transaksi</h2>
        <DashboardTrendChart data={trend} />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Proyeksi Akhir Bulan Ini (Estimasi)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">Total Pendapatan</p>
            <div className="grid grid-cols-3 gap-2">
              {proyeksi.pendapatan.map((p) => (
                <div key={p.skenario} className="rounded-md border border-neutral-100 p-2 text-center">
                  <p className="text-[11px] text-neutral-500">{p.skenario}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatRupiah(p.nilai)}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-500">Total Transaksi</p>
            <div className="grid grid-cols-3 gap-2">
              {proyeksi.totalTransaksi.map((p) => (
                <div key={p.skenario} className="rounded-md border border-neutral-100 p-2 text-center">
                  <p className="text-[11px] text-neutral-500">{p.skenario}</p>
                  <p className="text-sm font-semibold tabular-nums">{formatAngka(p.nilai)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Estimasi berdasarkan data bulan berjalan — bukan angka pasti. Halaman Forecast di menu Analisis Transaksi menyediakan proyeksi yang lebih rinci.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Komposisi Transaksi</h2>
          <DashboardDonutChart data={komposisi} />
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-neutral-800">Transaksi per Jenis</h2>
          {transaksiPerJenis.length === 0 ? (
            <p className="text-sm text-neutral-400">Belum tersedia.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="py-2">Jenis</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">Rata-rata/Hari</th>
                    <th className="py-2 text-right">Kontribusi</th>
                    <th className="py-2 text-right">Pertumbuhan</th>
                    <th className="py-2">Tren</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksiPerJenis.map((r) => (
                    <tr key={r.jenis} className="border-b border-neutral-100 last:border-0">
                      <td className="py-2">{r.jenis}</td>
                      <td className="py-2 text-right tabular-nums">{formatAngka(r.total)}</td>
                      <td className="py-2 text-right tabular-nums">{formatAngka(r.rataRataHarian)}</td>
                      <td className="py-2 text-right tabular-nums">{formatPersen(r.kontribusiPersen)}</td>
                      <td className="py-2 text-right tabular-nums">
                        {r.pertumbuhanPersen !== null ? `${r.pertumbuhanPersen >= 0 ? "+" : ""}${r.pertumbuhanPersen.toFixed(1)}%` : "-"}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            r.tren === "Naik" ? "bg-green-100 text-green-700" : r.tren === "Turun" ? "bg-red-100 text-red-700" : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {r.tren}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Kualitas Data</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-neutral-500">Hari Laporan Terinput</p>
            <p className="text-lg font-semibold tabular-nums">{kpi.hariLaporanTerinput}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Hari Operasional (estimasi)</p>
            <p className="text-lg font-semibold tabular-nums">{kpi.hariOperasional}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Hari Belum Input</p>
            <p className="text-lg font-semibold tabular-nums">{kpi.hariBelumInput}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Input Terakhir</p>
            <p className="text-lg font-semibold tabular-nums">{kpi.inputTerakhir ? kpi.inputTerakhir.toLocaleDateString("id-ID") : "Belum ada"}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-400">
          Catatan: "Hari Operasional" adalah estimasi (hari kalender periode dikurangi hari yang tercatat Libur) — belum ada jadwal operasional baku yang tersimpan di sistem, jadi hari yang belum diinput diasumsikan tetap beroperasi.
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Detail Per Cabang</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="whitespace-nowrap py-2 px-2">Cabang</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Pendapatan</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Biaya</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Laba</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Margin</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Total Transaksi</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Transfer</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">E-Wallet</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Tarik Tunai</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Pertumbuhan</th>
                <th className="whitespace-nowrap py-2 px-2 text-right">Kelengkapan</th>
                <th className="whitespace-nowrap py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {detailCabang.map((row, i) => (
                <tr key={row.branchId} className={i % 2 === 1 ? "bg-neutral-50" : undefined} title={row.alasanStatus}>
                  <td className="py-2 px-2">{row.branchName}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatRupiah(row.pendapatan)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatRupiah(row.biaya)}</td>
                  <td className={`py-2 px-2 text-right tabular-nums ${row.laba >= 0 ? "" : "text-red-600"}`}>{formatRupiah(row.laba)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{row.margin !== null ? formatPersen(row.margin) : "-"}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatAngka(row.totalTransaksi)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatAngka(row.transfer)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatAngka(row.eWallet)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{formatAngka(row.tarikTunai)}</td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {row.pertumbuhanPendapatan !== null ? `${row.pertumbuhanPendapatan >= 0 ? "+" : ""}${row.pertumbuhanPendapatan.toFixed(1)}%` : "-"}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{row.kelengkapanDataPersen !== null ? formatPersen(row.kelengkapanDataPersen) : "-"}</td>
                  <td className="py-2 px-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[row.status]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-neutral-800">Insight Dashboard</h2>
        {insight.length === 0 ? (
          <p className="text-sm text-neutral-400">Belum cukup data untuk menghasilkan insight.</p>
        ) : (
          <ul className="space-y-2">
            {insight.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-neutral-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
