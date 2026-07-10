"use client";

import { useActionState, useState } from "react";
import {
  createDailyTransaction,
  updateDailyTransaction,
  type TransaksiFormState,
} from "@/actions/transaksi";

type Branch = { id: string; name: string };
type Category = { id: string; name: string };
type Employee = { id: string; name: string };
type TellerRow = { tellerName: string; transfer: string; eWallet: string; itTt: string };
type BiayaRow = { categoryId: string; keterangan: string; jumlah: string };
type PvRow = { personName: string; amount: string };

const JUMLAH_BARIS_BIAYA_DEFAULT = 5;

// "-" dipakai sebagai placeholder untuk baris teller tanpa nama saat migrasi data
// lama - jangan diperlakukan sebagai nama karyawan sungguhan.
function parseTellerNames(tellerName: string): string[] {
  return tellerName
    .split(" ")
    .map((n) => n.trim())
    .filter((n) => n && n !== "-");
}

function buatBiayaRowsAwal(existing: BiayaRow[] = []): BiayaRow[] {
  const rows = [...existing];
  while (rows.length < JUMLAH_BARIS_BIAYA_DEFAULT) {
    rows.push({ categoryId: "", keterangan: "", jumlah: "0" });
  }
  return rows;
}

type InitialData = {
  branchId: string;
  branchName: string;
  date: string;
  status: "BUKA" | "LIBUR";
  saldoAwal: number;
  brilinkPendapatan: number;
  brilinkPpob: number;
  brilinkFee: number;
  accAicePendapatan: number;
  accAicePengeluaran: number;
  lainPendapatan: number;
  lainPengeluaran: number;
  asetKeterangan: string;
  asetPendapatan: number;
  asetPengeluaran: number;
  gajiKasbon: number;
  plusMinus: number;
  pvEntries: PvRow[];
  tellerRows: TellerRow[];
  biayaRows: BiayaRow[];
};

const initialState: TransaksiFormState = {};

const inputClass =
  "w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500";
const labelClass = "text-xs font-medium text-neutral-600";

