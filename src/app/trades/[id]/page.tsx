"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import type { TradeDTO } from "@/types/trade";
import { Card } from "@/components/ui/Card";
import { KpiCard, KpiGrid } from "@/components/ui/KpiCard";
import { ResultBadge, DirectionBadge, Tag } from "@/components/ui/Badge";
import { formatDateCz, formatDuration, formatPlainCurrency, formatRR, pnlColor } from "@/lib/format";
import { useAccount } from "@/contexts/AccountContext";
import { useTradeModal } from "@/contexts/TradeModalContext";
import { deleteTrade } from "@/hooks/useTrades";
import { dictionary } from "@/lib/i18n";
import { getContractSpec } from "@/lib/contractSpecs";
import { confluenceLabel } from "@/lib/confluences";

export default function TradeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { account } = useAccount();
  const { openEdit } = useTradeModal();
  const [trade, setTrade] = useState<TradeDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades/${params.id}`);
      if (!res.ok) throw new Error("Obchod nenalezen");
      setTrade(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleDelete() {
    if (!trade) return;
    if (!confirm("Opravdu smazat tento obchod?")) return;
    await deleteTrade(trade.id);
    router.push("/trades");
  }

  if (loading) return <div className="text-muted text-sm">Načítám...</div>;
  if (error || !trade) return <div className="text-red text-sm">{error ?? "Obchod nenalezen"}</div>;

  const currency = account?.currency ?? "USD";
  const before = trade.screenshots.find((s) => s.type === "BEFORE");
  const after = trade.screenshots.find((s) => s.type === "AFTER");
  const contractSpec = getContractSpec(trade.instrument);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button onClick={() => router.push("/trades")} className="text-xs text-muted hover:text-foreground mb-1">
            ← Zpět na obchody
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {trade.instrument} <DirectionBadge direction={trade.direction} /> <ResultBadge result={trade.result} />
          </h1>
          <p className="text-sm text-muted">
            {formatDateCz(trade.date)} {trade.time} · {dictionary.session[trade.session]} · {trade.timeframe}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openEdit(trade)} className="text-xs px-3 py-2 rounded-lg border border-card-border hover:border-accent">
            Upravit
          </button>
          <button onClick={handleDelete} className="text-xs px-3 py-2 rounded-lg border border-card-border text-red hover:bg-red-soft">
            Smazat
          </button>
        </div>
      </div>

      <KpiGrid>
        <KpiCard label="Net PnL" value={formatPlainCurrency(trade.netPnl, currency)} variant={trade.netPnl && trade.netPnl > 0 ? "green" : trade.netPnl && trade.netPnl < 0 ? "red" : "default"} />
        <KpiCard label="Realized RR" value={formatRR(trade.realizedRR)} />
        <KpiCard label="Potential RR" value={formatRR(trade.potentialRR)} />
        <KpiCard label="Ideal RR" value={formatRR(trade.idealRR)} />
        <KpiCard label="Risk %" value={trade.riskPercent ? `${trade.riskPercent.toFixed(2)}%` : "—"} />
        <KpiCard label="Trvání" value={formatDuration(trade.durationMinutes)} />
      </KpiGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Parametry obchodu">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Field label="Entry" value={trade.entryPrice} />
            <Field label="Stop Loss" value={trade.stopLoss} />
            <Field label="Take Profit" value={trade.takeProfit} />
            <Field label="Exit" value={trade.exitPrice} />
            <Field label="Position Size (skutečná)" value={trade.positionSize} />
            <Field label="Point value" value={`${contractSpec.pointValue}$ / bod`} raw />
            <Field label="Fees" value={trade.fees} />
            <Field label="Risk $" value={trade.riskDollar !== null ? formatPlainCurrency(trade.riskDollar, currency) : "—"} raw />
            <Field label="Risk %" value={trade.riskPercent !== null ? `${trade.riskPercent.toFixed(3)}%` : "—"} raw />
            <Field label="Potential Profit $" value={trade.potentialProfitDollar !== null ? formatPlainCurrency(trade.potentialProfitDollar, currency) : "—"} raw />
            <Field label="MFE" value={trade.mfe} />
            <Field label="MAE" value={trade.mae} />
          </dl>
        </Card>

        <Card title="Setup">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Field label="Strategie" value={trade.strategy?.name ?? "—"} raw />
            <Field label="A+ Setup" value={trade.isAPlus ? "Ano" : "Ne"} raw />
            <Field label="Trend" value={trade.trend ? dictionary.trend[trade.trend] : "—"} raw />
            <Field label="Market type" value={trade.marketType ? dictionary.marketType[trade.marketType] : "—"} raw />
            <Field label="Market condition" value={trade.marketCondition ?? "—"} raw full />
            <Field label="Entry reason" value={trade.entryReason ?? "—"} raw full />
          </dl>
          {trade.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {trade.tags.map((t) => (
                <Tag key={t.id} name={t.name} />
              ))}
            </div>
          )}
          {trade.confluences.length > 0 && (
            <div className="mt-3">
              <div className="text-muted-2 text-xs mb-1.5">Konfluence</div>
              <div className="flex flex-wrap gap-1.5">
                {trade.confluences.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-accent-soft text-accent border border-accent font-medium"
                  >
                    {confluenceLabel(key)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="Trade management">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Field label="Posunul SL?" value={trade.movedSL ? "Ano" : "Ne"} raw />
            <Field label="Partial profit?" value={trade.tookPartial ? "Ano" : "Ne"} raw />
            {trade.tookPartial && (
              <>
                <Field label="Partial %" value={trade.partialPercent} />
                <Field label="Počet partials" value={trade.numPartials} />
                <Field label="Avg exit price" value={trade.avgExitPrice} />
              </>
            )}
            <Field label="Dle plánu?" value={trade.followedPlan ? "Ano" : "Ne"} raw />
            <Field label="Revenge trade?" value={trade.revengeTrade ? "Ano" : "Ne"} raw />
            <Field label="Overtrading?" value={trade.overtraded ? "Ano" : "Ne"} raw />
            <Field label="Dle setupu?" value={trade.accordingToSetup ? "Ano" : "Ne"} raw />
          </dl>
        </Card>

        <Card title="Psychologie">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <Field label="Emoce před" value={trade.emotionBefore ? dictionary.emotion[trade.emotionBefore] : "—"} raw />
            <Field label="Emoce po" value={trade.emotionAfter ? dictionary.emotion[trade.emotionAfter] : "—"} raw />
            <Field label="Jistota" value={trade.confidence !== null ? `${trade.confidence}/10` : "—"} raw />
            <Field label="Disciplína" value={trade.discipline !== null ? `${trade.discipline}/10` : "—"} raw />
            <Field label="Trpělivost" value={trade.patience !== null ? `${trade.patience}/10` : "—"} raw />
            <Field label="Stres" value={trade.stress !== null ? `${trade.stress}/10` : "—"} raw />
          </dl>
          <div className="mt-3 space-y-2 text-xs">
            <NoteBlock label="Co jsem před obchodem viděl?" value={trade.notesSeen} />
            <NoteBlock label="Co jsem udělal dobře?" value={trade.notesGood} />
            <NoteBlock label="Co jsem udělal špatně?" value={trade.notesBad} />
            <NoteBlock label="Co příště udělám jinak?" value={trade.notesNext} />
          </div>
        </Card>
      </div>

      {(before || after) && (
        <Card title="Screenshoty">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {before && (
              <div>
                <div className="text-xs text-muted mb-1.5">Before Trade</div>
                <div className="relative w-full h-64 bg-surface-2 rounded-lg overflow-hidden">
                  <Image src={before.url} alt="Before" fill className="object-contain" unoptimized />
                </div>
              </div>
            )}
            {after && (
              <div>
                <div className="text-xs text-muted mb-1.5">After Trade</div>
                <div className="relative w-full h-64 bg-surface-2 rounded-lg overflow-hidden">
                  <Image src={after.url} alt="After" fill className="object-contain" unoptimized />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <p className="text-xs text-muted-2 text-center">
        Vytvořeno {formatDateCz(trade.createdAt.slice(0, 10))} · Upraveno {formatDateCz(trade.updatedAt.slice(0, 10))} · ID: {trade.id}
      </p>
    </div>
  );
}

function Field({ label, value, raw, full }: { label: string; value: unknown; raw?: boolean; full?: boolean }) {
  const display = raw ? String(value) : value === null || value === undefined ? "—" : String(value);
  return (
    <div className={full ? "col-span-2" : undefined}>
      <dt className="text-muted-2 text-xs">{label}</dt>
      <dd className={`font-medium ${pnlColor(typeof value === "number" ? value : null)}`}>{display}</dd>
    </div>
  );
}

function NoteBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="bg-surface-2 rounded-lg p-2.5">
      <div className="text-muted-2 mb-1">{label}</div>
      <div className="text-foreground whitespace-pre-wrap">{value}</div>
    </div>
  );
}
