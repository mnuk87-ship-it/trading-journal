import clsx from "clsx";

type Variant = "default" | "green" | "red" | "accent";

export function KpiCard({
  label,
  value,
  sub,
  variant = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  variant?: Variant;
}) {
  const valueColor =
    variant === "green" ? "text-green" : variant === "red" ? "text-red" : variant === "accent" ? "text-accent" : "text-foreground";
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex flex-col gap-1.5 min-w-0">
      <span className="text-[11px] uppercase tracking-wide text-muted font-medium truncate">{label}</span>
      <span className={clsx("text-2xl font-bold tabular-nums", valueColor)}>{value}</span>
      {sub && <span className="text-xs text-muted-2">{sub}</span>}
    </div>
  );
}

export function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">{children}</div>;
}
