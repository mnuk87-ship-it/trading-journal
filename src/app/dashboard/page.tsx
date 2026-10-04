"use client";

import { useAccount } from "@/contexts/AccountContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { Card } from "@/components/ui/Card";
import { EquityCurveChart } from "@/components/charts/EquityCurveChart";
import { formatPlainCurrency, formatPercent, formatRR, formatNumber } from "@/lib/format";

export default function DashboardPage() {
  const { accountId } = useAccount();
  const { data, loading, error } = useAnalytics(accountId, {});

  if (!accountId || loading) return <div className="text-muted text-sm">Načítám...</div>;
  if (error || !data) return <div className="text-red text-sm">{error ?? "Chyba při načítání dat"}</div>;

  const { analytics } = data;
  const currency = data.account.currency;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted">Přehled výkonnosti účtu {data.account.name}</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wide text-muted font-semibold">Account</h2>
        <KpiGrid>
          <KpiCard label="Starting Balance" value={formatPlainCurrency(data.account.startingBalance, currency)} />
          <KpiCard
            label="Current Balance"
            value={formatPlainCurrency(data.account.currentBalance, currency)}
            variant={data.account.currentBalance >= data.account.startingBalance ? "green" : "red"}
          />
          <KpiCard
            label="Total PnL"
            value={formatPlainCurrency(analytics.totals.totalPnl, currency)}
            variant={analytics.totals.totalPnl >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Total Return %"
            value={formatPercent(analytics.totals.totalReturnPercent)}
            variant={analytics.totals.totalReturnPercent >= 0 ? "green" : "red"}
          />
          <KpiCard label="Current Drawdown" value={formatPlainCurrency(analytics.drawdown.current, currency)} variant="red" />
          <KpiCard label="Max Drawdown" value={formatPlainCurrency(analytics.drawdown.max, currency)} variant="red" />
        </KpiGrid>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wide text-muted font-semibold">Trading performance</h2>
        <KpiGrid>
          <KpiCard label="Win Rate" value={formatPercent(analytics.totals.winRate)} variant="green" />
          <KpiCard label="Loss Rate" value={formatPercent(analytics.totals.lossRate)} variant="red" />
          <KpiCard label="Breakeven Rate" value={formatPercent(analytics.totals.breakevenRate)} />
          <KpiCard label="Total Trades" value={String(analytics.totals.totalTrades)} />
          <KpiCard label="Winning Trades" value={String(analytics.totals.winningTrades)} variant="green" />
          <KpiCard label="Losing Trades" value={String(analytics.totals.losingTrades)} variant="red" />
        </KpiGrid>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wide text-muted font-semibold">Risk / Reward</h2>
        <KpiGrid>
          <KpiCard label="Average RR" value={formatRR(analytics.rr.averageRR)} />
          <KpiCard label="Median RR" value={formatRR(analytics.rr.medianRR)} />
          <KpiCard label="Max RR" value={formatRR(analytics.rr.maxRR)} />
          <KpiCard label="Average Win" value={formatPlainCurrency(analytics.rr.averageWin, currency)} variant="green" />
          <KpiCard label="Average Loss" value={formatPlainCurrency(analytics.rr.averageLoss, currency)} variant="red" />
          <KpiCard label="Largest Win" value={formatPlainCurrency(analytics.rr.largestWin, currency)} variant="green" />
          <KpiCard label="Largest Loss" value={formatPlainCurrency(analytics.rr.largestLoss, currency)} variant="red" />
          <KpiCard label="Profit Factor" value={formatNumber(analytics.rr.profitFactor)} />
          <KpiCard label="Expectancy" value={formatPlainCurrency(analytics.rr.expectancy.dollar, currency)} />
          <KpiCard label="Payoff Ratio" value={formatNumber(analytics.rr.payoffRatio)} />
        </KpiGrid>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs uppercase tracking-wide text-muted font-semibold">Streaks & Frequency</h2>
        <KpiGrid>
          <KpiCard label="Current Win Streak" value={String(analytics.streaks.currentWinStreak)} variant="green" />
          <KpiCard label="Current Loss Streak" value={String(analytics.streaks.currentLossStreak)} variant="red" />
          <KpiCard label="Max Win Streak" value={String(analytics.streaks.maxWinStreak)} />
          <KpiCard label="Max Loss Streak" value={String(analytics.streaks.maxLossStreak)} />
          <KpiCard label="Trades / Day" value={formatNumber(analytics.frequency.perDay)} />
          <KpiCard label="Trades / Week" value={formatNumber(analytics.frequency.perWeek)} />
        </KpiGrid>
      </section>

      <Card title="Equity Curve">
        <EquityCurveChart data={analytics.equityCurve} currency={currency} />
      </Card>
    </div>
  );
}
