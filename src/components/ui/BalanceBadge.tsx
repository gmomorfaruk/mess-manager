import { cn, formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface BalanceBadgeProps {
  balance: number;
  size?: "sm" | "md" | "lg";
}

export default function BalanceBadge({ balance, size = "md" }: BalanceBadgeProps) {
  const isPositive = balance > 0;
  const isNegative = balance < 0;
  const isZero = balance === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-lg",
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm px-2.5 py-1",
        size === "lg" && "text-base px-3 py-1.5",
        isPositive && "bg-green-50 text-green-700",
        isNegative && "bg-red-50 text-red-600",
        isZero && "bg-surface-100 text-ink-500"
      )}
    >
      {isPositive && <TrendingUp size={size === "lg" ? 16 : 13} />}
      {isNegative && <TrendingDown size={size === "lg" ? 16 : 13} />}
      {isZero && <Minus size={size === "lg" ? 16 : 13} />}
      ৳{formatCurrency(Math.abs(balance))}
      {isPositive && " extra"}
      {isNegative && " due"}
    </span>
  );
}
