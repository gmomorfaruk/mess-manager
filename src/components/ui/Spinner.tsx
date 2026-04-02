import { cn } from "@/lib/utils";

export default function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-5 h-5 border-2 border-surface-200 border-t-brand-600 rounded-full animate-spin",
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner className="w-8 h-8" />
        <p className="text-sm text-ink-400">Loading…</p>
      </div>
    </div>
  );
}
