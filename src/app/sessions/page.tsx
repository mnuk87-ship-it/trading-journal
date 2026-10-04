"use client";

import { useAccount } from "@/contexts/AccountContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/Card";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { StatsTable } from "@/components/ui/StatsTable";
import { BreakdownBarChart } from "@/components/charts/BreakdownBarChart";
import { formatPercent, formatPlainCurrency, pnlColor } from "@/lib/format";
import { dictionary } from "@/lib/i18n";

export default function SessionsPage() {
  const { accountId } = useAccount();
  const { data, loading, error } = useAnalytics(accountId, {});

  if (!accountId || loading) return <div className="text-muted text-sm">Načítám...</div>;
  if (error || !data) return <div className="text-red text-sm">{error ?? "Chyba při načítání dat"}</div>;

  const { analytics } = data;
  const currency = data.account.currency;
  const best = [...analytics.bySession].filter((s) => s.trades > 0).sort((a, b) => b.pnl - a.pnl)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Trading Sessions</h1>
        <p className="text-sm text-muted">Výkonnost podle obchodní session a hodiny vstupu</p>
      </div>

      <KpiGrid>
        {analytics.bySession.map((s) => (
          <KpiCard
            key={s.key}
            label={dictionary.session[s.key as keyof typeof dictionary.session] ?? s.key}
            value={formatPlainCurrency(s.pnl, currency)}
            sub={`${s.trades} obchodů · ${formatPercent(s.winRate)}`}
            variant={s.pnl > 0 ? "green" : s.pnl < 0 ? "red" : "default"}
          />
        ))}
      </KpiGrid>

      {best && (
        <div className="bg-accent-soft border border-accent/30 rounded-xl p-3 text-sm">
          Nejlepší session: <span className="font-semibold text-accent">{dictionary.session[best.key as keyof typeof dictionary.session] ?? best.key}</span>{" "}
          s PnL <span className={`font-semibold ${pnlColor(best.pnl)}`}>{formatPlainCurrency(best.pnl, currency)}</span>
        </div>
      )}

      <Card title="Detail podle session">
        <StatsTable rows={analytics.bySession} currency={currency} keyLabel="Session" />
      </Card>

      <Card title="PnL podle hodiny vstupu">
        <BreakdownBarChart data={analytics.byHour} currency={currency} />
      </Card>

      <Card title="Detail podle hodiny">
        <StatsTable rows={analytics.byHour} currency={currency} keyLabel="Hodina" />
      </Card>

      <Card title="Podle dne v týdnu">
        <BreakdownBarChart data={analytics.byDayOfWeek} currency={currency} />
        <div className="mt-4">
          <StatsTable rows={analytics.byDayOfWeek} currency={currency} keyLabel="Den" />
        </div>
      </Card>
    </div>
  );
}
