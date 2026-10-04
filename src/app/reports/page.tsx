"use client";

import { useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { buildTradeQuery } from "@/hooks/useTrades";
import { Card } from "@/components/ui/Card";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { StatsTable } from "@/components/ui/StatsTable";
import { ResultBadge, DirectionBadge } from "@/components/ui/Badge";
import { formatDateCz, formatPercent, formatPlainCurrency, formatRR, pnlColor } from "@/lib/format";
import type { TradeFilters } from "@/types/trade";

type Period = "week" | "month";

export default function ReportsPage() {
  const { accountId } = useAccount();
  const [filters] = useState<TradeFilters>({});
  const { data, loading, error } = useAnalytics(accountId, filters);
  const [period, setPeriod] = useState<Period>("month");

  function exportFile(format: "csv" | "json") {
    if (!accountId) return;
    const qs = buildTradeQuery(accountId, filters);
    window.open(`/api/export?${qs}&format=${format}`, "_blank");
  }

  if (!accountId || loading) return <div className="text-muted text-sm">Načítám...</div>;
  if (error || !data) return <div className="text-red text-sm">{error ?? "Chyba při načítání dat"}</div>;

  const { analytics } = data;
  const currency = data.account.currency;
  const rows = period === "week" ? analytics.byWeek : analytics.byMonth;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Reporty</h1>
          <p className="text-sm text-muted">Souhrnné výkazy výkonnosti účtu {data.account.name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportFile("csv")} className="text-xs px-3 py-2 rounded-lg border border-card-border hover:border-accent">
            Export CSV
          </button>
          <button onClick={() => exportFile("json")} className="text-xs px-3 py-2 rounded-lg border border-card-border hover:border-accent">
            Export JSON
          </button>
        </div>
      </div>

      <KpiGrid>
        <KpiCard label="Celkový PnL" value={formatPlainCurrency(analytics.totals.totalPnl, currency)} variant={analytics.totals.totalPnl >= 0 ? "green" : "red"} />
        <KpiCard label="Return %" value={formatPercent(analytics.totals.totalReturnPercent)} variant={analytics.totals.totalReturnPercent >= 0 ? "green" : "red"} />
        <KpiCard label="Win Rate" value={formatPercent(analytics.totals.winRate)} />
        <KpiCard label="Profit Factor" value={Number.isFinite(analytics.rr.profitFactor) ? analytics.rr.profitFactor.toFixed(2) : "∞"} />
        <KpiCard label="Max Drawdown" value={formatPlainCurrency(analytics.drawdown.max, currency)} variant="red" />
        <KpiCard label="Expectancy" value={formatPlainCurrency(analytics.rr.expectancy.dollar, currency)} />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Nejlepší obchod">
          <TradeSummary trade={analytics.bestTrade} currency={currency} />
        </Card>
        <Card title="Nejhorší obchod">
          <TradeSummary trade={analytics.worstTrade} currency={currency} />
        </Card>
      </div>

      <Card
        title="Periodický report"
        action={
          <div className="flex gap-1 bg-surface-2 rounded-lg p-1">
            {(["week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                  period === p ? "bg-accent text-white" : "text-muted hover:text-foreground"
                }`}
              >
                {p === "week" ? "Týdně" : "Měsíčně"}
              </button>
            ))}
          </div>
        }
      >
        <StatsTable rows={rows} currency={currency} keyLabel={period === "week" ? "Týden" : "Měsíc"} />
      </Card>

      <Card title="Drawdown statistiky">
        <KpiGrid>
          <KpiCard label="Aktuální DD" value={formatPlainCurrency(analytics.drawdown.current, currency)} variant="red" />
          <KpiCard label="Max DD" value={formatPlainCurrency(analytics.drawdown.max, currency)} variant="red" />
          <KpiCard label="Max DD %" value={formatPercent(analytics.drawdown.maxPercent)} variant="red" />
          <KpiCard label="Nejdelší DD" value={`${analytics.drawdown.longestDays} dní`} />
          <KpiCard label="Avg DD délka" value={`${analytics.drawdown.averageDays.toFixed(1)} dní`} />
          <KpiCard label="Recovery" value={analytics.drawdown.recoveryDays !== null ? `${analytics.drawdown.recoveryDays} dní` : "—"} />
        </KpiGrid>
      </Card>
    </div>
  );
}

function TradeSummary({ trade, currency }: { trade: { id: string; date: string; time: string; instrument: string; direction: "LONG" | "SHORT"; result: "WIN" | "LOSS" | "BE" | null; netPnl: number | null; realizedRR: number | null } | null; currency: string }) {
  if (!trade) return <div className="text-muted text-sm">Žádná data.</div>;
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold flex items-center gap-2">
          {trade.instrument} <DirectionBadge direction={trade.direction} /> <ResultBadge result={trade.result} />
        </div>
        <div className="text-xs text-muted mt-0.5">
          {formatDateCz(trade.date)} {trade.time}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold ${pnlColor(trade.netPnl)}`}>{formatPlainCurrency(trade.netPnl, currency)}</div>
        <div className="text-xs text-muted">{formatRR(trade.realizedRR)}</div>
      </div>
    </div>
  );
}
