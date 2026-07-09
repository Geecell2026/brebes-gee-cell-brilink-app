import { db } from "@/lib/db";
import { getAppSettings } from "@/lib/calculations/settings";
import { ThresholdForm } from "@/components/threshold-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { CategoryForm } from "@/components/category-form";
import { toggleExpenseCategoryActive } from "@/actions/pengaturan";

export default async function PengaturanPage() {
  const [settings, categories] = await Promise.all([
    getAppSettings(),
    db.expenseCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Pengaturan</h1>
        <p className="text-sm text-neutral-500">Threshold dashboard, kategori biaya, dan akun</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-800">Threshold Status Cabang</h2>
        <ThresholdForm
          defaultValues={{
            statusSangatBaik: Number(settings.statusSangatBaik),
            statusBaik: Number(settings.statusBaik),
            statusPerluPerhatian: Number(settings.statusPerluPerhatian),
          }}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-800">Kategori Biaya</h2>
        <div className="space-y-3">
          <CategoryForm />
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Nama</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2">
                      {c.isActive ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Aktif</span>
                      ) : (
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await toggleExpenseCategoryActive(c.id);
                        }}
                      >
                        <button className="text-xs text-neutral-600 hover:underline">
                          {c.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-neutral-800">Ganti Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
