import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EmployeeForm } from "@/components/employee-form";

export default async function KepegawaianEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Edit Karyawan</h1>
        <p className="text-sm text-neutral-500">{employee.name}</p>
      </div>
      <EmployeeForm
        employeeId={employee.id}
        initialData={{
          name: employee.name,
          jabatan: employee.jabatan,
          tanggalMasuk: employee.tanggalMasuk ? employee.tanggalMasuk.toISOString().slice(0, 10) : "",
          tanggalKeluar: employee.tanggalKeluar ? employee.tanggalKeluar.toISOString().slice(0, 10) : "",
        }}
      />
    </div>
  );
}
