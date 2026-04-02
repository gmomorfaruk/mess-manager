import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconColor = "text-brand-600",
  iconBg = "bg-brand-50",
  className,
}: StatCardProps) {
  return (
    <div className={cn("card p-5 flex items-start gap-4", className)}>
      {Icon && (
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon size={20} className={iconColor} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-400 uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-semibold text-ink-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
