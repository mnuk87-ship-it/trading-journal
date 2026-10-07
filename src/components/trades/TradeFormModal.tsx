"use client";

import { useEffect, useMemo, useState } from "react";
import { useTradeModal } from "@/contexts/TradeModalContext";
import { useAccount } from "@/contexts/AccountContext";
import { useStrategies, useInstruments } from "@/hooks/useStrategies";
import { createTrade, updateTrade, ApiError } from "@/hooks/useTrades";
import { ScreenshotUpload } from "@/components/trades/ScreenshotUpload";
import {
  DIRECTIONS,
  SESSIONS,
  TIMEFRAMES,
  TRENDS,
  MARKET_TYPES,
  EMOTIONS,
  type Direction,
} from "@/types/trade";
import { computeTrade, calcRecommendedPositionSize, calcRiskPercent } from "@/lib/calculations";
import { getContractSpec } from "@/lib/contractSpecs";
import { CONFLUENCE_DEFS } from "@/lib/confluences";
import { RSI_DIRECTIONS } from "@/lib/rsi";
import { dictionary } from "@/lib/i18n";

// RSI_15M/RSI_5M mají vlastní dedikovanou sekci (viz níže) - v obecné
// konfluenční mřížce se tedy nezobrazují, aby nedocházelo k duplicitě.
const GENERIC_CONFLUENCE_DEFS = CONFLUENCE_DEFS.filter((c) => c.key !== "RSI_15M" && c.key !== "RSI_5M");

type Tab = "basic" | "params" | "setup" | "management" | "psychology" | "screenshots";

interface FormState {
  instrument: string;
  direction: Direction;
  date: string;
  time: string;
  session: string;
  timeframe: string;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  exitPrice: string;
  exitTime: string;
  positionSize: string;
  riskPercentInput: string;
  fees: string;
  mfe: string;
  mae: string;
  strategyId: string;
  entryReason: string;
  marketCondition: string;
  trend: string;
  marketType: string;
  isAPlus: boolean;
  movedSL: boolean;
  tookPartial: boolean;
  partialPercent: string;
  numPartials: string;
  avgExitPrice: string;
  followedPlan: boolean;
  revengeTrade: boolean;
  overtraded: boolean;
  accordingToSetup: boolean;
  emotionBefore: string;
  emotionAfter: string;
  confidence: string;
  discipline: string;
  patience: string;
  stress: string;
  notesSeen: string;
  notesGood: string;
  notesBad: string;
  notesNext: string;
  tags: string;
  confluences: string[];

  // --- RSI Cross (15M = primární, 5M = sekundární potvrzení) ---
  rsi15mCrossed: boolean;
  rsi15mDirection: string;
  rsi15mValue: string;
  rsi15mCrossTime: string;
  rsi15mCandlesToEntry: string;
  rsi5mCrossed: boolean;
  rsi5mDirection: string;
  rsi5mValue: string;
  rsi5mCrossTime: string;
  rsi5mCandlesToEntry: string;

  beforeScreenshot: string | null;
  afterScreenshot: string | null;
}

function emptyForm(defaults: { instrument: string; session: string; riskPct: number }): FormState {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString().slice(11, 16);
  return {
    instrument: defaults.instrument,
    direction: "LONG",
    date: today,
    time: now,
    session: defaults.session,
    timeframe: "15m",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    exitPrice: "",
    exitTime: "",
    positionSize: "1",
    riskPercentInput: String(defaults.riskPct),
    fees: "0",
    mfe: "",
    mae: "",
    strategyId: "",
    entryReason: "",
    marketCondition: "",
    trend: "",
    marketType: "",
    isAPlus: false,
    movedSL: false,
    tookPartial: false,
    partialPercent: "",
    numPartials: "",
    avgExitPrice: "",
    followedPlan: true,
    revengeTrade: false,
    overtraded: false,
    accordingToSetup: true,
    emotionBefore: "",
    emotionAfter: "",
    confidence: "",
    discipline: "",
    patience: "",
    stress: "",
    notesSeen: "",
    notesGood: "",
    notesBad: "",
    notesNext: "",
    tags: "",
    confluences: [],

    rsi15mCrossed: false,
    rsi15mDirection: "",
    rsi15mValue: "",
    rsi15mCrossTime: "",
    rsi15mCandlesToEntry: "",
    rsi5mCrossed: false,
    rsi5mDirection: "",
    rsi5mValue: "",
    rsi5mCrossTime: "",
    rsi5mCandlesToEntry: "",

    beforeScreenshot: null,
    afterScreenshot: null,
  };
}

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

