"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Smartphone, LayoutDashboard, Receipt, Wallet, Store, Settings, LogOut, Menu, X, ArrowLeftRight, Users,
  BarChart3, CalendarDays, TrendingUp, LineChart, Database,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

const NAV_GROUPS = [
  {
    label: "Ringkasan",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/total-transaksi", label: "Total Transaksi", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Analisis Transaksi",
    items: [
      { href: "/analisis", label: "Ringkasan Owner", icon: BarChart3 },
      { href: "/analisis/harian", label: "Analisis Harian", icon: CalendarDays },
      { href: "/analisis/mingguan-bulanan", label: "Mingguan & Bulanan", icon: TrendingUp },
      { href: "/analisis/forecast", label: "Forecast", icon: LineChart },
      { href: "/analisis/data", label: "Data & Validasi", icon: Database },
    ],
  },
  {
    label: "Operasional",
    items: [{ href: "/transaksi", label: "Transaksi Harian", icon: Receipt }],
  },
  {
    label: "Kepegawaian",
    items: [{ href: "/kepegawaian", label: "Kepegawaian", icon: Users }],
  },
  {
    label: "Lainnya",
    items: [
      { href: "/biaya", label: "Biaya", icon: Wallet },
      { href: "/cabang", label: "Cabang", icon: Store },
      { href: "/pengaturan", label: "Pengaturan", icon: Settings },
    ],
  },
];

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Smartphone className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">GEE CELL BRILink</p>
          <p className="text-xs text-neutral-500">Wilayah Brebes</p>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
              {group.label}
            </p>
            <div className="mt-1 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={
                      active
                        ? "flex items-center gap-2 rounded-md bg-blue-50 px-2 py-1.5 text-sm font-medium text-blue-700"
                        : "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
                    }
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <form action={logoutAction} className="border-t border-neutral-200 p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-500 hover:bg-neutral-100"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Keluar
        </button>
      </form>
    </>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-100"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600">
            <Smartphone className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <p className="text-sm font-semibold text-neutral-900">GEE CELL BRILink - Brebes</p>
        </div>
      </header>

      <aside className="hidden w-64 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-neutral-500 hover:bg-neutral-100"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
