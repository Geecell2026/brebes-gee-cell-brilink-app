export type HariKerjaLibur = "KERJA" | "AKHIR_PEKAN";
export type PosisiBulan = "AWAL" | "TENGAH" | "AKHIR";

// Baris harian yang sudah diperkaya kolom turunan (poin 3 spesifikasi).
export type DailyPoint = {
  date: Date;
  branchName: string;
  totalTransaksi: number;
  namaHari: string;
  isoWeek: number; // nomor minggu dalam setahun (ISO week), dipakai untuk agregasi mingguan
  mingguKeBulan: number; // minggu ke berapa dalam bulan (1-5)
  bulan: number; // 1-12
  tahun: number;
  hariKeBulan: number;
  posisiBulan: PosisiBulan;
  hariKerjaLibur: HariKerjaLibur;
  status: "BUKA" | "LIBUR";
};

export type StatistikDeskriptif = {
  total: number;
  rataRata: number;
  median: number;
  maksimum: number;
  minimum: number;
  standarDeviasi: number;
  koefisienVariasi: number; // persen
  jumlahHari: number;
};

export type StabilitasLevel = "Sangat Stabil" | "Stabil" | "Cukup Fluktuatif" | "Sangat Fluktuatif";

export type MingguAgregat = {
  label: string; // "Minggu 1 (1-7 Jul)"
  tahun: number;
  nomorMinggu: number;
  total: number;
  rataRataPerHari: number;
  pertumbuhanPersen: number | null;
};

export type BulanAgregat = {
  label: string; // "Juli 2026"
  tahun: number;
  bulan: number;
  total: number;
  rataRataHarian: number;
  maksimum: number;
  minimum: number;
  hariBuka: number;
  pertumbuhanPersen: number | null;
};

export type PolaHari = {
  namaHari: string;
  rataRata: number;
  jumlahSampel: number;
};

export type JenisAnomali =
  | "Sangat Rendah (di bawah rata-rata - 2SD)"
  | "Sangat Tinggi (di atas rata-rata + 2SD)"
  | "Penurunan Drastis (>40% vs hari sebelumnya)"
  | "Kenaikan Drastis (>50% vs hari sebelumnya)"
  | "Tidak Ada Data";

export type Anomali = {
  date: Date;
  branchName: string;
  totalTransaksi: number | null;
  jenis: JenisAnomali;
  kemungkinanPenyebab: string[];
};

export type ForecastRange = { bawah: number; utama: number; atas: number };

export type ForecastHasil = {
  metode: "Rata-rata 7 Hari" | "Weighted Moving Average" | "Tren Linear";
  besok: ForecastRange;
  tujuhHari: ForecastRange;
  empatBelasHari: ForecastRange;
};

export type ProyeksiAkhirBulan = {
  pendekatan: "Rata-rata Harian" | "Rata-rata 7 Hari Terakhir" | "Tren Linear";
  proyeksi: number;
};

export type StatusPerforma = "Sangat Baik" | "Baik" | "Perlu Dipantau" | "Perlu Evaluasi";
