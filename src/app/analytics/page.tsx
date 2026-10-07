"use client";

import { useState } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { FilterBar } from "@/components/trades/FilterBar";
import { Card } from "@/components/ui/Card";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { StatsTable } from "@/components/ui/StatsTable";
import { ConfluenceStatsTable } from "@/components/ui/ConfluenceStatsTable";
import { RsiStatsTable, type RsiStatsRow } from "@/components/ui/RsiStatsTable";
import { BreakdownBarChart } from "@/components/charts/BreakdownBarChart";
import { RRComparisonChart } from "@/components/charts/RRComparisonChart";
import { formatPercent, formatPlainCurrency, formatRR, formatDuration, formatNumber } from "@/lib/format";
import type { TradeFilters } from "@/types/trade";

export default function AnalyticsPage() {
  const { accountId } = useAccount();
  const [filters, setFilters] = useState<TradeFilters>({});
  const [minSample, setMinSample] = useState(20);
  const [minRsiSample, setMinRsiSample] = useState(10);
  const { data, loading, error } = useAnalytics(accountId, filters, minSample, minRsiSample);

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

      <Card title="RSI Cross konfluence">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <p className="text-xs text-muted">
            Detailní RSI data (hodnota, směr, zóna, timing) pro 15M (primární potvrzení) a 5M (sekundární
            potvrzení / přesnější timing vstupu). Čistě analytický pohled - neovlivňuje risk, Position Size, PnL
            ani R:R. Starší obchody bez RSI dat se do statistik nezapočítávají.
          </p>
          <label className="flex items-center gap-2 text-xs text-muted shrink-0">
            Min. počet obchodů
            <input
              type="number"
              min={1}
              value={minRsiSample}
              onChange={(e) => setMinRsiSample(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
          <KpiCard
            label="RSI 15M Cross - Win Rate"
            value={
              analytics.rsi.timeframe15m.overall.insufficientData
                ? "Insufficient data"
                : formatPercent(analytics.rsi.timeframe15m.overall.winRate)
            }
          />
          <KpiCard
            label="RSI 5M Cross - Win Rate"
            value={
              analytics.rsi.timeframe5m.overall.insufficientData
                ? "Insufficient data"
                : formatPercent(analytics.rsi.timeframe5m.overall.winRate)
            }
          />
          <KpiCard label="Počet obchodů s RSI daty" value={`${analytics.rsi.timeframe15m.overall.trades} / ${analytics.rsi.timeframe5m.overall.trades}`} />
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-accent mb-2">Primární potvrzení - 15M RSI Cross (zóny)</h4>
          <RsiStatsTable
            rows={analytics.rsi.timeframe15m.zones.map<RsiStatsRow>((z) => ({ ...z, key: z.zone, label: z.zoneLabel }))}
            currency={currency}
            keyLabel="RSI Zóna (15M)"
            emptyMessage="Žádná data."
          />
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-muted mb-2">Sekundární potvrzení - 5M RSI Cross (zóny)</h4>
          <RsiStatsTable
            rows={analytics.rsi.timeframe5m.zones.map<RsiStatsRow>((z) => ({ ...z, key: z.zone, label: z.zoneLabel }))}
            currency={currency}
            keyLabel="RSI Zóna (5M)"
            emptyMessage="Žádná data."
          />
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-semibold text-foreground mb-2">Kombinace 15M / 15M+5M / 5M</h4>
          <RsiStatsTable
            rows={analytics.rsi.combos.map<RsiStatsRow>((c) => ({ ...c, key: c.combo, label: c.label }))}
            currency={currency}
            keyLabel="Kombinace"
            emptyMessage="Žádná data."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <h4 className="text-xs font-semibold text-accent mb-2">RSI hodnota při crossu - 15M (Winners vs Losers)</h4>
            <RsiValueAnalysisTable analysis={analytics.rsi.timeframe15m.valueAnalysis} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted mb-2">RSI hodnota při crossu - 5M (Winners vs Losers)</h4>
            <RsiValueAnalysisTable analysis={analytics.rsi.timeframe5m.valueAnalysis} />
          </div>
        </div>
      </Card>
    </div>
  );
}

function RsiValueAnalysisTable({
  analysis,
}: {
  analysis: { winners: RsiValueDist; losers: RsiValueDist };
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-card-border">
      <table className="w-full text-xs">
        <thead className="bg-surface-2">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-muted whitespace-nowrap">Skupina</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Počet</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Průměr</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Medián</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Min</th>
            <th className="text-right px-3 py-2 font-medium text-muted whitespace-nowrap">Max</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-card-border">
            <td className="px-3 py-2 font-medium text-green">Winners</td>
            <td className="px-3 py-2 text-right">{analysis.winners.count}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.winners.average, 1)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.winners.median, 1)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.winners.min, 1)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.winners.max, 1)}</td>
          </tr>
          <tr className="border-t border-card-border">
            <td className="px-3 py-2 font-medium text-red">Losers</td>
            <td className="px-3 py-2 text-right">{analysis.losers.count}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.losers.average, 1)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.losers.median, 1)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.losers.min, 1)}</td>
            <td className="px-3 py-2 text-right">{formatNumber(analysis.losers.max, 1)}</td>
          </tr>
          {analysis.winners.count === 0 && analysis.losers.count === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-muted">
                Žádná data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface RsiValueDist {
  count: number;
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
}
