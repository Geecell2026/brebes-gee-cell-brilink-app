import Link from "next/link";
import { logoutAction } from "@/actions/auth";

const NAV_GROUPS = [
  {
    label: "Ringkasan",
    items: [{ href: "/", label: "Dashboard" }],
  },
  {
    label: "Operasional",
    items: [{ href: "/transaksi", label: "Transaksi Harian" }],
  },
  {
    label: "Lainnya",
    items: [
      { href: "/biaya", label: "Biaya" },
      { href: "/cabang", label: "Cabang" },
      { href: "/pengaturan", label: "Pengaturan" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-4">
          <p className="text-sm font-semibold text-neutral-900">GEE CELL BRILink</p>
          <p className="text-xs text-neutral-500">Wilayah Brebes</p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                {group.label}
              </p>
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <form action={logoutAction} className="border-t border-neutral-200 p-3">
          <button
            type="submit"
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Keluar
          </button>
        </form>
      </aside>

      <main className="flex-1 overflow-y-auto bg-neutral-50 p-6">{children}</main>
    </div>
  );
}