export function TradeFormModal() {
  const { open, editingTrade, close, notifySaved } = useTradeModal();
  const { accountId, account } = useAccount();
  const { strategies, createStrategy } = useStrategies(accountId);
  const { instruments, addInstrument } = useInstruments(accountId);

  const [tab, setTab] = useState<Tab>("basic");
  const [advanced, setAdvanced] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    emptyForm({ instrument: "NQ", session: "New York", riskPct: 1 })
  );
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [newStrategyName, setNewStrategyName] = useState("");
  const [newInstrument, setNewInstrument] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab("basic");
    setErrors({});
    setGeneralError(null);
    if (editingTrade) {
      setForm({
        instrument: editingTrade.instrument,
        direction: editingTrade.direction,
        date: editingTrade.date,
        time: editingTrade.time,
        session: editingTrade.session,
        timeframe: editingTrade.timeframe,
        entryPrice: String(editingTrade.entryPrice),
        stopLoss: String(editingTrade.stopLoss),
        takeProfit: editingTrade.takeProfit !== null ? String(editingTrade.takeProfit) : "",
        exitPrice: editingTrade.exitPrice !== null ? String(editingTrade.exitPrice) : "",
        exitTime: editingTrade.exitTime ?? "",
        positionSize: String(editingTrade.positionSize),
        riskPercentInput: editingTrade.riskPercent !== null ? String(editingTrade.riskPercent.toFixed(2)) : "1",
        fees: String(editingTrade.fees),
        mfe: editingTrade.mfe !== null ? String(editingTrade.mfe) : "",
        mae: editingTrade.mae !== null ? String(editingTrade.mae) : "",
        strategyId: editingTrade.strategyId ?? "",
        entryReason: editingTrade.entryReason ?? "",
        marketCondition: editingTrade.marketCondition ?? "",
        trend: editingTrade.trend ?? "",
        marketType: editingTrade.marketType ?? "",
        isAPlus: editingTrade.isAPlus,
        movedSL: editingTrade.movedSL,
        tookPartial: editingTrade.tookPartial,
        partialPercent: editingTrade.partialPercent !== null ? String(editingTrade.partialPercent) : "",
        numPartials: editingTrade.numPartials !== null ? String(editingTrade.numPartials) : "",
        avgExitPrice: editingTrade.avgExitPrice !== null ? String(editingTrade.avgExitPrice) : "",
        followedPlan: editingTrade.followedPlan,
        revengeTrade: editingTrade.revengeTrade,
        overtraded: editingTrade.overtraded,
        accordingToSetup: editingTrade.accordingToSetup,
        emotionBefore: editingTrade.emotionBefore ?? "",
        emotionAfter: editingTrade.emotionAfter ?? "",
        confidence: editingTrade.confidence !== null ? String(editingTrade.confidence) : "",
        discipline: editingTrade.discipline !== null ? String(editingTrade.discipline) : "",
        patience: editingTrade.patience !== null ? String(editingTrade.patience) : "",
        stress: editingTrade.stress !== null ? String(editingTrade.stress) : "",
        notesSeen: editingTrade.notesSeen ?? "",
        notesGood: editingTrade.notesGood ?? "",
        notesBad: editingTrade.notesBad ?? "",
        notesNext: editingTrade.notesNext ?? "",
        tags: editingTrade.tags.map((t) => t.name).join(", "),
        confluences: [...editingTrade.confluences],

        rsi15mCrossed: editingTrade.rsi15mCrossed,
        rsi15mDirection: editingTrade.rsi15mDirection ?? "",
        rsi15mValue: editingTrade.rsi15mValue !== null ? String(editingTrade.rsi15mValue) : "",
        rsi15mCrossTime: editingTrade.rsi15mCrossTime ?? "",
        rsi15mCandlesToEntry: editingTrade.rsi15mCandlesToEntry !== null ? String(editingTrade.rsi15mCandlesToEntry) : "",
        rsi5mCrossed: editingTrade.rsi5mCrossed,
        rsi5mDirection: editingTrade.rsi5mDirection ?? "",
        rsi5mValue: editingTrade.rsi5mValue !== null ? String(editingTrade.rsi5mValue) : "",
        rsi5mCrossTime: editingTrade.rsi5mCrossTime ?? "",
        rsi5mCandlesToEntry: editingTrade.rsi5mCandlesToEntry !== null ? String(editingTrade.rsi5mCandlesToEntry) : "",

        beforeScreenshot: editingTrade.screenshots.find((s) => s.type === "BEFORE")?.url ?? null,
        afterScreenshot: editingTrade.screenshots.find((s) => s.type === "AFTER")?.url ?? null,
      });
    } else {
      setForm(
        emptyForm({
          instrument: account?.defaultInstrument ?? "NQ",
          session: account?.defaultSession ?? "New York",
          riskPct: account?.defaultRiskPct ?? 1,
        })
      );
    }
  }, [open, editingTrade, account]);

  const preview = useMemo(() => {
    const entry = num(form.entryPrice);
    const sl = num(form.stopLoss);
    const size = num(form.positionSize);
    if (entry === null || sl === null || size === null || !account) return null;
    return computeTrade({
      instrument: form.instrument.toUpperCase(),
      direction: form.direction,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: num(form.takeProfit),
      exitPrice: num(form.exitPrice),
      positionSize: size,
      fees: num(form.fees) ?? 0,
      mfe: num(form.mfe),
      time: form.time,
      exitTime: form.exitTime || null,
      breakevenThresholdR: account.breakevenThreshold,
    });
  }, [form, account]);

  // Doporučená (maximální) position size při zadaném Risk % - čistě informativní,
  // NIKDY nepřepisuje skutečně zadanou (actual) position size obchodu.
  const recommended = useMemo(() => {
    const entry = num(form.entryPrice);
    const sl = num(form.stopLoss);
    const riskPct = num(form.riskPercentInput);
    if (entry === null || sl === null || riskPct === null || !account) return null;
    return calcRecommendedPositionSize(account.startingBalance, riskPct, entry, sl, form.instrument);
  }, [form.entryPrice, form.stopLoss, form.riskPercentInput, form.instrument, account]);

  const contractSpec = useMemo(() => getContractSpec(form.instrument), [form.instrument]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleConfluence(key: string) {
    setForm((f) => ({
      ...f,
      confluences: f.confluences.includes(key)
        ? f.confluences.filter((k) => k !== key)
        : [...f.confluences, key],
    }));
  }

  async function handleSubmit() {
    if (!accountId) return;
    setSubmitting(true);
    setGeneralError(null);
    setErrors({});
    try {
      const payload = {
        accountId,
        instrument: form.instrument.toUpperCase(),
        direction: form.direction,
        date: form.date,
        time: form.time,
        session: form.session,
        timeframe: form.timeframe,
        entryPrice: num(form.entryPrice),
        stopLoss: num(form.stopLoss),
        takeProfit: num(form.takeProfit),
        exitPrice: num(form.exitPrice),
        exitTime: form.exitTime || null,
        positionSize: num(form.positionSize),
        fees: num(form.fees) ?? 0,
        mfe: num(form.mfe),
        mae: num(form.mae),
        strategyId: form.strategyId || null,
        entryReason: form.entryReason || null,
        marketCondition: form.marketCondition || null,
        trend: form.trend || null,
        marketType: form.marketType || null,
        isAPlus: form.isAPlus,
        movedSL: form.movedSL,
        tookPartial: form.tookPartial,
        partialPercent: num(form.partialPercent),
        numPartials: form.numPartials ? parseInt(form.numPartials, 10) : null,
        avgExitPrice: num(form.avgExitPrice),
        followedPlan: form.followedPlan,
        revengeTrade: form.revengeTrade,
        overtraded: form.overtraded,
        accordingToSetup: form.accordingToSetup,
        emotionBefore: form.emotionBefore || null,
        emotionAfter: form.emotionAfter || null,
        confidence: form.confidence ? parseInt(form.confidence, 10) : null,
        discipline: form.discipline ? parseInt(form.discipline, 10) : null,
        patience: form.patience ? parseInt(form.patience, 10) : null,
        stress: form.stress ? parseInt(form.stress, 10) : null,
        notesSeen: form.notesSeen || null,
        notesGood: form.notesGood || null,
        notesBad: form.notesBad || null,
        notesNext: form.notesNext || null,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        confluences: form.confluences,

        rsi15mCrossed: form.rsi15mCrossed,
        rsi15mDirection: form.rsi15mCrossed ? form.rsi15mDirection || null : null,
        rsi15mValue: form.rsi15mCrossed ? num(form.rsi15mValue) : null,
        rsi15mCrossTime: form.rsi15mCrossed ? form.rsi15mCrossTime || null : null,
        rsi15mCandlesToEntry: form.rsi15mCrossed && form.rsi15mCandlesToEntry ? parseInt(form.rsi15mCandlesToEntry, 10) : null,
        rsi5mCrossed: form.rsi5mCrossed,
        rsi5mDirection: form.rsi5mCrossed ? form.rsi5mDirection || null : null,
        rsi5mValue: form.rsi5mCrossed ? num(form.rsi5mValue) : null,
        rsi5mCrossTime: form.rsi5mCrossed ? form.rsi5mCrossTime || null : null,
        rsi5mCandlesToEntry: form.rsi5mCrossed && form.rsi5mCandlesToEntry ? parseInt(form.rsi5mCandlesToEntry, 10) : null,

        screenshots: [
          ...(form.beforeScreenshot ? [{ type: "BEFORE", url: form.beforeScreenshot }] : []),
          ...(form.afterScreenshot ? [{ type: "AFTER", url: form.afterScreenshot }] : []),
        ],
      };

      if (editingTrade) {
        await updateTrade(editingTrade.id, payload);
      } else {
        await createTrade(payload);
      }
      notifySaved();
      close();
    } catch (e) {
      if (e instanceof ApiError) {
        const details = e.details as { error?: { fieldErrors?: Record<string, string[]> } };
        setErrors(details.error?.fieldErrors ?? {});
        setGeneralError("Zkontroluj zvýrazněná pole.");
      } else {
        setGeneralError(e instanceof Error ? e.message : "Nastala chyba");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: "basic", label: "Základní" },
    { key: "params", label: "Parametry" },
    { key: "setup", label: "Setup" },
    { key: "management", label: "Management" },
    { key: "psychology", label: "Psychologie" },
    { key: "screenshots", label: "Screenshoty" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-2 sm:p-4" onClick={close}>
      <div
        className="bg-card border border-card-border rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold">{editingTrade ? "Upravit obchod" : "Nový obchod"}</h2>
          <button onClick={close} className="text-muted hover:text-foreground text-lg">
            ✕
          </button>
        </div>

        {advanced && (
          <div className="flex gap-1 px-5 pt-3 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap ${
                  tab === t.key ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-4">
          {generalError && <div className="text-sm text-red bg-red-soft rounded-lg p-3">{generalError}</div>}

          {(!advanced || tab === "basic") && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label>Instrument</label>
                <div className="flex gap-1">
                  <select value={form.instrument} onChange={(e) => set("instrument", e.target.value)} className="flex-1">
                    {instruments.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1 mt-1">
                  <input
                    placeholder="Vlastní symbol"
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value)}
                    className="text-xs flex-1"
                  />
                  <button
                    type="button"
                    className="text-xs px-2 rounded-md bg-surface-2 border border-card-border"
                    onClick={async () => {
                      if (!newInstrument.trim()) return;
                      await addInstrument(newInstrument.trim());
                      set("instrument", newInstrument.trim().toUpperCase());
                      setNewInstrument("");
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label>Směr</label>
                <div className="flex gap-1">
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set("direction", d)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${
                        form.direction === d
                          ? d === "LONG"
                            ? "bg-green-soft text-green border-green"
                            : "bg-red-soft text-red border-red"
                          : "border-card-border text-muted"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>Datum</label>
                <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div>
                <label>Čas vstupu</label>
                <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
              </div>
              <div>
                <label>Session</label>
                <select value={form.session} onChange={(e) => set("session", e.target.value)}>
                  {SESSIONS.map((s) => (
                    <option key={s} value={s}>
                      {dictionary.session[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Entry</label>
                <input type="number" step="any" value={form.entryPrice} onChange={(e) => set("entryPrice", e.target.value)} />
                {errors.entryPrice && <span className="text-xs text-red">{errors.entryPrice[0]}</span>}
              </div>
              <div>
                <label>Stop Loss</label>
                <input type="number" step="any" value={form.stopLoss} onChange={(e) => set("stopLoss", e.target.value)} />
                {errors.stopLoss && <span className="text-xs text-red">{errors.stopLoss[0]}</span>}
              </div>
              <div>
                <label>Take Profit</label>
                <input type="number" step="any" value={form.takeProfit} onChange={(e) => set("takeProfit", e.target.value)} />
              </div>
              <div>
                <label>Exit</label>
                <input type="number" step="any" value={form.exitPrice} onChange={(e) => set("exitPrice", e.target.value)} />
              </div>
              <div>
                <label>Risk %</label>
                <input
                  type="number"
                  step="any"
                  value={form.riskPercentInput}
                  onChange={(e) => set("riskPercentInput", e.target.value)}
                />
              </div>
              <div>
                <label>Position Size (skutečná)</label>
                <input type="number" step="any" value={form.positionSize} onChange={(e) => set("positionSize", e.target.value)} />
                {errors.positionSize && <span className="text-xs text-red">{errors.positionSize[0]}</span>}
              </div>

              <div className="col-span-2 sm:col-span-3 -mt-1">
                {recommended ? (
                  <div className="flex items-center justify-between gap-2 bg-surface-2 rounded-lg px-3 py-2 text-xs">
                    <div className="text-muted">
                      Doporučená (max) position size při {form.riskPercentInput}% risku:{" "}
                      <span className="font-semibold text-foreground">{recommended.maxContracts} ks</span>{" "}
                      <span className="text-muted-2">
                        (přesně {recommended.exact.toFixed(2)} ks · point value {contractSpec.pointValue}$ ·
                        skutečný risk při max {recommended.riskDollarAtMax.toFixed(2)}$ z cíle{" "}
                        {recommended.targetRiskDollar.toFixed(2)}$)
                      </span>
                    </div>
                    <button
                      type="button"
                      title="Zkopírovat doporučenou hodnotu do Position Size"
                      onClick={() => set("positionSize", String(recommended.maxContracts))}
                      className="shrink-0 text-xs px-2 py-1 rounded-md bg-accent-soft text-accent font-medium"
                    >
                      Použít →
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-2">
                    Doporučená position size se zobrazí po vyplnění Entry, Stop Loss a Risk %.
                  </div>
                )}
              </div>

              <div className="col-span-2 sm:col-span-3">
                <label>Setup</label>
                <div className="flex gap-2">
                  <select value={form.strategyId} onChange={(e) => set("strategyId", e.target.value)} className="flex-1">
                    <option value="">— vybrat —</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder="Nový setup"
                    value={newStrategyName}
                    onChange={(e) => setNewStrategyName(e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    className="text-xs px-3 rounded-md bg-surface-2 border border-card-border"
                    onClick={async () => {
                      if (!newStrategyName.trim()) return;
                      await createStrategy(newStrategyName.trim());
                      setNewStrategyName("");
                    }}
                  >
                    Vytvořit
                  </button>
                </div>
              </div>

              {preview && (
                <div className="col-span-2 sm:col-span-3 bg-surface-2 rounded-lg p-3 grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-muted">Risk $</div>
                    <div className="font-semibold">{preview.riskDollar.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted">Risk %</div>
                    <div className="font-semibold">
                      {account ? `${(calcRiskPercent(preview.riskDollar, account.startingBalance) ?? 0).toFixed(3)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Point value</div>
                    <div className="font-semibold">{contractSpec.pointValue}$</div>
                  </div>
                  <div>
                    <div className="text-muted">Potential RR</div>
                    <div className="font-semibold">{preview.potentialRR?.toFixed(2) ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted">Net PnL</div>
                    <div className={`font-semibold ${preview.netPnl && preview.netPnl > 0 ? "text-green" : preview.netPnl && preview.netPnl < 0 ? "text-red" : ""}`}>
                      {preview.netPnl !== null ? preview.netPnl.toFixed(2) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Realized RR</div>
                    <div className="font-semibold">{preview.realizedRR?.toFixed(2) ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted">Výsledek</div>
                    <div className="font-semibold">{preview.result ?? "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted">Trvání</div>
                    <div className="font-semibold">{preview.durationMinutes ?? "—"} min</div>
                  </div>
                </div>
              )}

              <div className="col-span-2 sm:col-span-3">
                <button
                  type="button"
                  onClick={() => setAdvanced((a) => !a)}
                  className="text-xs text-accent font-medium"
                >
                  {advanced ? "Skrýt pokročilé nastavení" : "+ Pokročilé nastavení"}
                </button>
              </div>
            </div>
          )}

          {advanced && tab === "params" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label>Timeframe</label>
                <select value={form.timeframe} onChange={(e) => set("timeframe", e.target.value)}>
                  {TIMEFRAMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Čas výstupu</label>
                <input type="time" value={form.exitTime} onChange={(e) => set("exitTime", e.target.value)} />
              </div>
              <div>
                <label>Fees / Commission</label>
                <input type="number" step="any" value={form.fees} onChange={(e) => set("fees", e.target.value)} />
              </div>
              <div>
                <label>MFE ($)</label>
                <input type="number" step="any" value={form.mfe} onChange={(e) => set("mfe", e.target.value)} />
              </div>
              <div>
                <label>MAE ($)</label>
                <input type="number" step="any" value={form.mae} onChange={(e) => set("mae", e.target.value)} />
              </div>
            </div>
          )}

          {advanced && tab === "setup" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label>Entry reason</label>
                <textarea rows={2} value={form.entryReason} onChange={(e) => set("entryReason", e.target.value)} className="w-full" />
              </div>
              <div className="col-span-2">
                <label>Market condition</label>
                <input value={form.marketCondition} onChange={(e) => set("marketCondition", e.target.value)} className="w-full" />
              </div>
              <div>
                <label>Trend</label>
                <select value={form.trend} onChange={(e) => set("trend", e.target.value)}>
                  <option value="">—</option>
                  {TRENDS.map((t) => (
                    <option key={t} value={t}>
                      {dictionary.trend[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Market type</label>
                <select value={form.marketType} onChange={(e) => set("marketType", e.target.value)}>
                  <option value="">—</option>
                  {MARKET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {dictionary.marketType[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" checked={form.isAPlus} onChange={(e) => set("isAPlus", e.target.checked)} id="aplus" />
                <label htmlFor="aplus" className="!mb-0">
                  A+ Setup
                </label>
              </div>
              <div className="col-span-2">
                <label>Tagy (oddělené čárkou)</label>
                <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Aplus, FOMO, London" className="w-full" />
              </div>

              <div className="col-span-2">
                <label>Konfluence</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {GENERIC_CONFLUENCE_DEFS.map((c) => {
                    const checked = form.confluences.includes(c.key);
                    return (
                      <label
                        key={c.key}
                        className={`flex items-center gap-1.5 !mb-0 rounded-lg px-2.5 py-2 text-xs border cursor-pointer ${
                          checked ? "bg-accent-soft text-accent border-accent" : "bg-surface-2 border-card-border text-muted"
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleConfluence(c.key)} className="shrink-0" />
                        <span>{c.label}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-2 mt-1">
                  Čistě analytický atribut - neovlivňuje risk, Position Size, PnL ani R:R.
                </div>
              </div>

              {/* RSI Cross konfluence - detailní data pro statistickou analýzu.
                  15M = primární potvrzení, 5M = sekundární (přesnější timing).
                  Čistě analytický atribut - neovlivňuje risk/Position Size/PnL/R:R. */}
              <div className="col-span-2 border border-accent/40 rounded-xl p-3 bg-accent-soft/20 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rsi15mCrossed"
                    checked={form.rsi15mCrossed}
                    onChange={(e) => set("rsi15mCrossed", e.target.checked)}
                  />
                  <label htmlFor="rsi15mCrossed" className="!mb-0 font-semibold text-accent text-xs">
                    RSI Cross 15M — Primární RSI potvrzení
                  </label>
                </div>
                {form.rsi15mCrossed && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-1">
                    <div>
                      <label className="text-xs">Směr</label>
                      <select value={form.rsi15mDirection} onChange={(e) => set("rsi15mDirection", e.target.value)}>
                        <option value="">—</option>
                        {RSI_DIRECTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs">RSI hodnota (0-100)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={100}
                        placeholder="např. 52.4"
                        value={form.rsi15mValue}
                        onChange={(e) => set("rsi15mValue", e.target.value)}
                      />
                      {errors.rsi15mValue && <span className="text-xs text-red">{errors.rsi15mValue[0]}</span>}
                    </div>
                    <div>
                      <label className="text-xs">Čas crossu</label>
                      <input type="time" value={form.rsi15mCrossTime} onChange={(e) => set("rsi15mCrossTime", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs">Svíček cross → entry</label>
                      <input
                        type="number"
                        min={0}
                        value={form.rsi15mCandlesToEntry}
                        onChange={(e) => set("rsi15mCandlesToEntry", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2 border border-card-border rounded-xl p-3 bg-surface-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rsi5mCrossed"
                    checked={form.rsi5mCrossed}
                    onChange={(e) => set("rsi5mCrossed", e.target.checked)}
                  />
                  <label htmlFor="rsi5mCrossed" className="!mb-0 font-semibold text-muted text-xs">
                    RSI Cross 5M — Sekundární RSI potvrzení (timing)
                  </label>
                </div>
                {form.rsi5mCrossed && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-1">
                    <div>
                      <label className="text-xs">Směr</label>
                      <select value={form.rsi5mDirection} onChange={(e) => set("rsi5mDirection", e.target.value)}>
                        <option value="">—</option>
                        {RSI_DIRECTIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs">RSI hodnota (0-100)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={100}
                        placeholder="např. 48.9"
                        value={form.rsi5mValue}
                        onChange={(e) => set("rsi5mValue", e.target.value)}
                      />
                      {errors.rsi5mValue && <span className="text-xs text-red">{errors.rsi5mValue[0]}</span>}
                    </div>
                    <div>
                      <label className="text-xs">Čas crossu</label>
                      <input type="time" value={form.rsi5mCrossTime} onChange={(e) => set("rsi5mCrossTime", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs">Svíček cross → entry</label>
                      <input
                        type="number"
                        min={0}
                        value={form.rsi5mCandlesToEntry}
                        onChange={(e) => set("rsi5mCandlesToEntry", e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {advanced && tab === "management" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ["movedSL", "Posunul jsem SL?"],
                ["tookPartial", "Vzal jsem partial profit?"],
                ["followedPlan", "Dodržel jsem plán?"],
                ["revengeTrade", "Revenge trade?"],
                ["overtraded", "Overtrading?"],
                ["accordingToSetup", "Dle setupu?"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 !mb-0 bg-surface-2 rounded-lg px-3 py-2">
                  <input
                    type="checkbox"
                    checked={form[key as keyof FormState] as boolean}
                    onChange={(e) => set(key as keyof FormState, e.target.checked as never)}
                  />
                  <span className="text-foreground text-xs">{label}</span>
                </label>
              ))}
              {form.tookPartial && (
                <>
                  <div>
                    <label>Partial %</label>
                    <input type="number" value={form.partialPercent} onChange={(e) => set("partialPercent", e.target.value)} />
                  </div>
                  <div>
                    <label>Počet partials</label>
                    <input type="number" value={form.numPartials} onChange={(e) => set("numPartials", e.target.value)} />
                  </div>
                  <div>
                    <label>Avg exit price</label>
                    <input type="number" step="any" value={form.avgExitPrice} onChange={(e) => set("avgExitPrice", e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}

          {advanced && tab === "psychology" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Emoce před obchodem</label>
                <select value={form.emotionBefore} onChange={(e) => set("emotionBefore", e.target.value)}>
                  <option value="">—</option>
                  {EMOTIONS.map((e) => (
                    <option key={e} value={e}>
                      {dictionary.emotion[e]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Emoce po obchodě</label>
                <select value={form.emotionAfter} onChange={(e) => set("emotionAfter", e.target.value)}>
                  <option value="">—</option>
                  {EMOTIONS.map((e) => (
                    <option key={e} value={e}>
                      {dictionary.emotion[e]}
                    </option>
                  ))}
                </select>
              </div>
              {[
                ["confidence", "Jistota (1-10)"],
                ["discipline", "Disciplína (1-10)"],
                ["patience", "Trpělivost (1-10)"],
                ["stress", "Stres (1-10)"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label>{label}</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form[key as keyof FormState] as string}
                    onChange={(e) => set(key as keyof FormState, e.target.value as never)}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label>Co jsem před obchodem viděl?</label>
                <textarea rows={2} className="w-full" value={form.notesSeen} onChange={(e) => set("notesSeen", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label>Co jsem udělal dobře?</label>
                <textarea rows={2} className="w-full" value={form.notesGood} onChange={(e) => set("notesGood", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label>Co jsem udělal špatně?</label>
                <textarea rows={2} className="w-full" value={form.notesBad} onChange={(e) => set("notesBad", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label>Co příště udělám jinak?</label>
                <textarea rows={2} className="w-full" value={form.notesNext} onChange={(e) => set("notesNext", e.target.value)} />
              </div>
            </div>
          )}

          {advanced && tab === "screenshots" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScreenshotUpload
                type="BEFORE"
                label="Before Trade"
                value={form.beforeScreenshot}
                onChange={(url) => set("beforeScreenshot", url)}
              />
              <ScreenshotUpload
                type="AFTER"
                label="After Trade"
                value={form.afterScreenshot}
                onChange={(url) => set("afterScreenshot", url)}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-card-border sticky bottom-0 bg-card">
          <button onClick={close} className="text-sm px-4 py-2 rounded-lg text-muted hover:text-foreground">
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="text-sm px-5 py-2 rounded-lg bg-accent text-white font-semibold disabled:opacity-50"
          >
            {submitting ? "Ukládám..." : "Uložit obchod"}
          </button>
        </div>
      </div>
    </div>
  );
}