export function TransaksiForm({
  branches,
  categories,
  employees,
  transactionId,
  initialData,
}: {
  branches: Branch[];
  categories: Category[];
  employees: Employee[];
  transactionId?: string;
  initialData?: InitialData;
}) {
  const isEdit = Boolean(transactionId);
  const action = isEdit ? updateDailyTransaction.bind(null, transactionId!) : createDailyTransaction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [tellerRows, setTellerRows] = useState<TellerRow[]>(initialData?.tellerRows ?? []);
  const [biayaRows, setBiayaRows] = useState<BiayaRow[]>(() => buatBiayaRowsAwal(initialData?.biayaRows));
  const [pvRows, setPvRows] = useState<PvRow[]>(initialData?.pvEntries ?? []);

  function addBiayaRow() {
    setBiayaRows((rows) => [...rows, { categoryId: "", keterangan: "", jumlah: "0" }]);
  }

  function updateBiayaRow(index: number, field: keyof BiayaRow, value: string) {
    setBiayaRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeBiayaRow(index: number) {
    setBiayaRows((rows) => rows.filter((_, i) => i !== index));
  }

  function addTellerRow() {
    setTellerRows((rows) => [...rows, { tellerName: "", transfer: "0", eWallet: "0", itTt: "0" }]);
  }

  function updateTellerRow(index: number, field: keyof TellerRow, value: string) {
    setTellerRows((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  function removeTellerRow(index: number) {
    setTellerRows((rows) => rows.filter((_, i) => i !== index));
  }

  function toggleTellerPerson(index: number, name: string, checked: boolean) {
    setTellerRows((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        const names = parseTellerNames(row.tellerName);
        const next = checked ? [...names, name] : names.filter((n) => n !== name);
        return { ...row, tellerName: next.join(" ") };
      })
    );
  }

  function addPvRow() {
    setPvRows((rows) => [...rows, { personName: "", amount: "0" }]);
  }

  function updatePvRow(index: number, field: keyof PvRow, value: string) {
    setPvRows((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removePvRow(index: number) {
    setPvRows((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="tellerRowsJson" value={JSON.stringify(tellerRows)} />
      <input type="hidden" name="biayaRowsJson" value={JSON.stringify(biayaRows)} />
      <input type="hidden" name="pvEntriesJson" value={JSON.stringify(pvRows)} />

      <section className="grid grid-cols-4 gap-4 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="space-y-1">
          <label className={labelClass}>Cabang</label>
          {isEdit ? (
            <input value={initialData!.branchName} disabled className={inputClass} />
          ) : (
            <select name="branchId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Pilih cabang
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Tanggal</label>
          <input
            type="date"
            name={isEdit ? undefined : "date"}
            required
            disabled={isEdit}
            defaultValue={initialData?.date}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Status Hari</label>
          <select name="status" defaultValue={initialData?.status ?? "BUKA"} className={inputClass}>
            <option value="BUKA">Buka</option>
            <option value="LIBUR">Libur</option>
          </select>
        </div>
        <Field label="Saldo Awal" name="saldoAwal" defaultValue={initialData?.saldoAwal} />
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">Brilink</h2>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Pendapatan Adm" name="brilinkPendapatan" defaultValue={initialData?.brilinkPendapatan} />
          <Field label="PPOB" name="brilinkPpob" defaultValue={initialData?.brilinkPpob} />
          <Field label="Fee" name="brilinkFee" defaultValue={initialData?.brilinkFee} />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">Acc & Aice</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pendapatan" name="accAicePendapatan" defaultValue={initialData?.accAicePendapatan} />
          <Field label="Pengeluaran" name="accAicePengeluaran" defaultValue={initialData?.accAicePengeluaran} />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">Lain-lain</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pendapatan" name="lainPendapatan" defaultValue={initialData?.lainPendapatan} />
          <Field label="Pengeluaran" name="lainPengeluaran" defaultValue={initialData?.lainPengeluaran} />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">Aset</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Keterangan</label>
            <input name="asetKeterangan" defaultValue={initialData?.asetKeterangan} className={inputClass} />
          </div>
          <Field label="Pendapatan" name="asetPendapatan" defaultValue={initialData?.asetPendapatan} />
          <Field label="Pengeluaran" name="asetPengeluaran" defaultValue={initialData?.asetPengeluaran} />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-800">Lainnya</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gaji/Kasbon" name="gajiKasbon" defaultValue={initialData?.gajiKasbon} />
          <Field label="Plus Minus" name="plusMinus" defaultValue={initialData?.plusMinus} />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">PV (Uang Titip/Prive) per Orang</h2>
          <button
            type="button"
            onClick={addPvRow}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            + Tambah Orang
          </button>
        </div>

        {pvRows.length === 0 && <p className="text-xs text-neutral-400">Belum ada baris PV.</p>}

        {pvRows.map((row, i) => (
          <div key={i} className="grid grid-cols-3 items-end gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Nama</label>
              <input
                className={inputClass}
                value={row.personName}
                onChange={(e) => updatePvRow(i, "personName", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Jumlah</label>
              <input
                type="number"
                className={inputClass}
                value={row.amount}
                onChange={(e) => updatePvRow(i, "amount", e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removePvRow(i)}
              className="h-fit rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">Biaya</h2>
          <button
            type="button"
            onClick={addBiayaRow}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            + Tambah Baris
          </button>
        </div>

        {biayaRows.map((row, i) => (
          <div key={i} className="grid grid-cols-4 items-end gap-3">
            <div className="space-y-1">
              <label className={labelClass}>Jenis Biaya</label>
              <select
                value={row.categoryId}
                onChange={(e) => updateBiayaRow(i, "categoryId", e.target.value)}
                className={inputClass}
              >
                <option value="">-</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Keterangan</label>
              <input
                className={inputClass}
                value={row.keterangan}
                onChange={(e) => updateBiayaRow(i, "keterangan", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Jumlah</label>
              <input
                type="number"
                className={inputClass}
                value={row.jumlah}
                onChange={(e) => updateBiayaRow(i, "jumlah", e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeBiayaRow(i)}
              className="h-fit rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Hapus Baris
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-800">Breakdown Total Transaksi per Teller</h2>
          <button
            type="button"
            onClick={addTellerRow}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-50"
          >
            + Tambah Teller
          </button>
        </div>

        {tellerRows.length === 0 && (
          <p className="text-xs text-neutral-400">Belum ada baris teller.</p>
        )}

        {tellerRows.map((row, i) => {
          const selectedNames = parseTellerNames(row.tellerName);
          return (
            <div key={i} className="space-y-3 rounded-md border border-neutral-100 p-3">
              <div className="grid grid-cols-4 items-end gap-3">
                <div className="space-y-1">
                  <label className={labelClass}>Transfer</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={row.transfer}
                    onChange={(e) => updateTellerRow(i, "transfer", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>E-Wallet/PPOB</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={row.eWallet}
                    onChange={(e) => updateTellerRow(i, "eWallet", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Tarik Tunai</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={row.itTt}
                    onChange={(e) => updateTellerRow(i, "itTt", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeTellerRow(i)}
                  className="h-fit rounded-md border border-red-200 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Nama Teller (karyawan yang bertugas)</label>
                {employees.length === 0 ? (
                  <p className="text-xs text-neutral-400">
                    Belum ada karyawan terdaftar — tambahkan dulu di halaman Kepegawaian.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {employees.map((emp) => (
                      <label key={emp.id} className="flex items-center gap-1.5 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          checked={selectedNames.includes(emp.name)}
                          onChange={(e) => toggleTellerPerson(i, emp.name, e.target.checked)}
                        />
                        {emp.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Simpan Transaksi"}
      </button>
    </form>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue?: number }) {
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      <input type="number" name={name} defaultValue={defaultValue ?? 0} className={inputClass} />
    </div>
  );
}
