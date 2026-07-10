import { db } from "@/lib/db";
import { EmployeeForm } from "@/components/employee-form";
import { toggleEmployeeActive } from "@/actions/kepegawaian";

export default async function KepegawaianPage() {
  const employees = await db.employee.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Kepegawaian</h1>
        <p className="text-sm text-neutral-500">Daftar karyawan Wilayah Brebes</p>
      </div>

      <EmployeeForm />

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Jabatan</th>
              <th className="px-3 py-2">Tanggal Masuk</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">
                  Belum ada karyawan.
                </td>
              </tr>
            )}
            {employees.map((emp, i) => (
              <tr key={emp.id} className={i % 2 === 1 ? "bg-neutral-50" : undefined}>
                <td className="px-3 py-2">{emp.name}</td>
                <td className="px-3 py-2">{emp.jabatan}</td>
                <td className="px-3 py-2">
                  {emp.tanggalMasuk ? emp.tanggalMasuk.toLocaleDateString("id-ID") : "-"}
                </td>
                <td className="px-3 py-2">
                  {emp.isActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Aktif</span>
                  ) : (
                    <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">Nonaktif</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <form
                    action={async () => {
                      "use server";
                      await toggleEmployeeActive(emp.id);
                    }}
                  >
                    <button className="text-xs text-neutral-600 hover:underline">
                      {emp.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
