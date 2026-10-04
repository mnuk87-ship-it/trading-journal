import clsx from "clsx";
import type { TradeResult } from "@/types/trade";

export function ResultBadge({ result }: { result: TradeResult | null }) {
  if (!result) return <span className="text-muted text-xs">—</span>;
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide",
        result === "WIN" && "bg-green-soft text-green",
        result === "LOSS" && "bg-red-soft text-red",
        result === "BE" && "bg-surface-2 text-muted"
      )}
    >
      {result}
    </span>
  );
}

export function DirectionBadge({ direction }: { direction: "LONG" | "SHORT" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold",
        direction === "LONG" ? "bg-green-soft text-green" : "bg-red-soft text-red"
      )}
    >
      {direction}
    </span>
  );
}

export function Tag({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-surface-2 text-muted border border-card-border">
      #{name}
    </span>
  );
}
