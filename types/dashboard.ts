export type PeriodeMode = "SAMA_BULAN_LALU" | "BULAN_PENUH_SEBELUMNYA" | "RATA_HARIAN_BULAN_LALU";

export type StatusCabangDashboard =
  | "Sangat Baik"
  | "Baik"
  | "Perlu Dipantau"
  | "Perlu Evaluasi"
  | "Data Belum Cukup"
  | "Belum Beroperasi";

// null = data belum tersedia (beda dengan 0 = nilai nol yang benar-benar tercatat).
export type Growth = { persen: number | null; label: string };

export type DashboardKpi = {
  totalCabang: number;
  totalPendapatan: number;
  totalBiaya: number;
  labaOperasional: number;
  marginOperasional: number | null;
  totalTransaksi: number;
  transfer: number;
  eWallet: number;
  tarikTunai: number;
  hariLaporanTerinput: number;
  hariOperasional: number;
  hariBelumInput: number;
  kelengkapanDataPersen: number | null;
  inputTerakhir: Date | null;
  pertumbuhanPendapatan: Growth;
  pertumbuhanTransaksi: Growth;
  periodeLabel: string;
  pembandingLabel: string;
  adaDataRincianTransaksi: boolean;
};

export type ProyeksiSkenario = { skenario: "Konservatif" | "Realistis" | "Optimistis"; nilai: number };

export type DetailCabangDashboard = {
  branchId: string;
  branchName: string;
  isActive: boolean;
  pendapatan: number;
  biaya: number;
  laba: number;
  margin: number | null;
  totalTransaksi: number;
  transfer: number;
  eWallet: number;
  tarikTunai: number;
  pertumbuhanPendapatan: number | null;
  kelengkapanDataPersen: number | null;
  status: StatusCabangDashboard;
  alasanStatus: string;
}

export type TrendPoint = {
  bulan: string;
  pendapatan: number;
  biaya: number;
  laba: number;
  totalTransaksi: number;
  transfer: number;
  eWallet: number;
  tarikTunai: number;
};

export type KomposisiTransaksi = {
  kategori: "Transfer" | "E-Wallet/PPOB" | "Tarik Tunai";
  jumlah: number;
  persen: number;
};

export type TransaksiPerJenisRow = {
  jenis: "Transfer" | "E-Wallet/PPOB" | "Tarik Tunai";
  total: number;
  rataRataHarian: number;
  kontribusiPersen: number;
  pertumbuhanPersen: number | null;
  tren: "Naik" | "Turun" | "Stabil";
};
