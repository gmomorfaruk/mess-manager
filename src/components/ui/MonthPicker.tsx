"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthLabel } from "@/lib/utils";

interface MonthPickerProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  maxDate?: { year: number; month: number };
}

export default function MonthPicker({ year, month, onChange, maxDate }: MonthPickerProps) {
  const now = maxDate ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };

  const isAtMax = year === now.year && month === now.month;

  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };

  const next = () => {
    if (isAtMax) return;
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-1 bg-surface-100 rounded-xl p-1">
      <button
        onClick={prev}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-ink-500 hover:text-ink-900 hover:shadow-card"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="px-3 text-sm font-medium text-ink-800 min-w-[130px] text-center">
        {getMonthLabel(year, month)}
      </span>
      <button
        onClick={next}
        disabled={isAtMax}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white transition-colors text-ink-500 hover:text-ink-900 hover:shadow-card disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
