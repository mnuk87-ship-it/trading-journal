"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { cs } from "date-fns/locale";
import { useAccount } from "@/contexts/AccountContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/Card";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { formatPlainCurrency, formatPercent, pnlColor } from "@/lib/format";

const WEEKDAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

export default function CalendarPage() {
  const { accountId } = useAccount();
  const { data, loading, error } = useAnalytics(accountId, {});
  const [month, setMonth] = useState(() => new Date());

  const byDate = useMemo(() => {
    const m = new Map<string, { date: string; pnl: number; trades: number; winRate: number; returnPercent: number }>();
    if (!data) return m;
    for (const d of data.analytics.calendar) m.set(d.date, d);
    return m;
  }, [data]);

  const monthStats = useMemo(() => {
    const prefix = format(month, "yyyy-MM");
    const days = [...byDate.values()].filter((d) => d.date.startsWith(prefix));
    const pnl = days.reduce((a, d) => a + d.pnl, 0);
    const trades = days.reduce((a, d) => a + d.trades, 0);
    const winDays = days.filter((d) => d.pnl > 0).length;
    const lossDays = days.filter((d) => d.pnl < 0).length;
    return { pnl, trades, tradingDays: days.length, winDays, lossDays };
  }, [byDate, month]);

  if (!accountId || loading) return <div className="text-muted text-sm">Načítám...</div>;
  if (error || !data) return <div className="text-red text-sm">{error ?? "Chyba při načítání dat"}</div>;

  const currency = data.account.currency;
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const maxAbsPnl = Math.max(1, ...[...byDate.values()].map((d) => Math.abs(d.pnl)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Kalendář</h1>
          <p className="text-sm text-muted">Denní PnL přehled</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonth((m) => subMonths(m, 1))} className="px-3 py-1.5 rounded-lg border border-card-border hover:border-accent text-sm">
            ‹
          </button>
          <span className="text-sm font-semibold capitalize min-w-[140px] text-center">{format(month, "LLLL yyyy", { locale: cs })}</span>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} className="px-3 py-1.5 rounded-lg border border-card-border hover:border-accent text-sm">
            ›
          </button>
          <button onClick={() => setMonth(new Date())} className="text-xs px-3 py-1.5 rounded-lg border border-card-border hover:border-accent">
            Dnes
          </button>
        </div>
      </div>

      <KpiGrid>
        <KpiCard label="Měsíční PnL" value={formatPlainCurrency(monthStats.pnl, currency)} variant={monthStats.pnl >= 0 ? "green" : "red"} />
        <KpiCard label="Obchodní dny" value={String(monthStats.tradingDays)} />
        <KpiCard label="Ziskové dny" value={String(monthStats.winDays)} variant="green" />
        <KpiCard label="Ztrátové dny" value={String(monthStats.lossDays)} variant="red" />
        <KpiCard label="Obchodů celkem" value={String(monthStats.trades)} />
      </KpiGrid>

      <Card>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-xs text-muted font-medium py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const entry = byDate.get(key);
            const inMonth = isSameMonth(d, month);
            const intensity = entry ? Math.min(1, Math.abs(entry.pnl) / maxAbsPnl) : 0;
            const bg = entry
              ? entry.pnl > 0
                ? `rgba(34, 197, 94, ${0.1 + intensity * 0.35})`
                : entry.pnl < 0
                ? `rgba(239, 68, 68, ${0.1 + intensity * 0.35})`
                : undefined
              : undefined;
            return (
              <div
                key={key}
                className={`rounded-lg border p-2 min-h-[72px] flex flex-col justify-between ${
                  inMonth ? "border-card-border" : "border-transparent opacity-30"
                } ${isToday(d) ? "ring-1 ring-accent" : ""}`}
                style={{ background: bg }}
              >
                <span className="text-[11px] text-muted-2">{format(d, "d")}</span>
                {entry && inMonth && (
                  <div className="text-right">
                    <div className={`text-xs font-semibold ${pnlColor(entry.pnl)}`}>{formatPlainCurrency(entry.pnl, currency)}</div>
                    <div className="text-[10px] text-muted-2">
                      {entry.trades}T · {formatPercent(entry.winRate, 0)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
