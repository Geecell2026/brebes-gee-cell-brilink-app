import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-6">{children}</main>
    </div>
  );
}
