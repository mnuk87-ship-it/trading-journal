"use client";

import { useMemo } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useTrades } from "@/hooks/useTrades";
import { Card } from "@/components/ui/Card";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { StatsTable } from "@/components/ui/StatsTable";
import { formatPlainCurrency } from "@/lib/format";
import { EMOTIONS } from "@/types/trade";
import { dictionary } from "@/lib/i18n";

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

export default function PsychologyPage() {
  const { accountId } = useAccount();
  const { data, loading, error } = useAnalytics(accountId, {});
  const { trades } = useTrades(accountId, {});

  const scores = useMemo(() => {
    const closed = trades.filter((t) => t.result !== null);
    return {
      confidence: avg(closed.map((t) => t.confidence).filter((v): v is number => v !== null)),
      discipline: avg(closed.map((t) => t.discipline).filter((v): v is number => v !== null)),
      patience: avg(closed.map((t) => t.patience).filter((v): v is number => v !== null)),
      stress: avg(closed.map((t) => t.stress).filter((v): v is number => v !== null)),
    };
  }, [trades]);

  const emotionCounts = useMemo(() => {
    const before = new Map<string, number>();
    const after = new Map<string, number>();
    for (const t of trades) {
      if (t.emotionBefore) before.set(t.emotionBefore, (before.get(t.emotionBefore) ?? 0) + 1);
      if (t.emotionAfter) after.set(t.emotionAfter, (after.get(t.emotionAfter) ?? 0) + 1);
    }
    return { before, after };
  }, [trades]);

  if (!accountId || loading) return <div className="text-muted text-sm">Načítám...</div>;
  if (error || !data) return <div className="text-red text-sm">{error ?? "Chyba při načítání dat"}</div>;

  const { analytics } = data;
  const currency = data.account.currency;

  const psychRows = [
    analytics.psychology.followedPlan,
    analytics.psychology.brokePlan,
    analytics.psychology.fomo,
    analytics.psychology.revenge,
    analytics.psychology.overtraded,
    analytics.psychology.lowConfidence,
    analytics.psychology.highConfidence,
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Psychologie obchodování</h1>
        <p className="text-sm text-muted">Vliv emocí, disciplíny a rozhodování na výsledky</p>
      </div>

      <KpiGrid>
        <KpiCard label="Průměrná jistota" value={scores.confidence ? `${scores.confidence.toFixed(1)}/10` : "—"} />
        <KpiCard label="Průměrná disciplína" value={scores.discipline ? `${scores.discipline.toFixed(1)}/10` : "—"} />
        <KpiCard label="Průměrná trpělivost" value={scores.patience ? `${scores.patience.toFixed(1)}/10` : "—"} />
        <KpiCard label="Průměrný stres" value={scores.stress ? `${scores.stress.toFixed(1)}/10` : "—"} />
      </KpiGrid>

      <Card title="Dodržování plánu, FOMO, Revenge trading, Overtrading">
        <StatsTable rows={psychRows} currency={currency} keyLabel="Kategorie" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Emoce před obchodem">
          <EmotionBars counts={emotionCounts.before} />
        </Card>
        <Card title="Emoce po obchodě">
          <EmotionBars counts={emotionCounts.after} />
        </Card>
      </div>

      <Card title="A+ Setup vs. ostatní">
        <KpiGrid>
          <KpiCard
            label="A+ PnL"
            value={formatPlainCurrency(analytics.aPlus.aplus.pnl, currency)}
            sub={`${analytics.aPlus.aplus.trades} obchodů`}
            variant={analytics.aPlus.aplus.pnl >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Non A+ PnL"
            value={formatPlainCurrency(analytics.aPlus.nonAplus.pnl, currency)}
            sub={`${analytics.aPlus.nonAplus.trades} obchodů`}
            variant={analytics.aPlus.nonAplus.pnl >= 0 ? "green" : "red"}
          />
        </KpiGrid>
      </Card>
    </div>
  );
}

function EmotionBars({ counts }: { counts: Map<string, number> }) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (!total) return <div className="text-muted text-sm">Žádná data.</div>;
  return (
    <div className="space-y-2">
      {EMOTIONS.filter((e) => counts.has(e)).map((e) => {
        const count = counts.get(e) ?? 0;
        const pct = (count / total) * 100;
        return (
          <div key={e}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-foreground">{dictionary.emotion[e]}</span>
              <span className="text-muted-2">
                {count} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
