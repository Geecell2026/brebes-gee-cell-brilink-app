import { ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  perubahanPersen?: number | null;
  keterangan?: string;
};

export function KpiCard({ label, value, icon: Icon, iconBg, iconColor, perubahanPersen, keterangan }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between">
        <p className="text-xs text-neutral-500">{label}</p>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">{value}</p>
      {perubahanPersen !== undefined && perubahanPersen !== null && (
        <p
          className={`mt-1 flex items-center gap-0.5 text-xs font-medium ${
            perubahanPersen >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {perubahanPersen >= 0 ? (
            <ArrowUp className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <ArrowDown className="h-3 w-3" strokeWidth={2.5} />
          )}
          {Math.abs(perubahanPersen).toFixed(2)}% vs periode lalu
        </p>
      )}
      {keterangan && <p className="mt-1 text-xs text-neutral-400">{keterangan}</p>}
    </div>
  );
}
