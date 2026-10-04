"use client";

import { useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { FilterBar } from "@/components/trades/FilterBar";
import { Card } from "@/components/ui/Card";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { StatsTable } from "@/components/ui/StatsTable";
import { ConfluenceStatsTable } from "@/components/ui/ConfluenceStatsTable";
import { BreakdownBarChart } from "@/components/charts/BreakdownBarChart";
import { RRComparisonChart } from "@/components/charts/RRComparisonChart";
import { formatPercent, formatPlainCurrency, formatRR, formatDuration } from "@/lib/format";
import type { TradeFilters } from "@/types/trade";

export default function AnalyticsPage() {
  const { accountId } = useAccount();
  const [filters, setFilters] = useState<TradeFilters>({});
  const [minSample, setMinSample] = useState(20);
  const { data, loading, error } = useAnalytics(accountId, filters, minSample);

  if (!accountId || loading) return <div className="text-muted text-sm">Načítám...</div>;
  if (error || !data) return <div className="text-red text-sm">{error ?? "Chyba při načítání dat"}</div>;

  const { analytics } = data;
  const currency = data.account.currency;
  const direction = [analytics.byDirection.LONG, analytics.byDirection.SHORT];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Analytika</h1>
        <p className="text-sm text-muted">Detailní rozbor výkonnosti podle session, dne, hodiny, setupu a směru</p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} showSearch={false} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Winners">
          <KpiGrid>
            <KpiCard label="Počet" value={String(analytics.winnersLosers.winners.total)} variant="green" />
            <KpiCard label="Nejlepší" value={formatPlainCurrency(analytics.winnersLosers.winners.best, currency)} variant="green" />
            <KpiCard label="Průměr" value={formatPlainCurrency(analytics.winnersLosers.winners.average, currency)} variant="green" />
            <KpiCard label="Avg trvání" value={formatDuration(analytics.winnersLosers.winners.averageDuration)} />
            <KpiCard label="Max streak" value={String(analytics.winnersLosers.winners.maxConsecutive)} />
            <KpiCard label="Avg streak" value={analytics.winnersLosers.winners.avgConsecutive.toFixed(1)} />
          </KpiGrid>
        </Card>
        <Card title="Losers">
          <KpiGrid>
            <KpiCard label="Počet" value={String(analytics.winnersLosers.losers.total)} variant="red" />
            <KpiCard label="Nejhorší" value={formatPlainCurrency(analytics.winnersLosers.losers.worst, currency)} variant="red" />
            <KpiCard label="Průměr" value={formatPlainCurrency(analytics.winnersLosers.losers.average, currency)} variant="red" />
            <KpiCard label="Avg trvání" value={formatDuration(analytics.winnersLosers.losers.averageDuration)} />
            <KpiCard label="Max streak" value={String(analytics.winnersLosers.losers.maxConsecutive)} />
            <KpiCard label="Avg streak" value={analytics.winnersLosers.losers.avgConsecutive.toFixed(1)} />
          </KpiGrid>
        </Card>
      </section>

      <Card title="Ideal RR vs. Realized RR">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <KpiCard label="Avg Ideal RR" value={formatRR(analytics.idealRR.avgIdealRR)} />
          <KpiCard label="Max Ideal RR" value={formatRR(analytics.idealRR.maxIdealRR)} />
          <KpiCard label="Avg Realized RR" value={formatRR(analytics.idealRR.avgRealizedRR)} />
        </div>
        <RRComparisonChart data={analytics.idealRR.series} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Podle session">
          <BreakdownBarChart data={analytics.bySession} currency={currency} height={220} />
        </Card>
        <Card title="Podle směru">
          <BreakdownBarChart data={direction} currency={currency} height={220} />
        </Card>
      </div>

      <Card title="Podle dne v týdnu">
        <BreakdownBarChart data={analytics.byDayOfWeek} currency={currency} />
      </Card>

      <Card title="Podle hodiny vstupu">
        <BreakdownBarChart data={analytics.byHour} currency={currency} />
      </Card>

      <Card title="Podle setupu / strategie">
        <StatsTable rows={analytics.byStrategy} currency={currency} keyLabel="Setup" />
      </Card>

      <Card title="A+ Setupy vs. ostatní">
        <StatsTable rows={[analytics.aPlus.aplus, analytics.aPlus.nonAplus]} currency={currency} keyLabel="Typ" />
      </Card>

      <Card title="Risk management">
        <KpiGrid>
          <KpiCard label="Průměrný risk %" value={formatPercent(analytics.risk.averageRiskPercent)} />
          <KpiCard label="Průměrný risk $" value={formatPlainCurrency(analytics.risk.averageRiskDollar, currency)} />
          <KpiCard label="Největší risk $" value={formatPlainCurrency(analytics.risk.largestRisk, currency)} />
          <KpiCard label="Počet obchodů s rizikem" value={String(analytics.risk.distribution.length)} />
        </KpiGrid>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Podle týdnů">
          <StatsTable rows={analytics.byWeek} currency={currency} keyLabel="Týden" />
        </Card>
        <Card title="Podle měsíců">
          <StatsTable rows={analytics.byMonth} currency={currency} keyLabel="Měsíc" />
        </Card>
      </div>

      <Card title="Konfluence - jednotlivě">
        <p className="text-xs text-muted mb-3">
          Výkonnost obchodní strategie podle jednotlivých konfluencí (FVG, BPR, OB, RSI Cross 15M/5M/1H, HVN, POC).
          Čistě analytický pohled - neovlivňuje risk, Position Size, PnL ani R:R jednotlivých obchodů.
        </p>
        <ConfluenceStatsTable rows={analytics.confluences.individual} currency={currency} />
      </Card>

      <Card title="Konfluence - kombinace">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <p className="text-xs text-muted">
            Obchod je zahrnutý do kombinace, pokud obsahuje <em>všechny</em> uvedené konfluence (může mít i další navíc).
            Kombinace s menším vzorkem než minimum se skryjí, aby nepůsobily staticky významně.
          </p>
          <label className="flex items-center gap-2 text-xs text-muted shrink-0">
            Min. počet obchodů
            <input
              type="number"
              min={1}
              value={minSample}
              onChange={(e) => setMinSample(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20"
            />
          </label>
        </div>
        <ConfluenceStatsTable
          rows={analytics.confluences.combos}
          currency={currency}
          keyLabel="Kombinace"
          emptyMessage={`Žádná kombinace nemá alespoň ${minSample} obchodů.`}
        />
      </Card>
    </div>
  );
}
