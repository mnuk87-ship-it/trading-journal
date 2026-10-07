// Centrální analytická vrstva.
// VŠECHNY statistiky v aplikaci (Dashboard, Analytics, Calendar, Reports...)
// musí procházet přes `filterTrades()` a tyto funkce, aby byl zajištěn
// konzistentní dataset napříč celou aplikací (viz požadavek #52).

import type { TradeDTO, TradeFilters, TradeResult } from "@/types/trade";
import { CONFLUENCE_DEFS, CONFLUENCE_KEYS, confluenceLabel, generateCombinations } from "@/lib/confluences";
import { RSI_ZONES, rsiZoneLabel, type RsiZone } from "@/lib/rsi";

export function filterTrades(trades: TradeDTO[], filters: TradeFilters = {}): TradeDTO[] {
  return trades.filter((t) => {
    if (filters.from && t.date < filters.from) return false;
    if (filters.to && t.date > filters.to) return false;
    if (filters.instrument?.length && !filters.instrument.includes(t.instrument)) return false;
    if (filters.direction?.length && !filters.direction.includes(t.direction)) return false;
    if (filters.session?.length && !filters.session.includes(t.session)) return false;
    if (filters.strategyId?.length && !filters.strategyId.includes(t.strategyId ?? "")) return false;
    if (filters.result?.length && !filters.result.includes((t.result ?? "BE") as TradeResult)) return false;
    if (filters.timeframe?.length && !filters.timeframe.includes(t.timeframe)) return false;
    if (filters.isAPlus !== undefined && t.isAPlus !== filters.isAPlus) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const hay = [
        t.id,
        t.instrument,
        t.strategy?.name ?? "",
        t.notesSeen ?? "",
        t.notesGood ?? "",
        t.notesBad ?? "",
        t.notesNext ?? "",
        t.date,
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

const closed = (trades: TradeDTO[]) => trades.filter((t) => t.netPnl !== null && t.result !== null);
const wins = (trades: TradeDTO[]) => closed(trades).filter((t) => t.result === "WIN");
const losses = (trades: TradeDTO[]) => closed(trades).filter((t) => t.result === "LOSS");
const bes = (trades: TradeDTO[]) => closed(trades).filter((t) => t.result === "BE");

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
const median = (arr: number[]) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export function getWinRate(trades: TradeDTO[]) {
  const c = closed(trades);
  if (!c.length) return 0;
  return (wins(trades).length / c.length) * 100;
}

export function getLossRate(trades: TradeDTO[]) {
  const c = closed(trades);
  if (!c.length) return 0;
  return (losses(trades).length / c.length) * 100;
}

export function getBreakevenRate(trades: TradeDTO[]) {
  const c = closed(trades);
  if (!c.length) return 0;
  return (bes(trades).length / c.length) * 100;
}

export function getGrossProfit(trades: TradeDTO[]) {
  return sum(wins(trades).map((t) => t.netPnl!));
}

export function getGrossLoss(trades: TradeDTO[]) {
  return Math.abs(sum(losses(trades).map((t) => t.netPnl!)));
}

export function getProfitFactor(trades: TradeDTO[]) {
  const gp = getGrossProfit(trades);
  const gl = getGrossLoss(trades);
  if (gl === 0) return gp > 0 ? Infinity : 0;
  return gp / gl;
}

export function getAverageWin(trades: TradeDTO[]) {
  return avg(wins(trades).map((t) => t.netPnl!));
}

export function getAverageLoss(trades: TradeDTO[]) {
  return avg(losses(trades).map((t) => t.netPnl!)); // negativní číslo
}

export function getPayoffRatio(trades: TradeDTO[]) {
  const avgLoss = Math.abs(getAverageLoss(trades));
  if (avgLoss === 0) return 0;
  return getAverageWin(trades) / avgLoss;
}

export function getExpectancy(trades: TradeDTO[]) {
  const c = closed(trades);
  if (!c.length) return { dollar: 0, r: 0, percent: 0 };
  const winRate = wins(trades).length / c.length;
  const lossRate = losses(trades).length / c.length;
  const dollar = winRate * getAverageWin(trades) + lossRate * getAverageLoss(trades);
  const rr = c.map((t) => t.realizedRR ?? 0);
  const r = avg(rr);
  const avgRisk = avg(c.map((t) => t.riskDollar ?? 0).filter((x) => x > 0));
  const percent = avgRisk ? (dollar / avgRisk) * 100 : 0;
  return { dollar, r, percent };
}

export function getAverageRR(trades: TradeDTO[]) {
  const vals = closed(trades)
    .map((t) => t.realizedRR)
    .filter((v): v is number => v !== null && v !== undefined);
  return avg(vals);
}

export function getMedianRR(trades: TradeDTO[]) {
  const vals = closed(trades)
    .map((t) => t.realizedRR)
    .filter((v): v is number => v !== null && v !== undefined);
  return median(vals);
}

export function getMaxRR(trades: TradeDTO[]) {
  const vals = closed(trades)
    .map((t) => t.realizedRR)
    .filter((v): v is number => v !== null && v !== undefined);
  return vals.length ? Math.max(...vals) : 0;
}

export function getIdealRRStats(trades: TradeDTO[]) {
  const c = closed(trades).filter((t) => t.idealRR !== null && t.idealRR !== undefined);
  const ideal = c.map((t) => t.idealRR as number);
  const realized = c.map((t) => t.realizedRR ?? 0);
  return {
    avgIdealRR: avg(ideal),
    maxIdealRR: ideal.length ? Math.max(...ideal) : 0,
    avgRealizedRR: avg(realized),
    series: c.map((t) => ({ date: t.date, id: t.id, ideal: t.idealRR as number, realized: t.realizedRR ?? 0 })),
  };
}

export function getBestTrade(trades: TradeDTO[]) {
  const c = closed(trades);
  if (!c.length) return null;
  return c.reduce((best, t) => ((t.netPnl ?? 0) > (best.netPnl ?? 0) ? t : best), c[0]);
}

export function getWorstTrade(trades: TradeDTO[]) {
  const c = closed(trades);
  if (!c.length) return null;
  return c.reduce((worst, t) => ((t.netPnl ?? 0) < (worst.netPnl ?? 0) ? t : worst), c[0]);
}

export function getTotalPnl(trades: TradeDTO[]) {
  return sum(closed(trades).map((t) => t.netPnl!));
}

/** Řetězec výsledků v chronologickém pořadí - základ pro streaky a equity curve. */
function chronological(trades: TradeDTO[]) {
  return [...closed(trades)].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

export interface StreakStats {
  currentWinStreak: number;
  currentLossStreak: number;
  maxWinStreak: number;
  maxLossStreak: number;
  avgWinStreak: number;
  avgLossStreak: number;
}

export function getStreaks(trades: TradeDTO[]): StreakStats {
  const chron = chronological(trades);
  let maxWin = 0;
  let maxLoss = 0;
  let curWin = 0;
  let curLoss = 0;
  const winStreaks: number[] = [];
  const lossStreaks: number[] = [];

  for (const t of chron) {
    if (t.result === "WIN") {
      curWin += 1;
      if (curLoss > 0) lossStreaks.push(curLoss);
      curLoss = 0;
      maxWin = Math.max(maxWin, curWin);
    } else if (t.result === "LOSS") {
      curLoss += 1;
      if (curWin > 0) winStreaks.push(curWin);
      curWin = 0;
      maxLoss = Math.max(maxLoss, curLoss);
    } else {
      // BE obchod přeruší obě série
      if (curWin > 0) winStreaks.push(curWin);
      if (curLoss > 0) lossStreaks.push(curLoss);
      curWin = 0;
      curLoss = 0;
    }
  }
  if (curWin > 0) winStreaks.push(curWin);
  if (curLoss > 0) lossStreaks.push(curLoss);

  return {
    currentWinStreak: curWin,
    currentLossStreak: curLoss,
    maxWinStreak: maxWin,
    maxLossStreak: maxLoss,
    avgWinStreak: avg(winStreaks),
    avgLossStreak: avg(lossStreaks),
  };
}

export interface EquityPoint {
  date: string;
  pnl: number;
  cumulativePnl: number;
  balance: number;
  pnlPercent: number;
  drawdown: number; // v $, 0 nebo záporné
  drawdownPercent: number;
  tradeCount: number;
}

export function getEquityCurve(trades: TradeDTO[], startingBalance: number): EquityPoint[] {
  const chron = chronological(trades);
  let cumulative = 0;
  let peak = startingBalance;
  const points: EquityPoint[] = [];
  const byDate = new Map<string, TradeDTO[]>();
  for (const t of chron) {
    const arr = byDate.get(t.date) ?? [];
    arr.push(t);
    byDate.set(t.date, arr);
  }
  for (const [date, dayTrades] of byDate) {
    const dayPnl = sum(dayTrades.map((t) => t.netPnl!));
    cumulative += dayPnl;
    const balance = startingBalance + cumulative;
    peak = Math.max(peak, balance);
    const drawdown = balance - peak;
    points.push({
      date,
      pnl: dayPnl,
      cumulativePnl: cumulative,
      balance,
      pnlPercent: startingBalance ? (cumulative / startingBalance) * 100 : 0,
      drawdown,
      drawdownPercent: peak ? (drawdown / peak) * 100 : 0,
      tradeCount: dayTrades.length,
    });
  }
  return points;
}

export interface DrawdownStats {
  current: number;
  currentPercent: number;
  max: number;
  maxPercent: number;
  longestDays: number;
  averageDays: number;
  recoveryDays: number | null;
}

export function getDrawdownStats(trades: TradeDTO[], startingBalance: number): DrawdownStats {
  const curve = getEquityCurve(trades, startingBalance);
  if (!curve.length) {
    return { current: 0, currentPercent: 0, max: 0, maxPercent: 0, longestDays: 0, averageDays: 0, recoveryDays: null };
  }
  let maxDd = 0;
  let maxDdPercent = 0;
  let peak = startingBalance;
  let peakIdx = 0;
  let inDrawdown = false;
  let ddStart = 0;
  const durations: number[] = [];
  let longest = 0;
  let recoveryDays: number | null = null;

  curve.forEach((p, i) => {
    if (p.balance >= peak) {
      if (inDrawdown) {
        durations.push(i - ddStart);
        if (recoveryDays === null) recoveryDays = i - ddStart;
      }
      peak = p.balance;
      peakIdx = i;
      inDrawdown = false;
    } else {
      if (!inDrawdown) {
        ddStart = peakIdx;
        inDrawdown = true;
      }
      longest = Math.max(longest, i - ddStart);
    }
    maxDd = Math.min(maxDd, p.drawdown);
    maxDdPercent = Math.min(maxDdPercent, p.drawdownPercent);
  });

  const last = curve[curve.length - 1];
  return {
    current: last.drawdown,
    currentPercent: last.drawdownPercent,
    max: maxDd,
    maxPercent: maxDdPercent,
    longestDays: longest,
    averageDays: avg(durations),
    recoveryDays,
  };
}

export function getFrequency(trades: TradeDTO[]) {
  const c = closed(trades);
  if (!c.length) return { perDay: 0, perWeek: 0, perMonth: 0 };
  const dates = c.map((t) => t.date).sort();
  const first = new Date(dates[0]);
  const last = new Date(dates[dates.length - 1]);
  const days = Math.max(1, Math.round((last.getTime() - first.getTime()) / 86400000) + 1);
  return {
    perDay: c.length / days,
    perWeek: (c.length / days) * 7,
    perMonth: (c.length / days) * 30,
  };
}

export function getDurationStats(trades: TradeDTO[]) {
  const withDuration = closed(trades).filter((t) => t.durationMinutes !== null);
  const all = withDuration.map((t) => t.durationMinutes as number);
  const win = withDuration.filter((t) => t.result === "WIN").map((t) => t.durationMinutes as number);
  const loss = withDuration.filter((t) => t.result === "LOSS").map((t) => t.durationMinutes as number);
  return {
    average: avg(all),
    averageWin: avg(win),
    averageLoss: avg(loss),
    shortest: all.length ? Math.min(...all) : 0,
    longest: all.length ? Math.max(...all) : 0,
  };
}

interface GroupStats {
  key: string;
  trades: number;
  wins: number;
  losses: number;
  be: number;
  winRate: number;
  pnl: number;
  averageRR: number;
  profitFactor: number;
  expectancy: number;
  averageDuration: number;
}

function buildGroupStats(key: string, group: TradeDTO[]): GroupStats {
  return {
    key,
    trades: group.length,
    wins: wins(group).length,
    losses: losses(group).length,
    be: bes(group).length,
    winRate: getWinRate(group),
    pnl: getTotalPnl(group),
    averageRR: getAverageRR(group),
    profitFactor: getProfitFactor(group),
    expectancy: getExpectancy(group).dollar,
    averageDuration: getDurationStats(group).average,
  };
}

function groupBy(trades: TradeDTO[], keyFn: (t: TradeDTO) => string): Map<string, TradeDTO[]> {
  const m = new Map<string, TradeDTO[]>();
  for (const t of trades) {
    const k = keyFn(t);
    const arr = m.get(k) ?? [];
    arr.push(t);
    m.set(k, arr);
  }
  return m;
}

export function getBySession(trades: TradeDTO[]): GroupStats[] {
  const sessions = ["Asia", "London", "New York", "Other"];
  const grouped = groupBy(trades, (t) => t.session);
  return sessions.map((s) => buildGroupStats(s, grouped.get(s) ?? []));
}

export function getByDirection(trades: TradeDTO[]) {
  const grouped = groupBy(trades, (t) => t.direction);
  return {
    LONG: buildGroupStats("LONG", grouped.get("LONG") ?? []),
    SHORT: buildGroupStats("SHORT", grouped.get("SHORT") ?? []),
  };
}

const DAY_NAMES = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];

export function getByDayOfWeek(trades: TradeDTO[]): GroupStats[] {
  const order = [1, 2, 3, 4, 5, 6, 0]; // Po-Ne
  const grouped = groupBy(trades, (t) => String(new Date(t.date).getDay()));
  return order.map((d) => buildGroupStats(DAY_NAMES[d], grouped.get(String(d)) ?? []));
}

export function getByHour(trades: TradeDTO[]): GroupStats[] {
  const grouped = groupBy(trades, (t) => (t.time ? t.time.split(":")[0] : "??"));
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  return hours
    .map((h) => buildGroupStats(`${h}:00`, grouped.get(h) ?? []))
    .filter((g) => g.trades > 0);
}

export function getByStrategy(trades: TradeDTO[]): GroupStats[] {
  const grouped = groupBy(trades, (t) => t.strategy?.name ?? "Bez setupu");
  return Array.from(grouped.entries())
    .map(([key, group]) => buildGroupStats(key, group))
    .sort((a, b) => b.trades - a.trades);
}

function isoWeek(dateStr: string) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function getByWeek(trades: TradeDTO[], startingBalance: number) {
  const grouped = groupBy(trades, (t) => isoWeek(t.date));
  return Array.from(grouped.entries())
    .map(([key, group]) => {
      const stats = buildGroupStats(key, group);
      return {
        ...stats,
        returnPercent: startingBalance ? (stats.pnl / startingBalance) * 100 : 0,
        maxDrawdown: getDrawdownStats(group, startingBalance).max,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function getByMonth(trades: TradeDTO[], startingBalance: number) {
  const grouped = groupBy(trades, (t) => t.date.slice(0, 7));
  return Array.from(grouped.entries())
    .map(([key, group]) => {
      const stats = buildGroupStats(key, group);
      return {
        ...stats,
        returnPercent: startingBalance ? (stats.pnl / startingBalance) * 100 : 0,
        profitFactor: getProfitFactor(group),
        maxDrawdown: getDrawdownStats(group, startingBalance).max,
      };
    })
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function getWinnersLosersCards(trades: TradeDTO[]) {
  const w = wins(trades);
  const l = losses(trades);
  const streaks = getStreaks(trades);
  const durW = avg(w.filter((t) => t.durationMinutes !== null).map((t) => t.durationMinutes as number));
  const durL = avg(l.filter((t) => t.durationMinutes !== null).map((t) => t.durationMinutes as number));
  return {
    winners: {
      total: w.length,
      best: w.length ? Math.max(...w.map((t) => t.netPnl!)) : 0,
      average: getAverageWin(trades),
      averageDuration: durW,
      maxConsecutive: streaks.maxWinStreak,
      avgConsecutive: streaks.avgWinStreak,
    },
    losers: {
      total: l.length,
      worst: l.length ? Math.min(...l.map((t) => t.netPnl!)) : 0,
      average: getAverageLoss(trades),
      averageDuration: durL,
      maxConsecutive: streaks.maxLossStreak,
      avgConsecutive: streaks.avgLossStreak,
    },
  };
}

export function getRiskStats(trades: TradeDTO[]) {
  const c = closed(trades);
  const riskPct = c.map((t) => t.riskPercent).filter((v): v is number => v !== null && v !== undefined);
  const riskDollar = c.map((t) => t.riskDollar).filter((v): v is number => v !== null && v !== undefined);
  return {
    averageRiskPercent: avg(riskPct),
    averageRiskDollar: avg(riskDollar),
    largestRisk: riskDollar.length ? Math.max(...riskDollar) : 0,
    distribution: riskPct,
  };
}

export interface PsychologyGroupStats extends GroupStats {}

export function getPsychologyStats(trades: TradeDTO[]) {
  const c = closed(trades);
  const byFlag = (pred: (t: TradeDTO) => boolean, label: string) =>
    buildGroupStats(label, c.filter(pred));

  return {
    fomo: byFlag((t) => t.emotionBefore === "FOMO" || t.emotionAfter === "FOMO", "FOMO"),
    revenge: byFlag((t) => t.revengeTrade, "Revenge trading"),
    overtraded: byFlag((t) => t.overtraded, "Overtrading"),
    lowConfidence: byFlag((t) => (t.confidence ?? 5) <= 4, "Nízká jistota"),
    highConfidence: byFlag((t) => (t.confidence ?? 0) >= 8, "Vysoká jistota"),
    followedPlan: byFlag((t) => t.followedPlan, "Dle plánu"),
    brokePlan: byFlag((t) => !t.followedPlan, "Mimo plán"),
  };
}

export function getAPlusStats(trades: TradeDTO[]) {
  const c = closed(trades);
  const aplus = buildGroupStats("A+", c.filter((t) => t.isAPlus));
  const nonAplus = buildGroupStats("Non A+", c.filter((t) => !t.isAPlus));
  return { aplus, nonAplus };
}

export interface CalendarDay {
  date: string;
  pnl: number;
  trades: number;
  winRate: number;
  returnPercent: number;
}

export function getCalendarData(trades: TradeDTO[], startingBalance: number): CalendarDay[] {
  const grouped = groupBy(closed(trades), (t) => t.date);
  return Array.from(grouped.entries()).map(([date, group]) => ({
    date,
    pnl: getTotalPnl(group),
    trades: group.length,
    winRate: getWinRate(group),
    returnPercent: startingBalance ? (getTotalPnl(group) / startingBalance) * 100 : 0,
  }));
}

// --- Konfluence ---------------------------------------------------------
// Konfluence (FVG, BPR, OB, RSI Cross 15M/5M/1H, HVN, POC) jsou čistě
// analytický atribut obchodu uložený na `TradeDTO.confluences` (pole klíčů
// konfluencí, které u daného obchodu platily = "ano"). Nikdy neovlivňují
// risk/Position Size/PnL/R:R výpočty (ty žijí výhradně v calculations.ts) -
// tahle sekce pouze čte už hotová pole (netPnl, realizedRR, result), stejně
// jako zbytek analytics.ts.

export interface ConfluenceStats {
  key: string;
  label: string;
  trades: number;
  wins: number;
  losses: number;
  be: number;
  winRate: number;
  pnl: number;
  averageR: number;
  totalR: number;
  expectancy: number;
  profitFactor: number;
}

function buildConfluenceStats(key: string, label: string, group: TradeDTO[]): ConfluenceStats {
  const c = closed(group);
  const rr = c.map((t) => t.realizedRR ?? 0);
  return {
    key,
    label,
    trades: group.length,
    wins: wins(group).length,
    losses: losses(group).length,
    be: bes(group).length,
    winRate: getWinRate(group),
    pnl: getTotalPnl(group),
    averageR: avg(rr),
    totalR: sum(rr),
    expectancy: getExpectancy(group).dollar,
    profitFactor: getProfitFactor(group),
  };
}

/** Statistiky pro každou z 8 jednotlivých konfluencí (vždy všech 8, i s 0 obchody). */
export function getConfluenceStats(trades: TradeDTO[]): ConfluenceStats[] {
  return CONFLUENCE_DEFS.map((def) =>
    buildConfluenceStats(
      def.key,
      def.label,
      trades.filter((t) => t.confluences.includes(def.key))
    )
  );
}

export interface ConfluenceComboStats extends ConfluenceStats {
  keys: string[];
}

/**
 * Statistiky pro všechny kombinace (podmnožiny o velikosti >= 2) z 8 konfluencí,
 * které se v datech reálně vyskytují s dostatečným vzorkem ("at least" match -
 * obchod musí mít VŠECHNY konfluence z kombinace, může mít i další navíc).
 * `minSampleSize` (default 20) odfiltruje kombinace se statisticky
 * nevýznamným počtem obchodů - výsledek je seřazený podle Expectancy sestupně.
 */
export function getConfluenceComboStats(trades: TradeDTO[], minSampleSize = 20): ConfluenceComboStats[] {
  const combos = generateCombinations(CONFLUENCE_KEYS, 2);
  const result: ConfluenceComboStats[] = [];
  for (const combo of combos) {
    const group = trades.filter((t) => combo.every((k) => t.confluences.includes(k)));
    if (group.length < minSampleSize) continue;
    const label = combo.map(confluenceLabel).join(" + ");
    result.push({ ...buildConfluenceStats(combo.join("+"), label, group), keys: combo });
  }
  return result.sort((a, b) => b.expectancy - a.expectancy);
}

// --- RSI Cross konfluence (detailní, číselná data) --------------------
// Stejná filozofie jako obecné konfluence výše: čistě analytický atribut,
// čte už hotová pole (netPnl, realizedRR, result, rsi*Value/Zone/Crossed)
// z TradeDTO. Starší obchody bez RSI dat mají rsi*Crossed=false a
// rsi*Value=null, takže je automaticky vynechají (žádný crash, žádné 0 jako
// fakt hodnotu RSI).

export interface RsiTimeframeStats {
  trades: number;
  wins: number;
  losses: number;
  be: number;
  winRate: number;
  pnl: number;
  averageRR: number;
  totalR: number;
  expectancy: number;
  profitFactor: number;
  /** true pokud je vzorek menší než minSampleSize - UI by mělo zobrazit "Insufficient data" místo závěrů. */
  insufficientData: boolean;
}

function buildRsiTimeframeStats(group: TradeDTO[], minSampleSize: number): RsiTimeframeStats {
  const c = closed(group);
  const rr = c.map((t) => t.realizedRR ?? 0);
  return {
    trades: group.length,
    wins: wins(group).length,
    losses: losses(group).length,
    be: bes(group).length,
    winRate: getWinRate(group),
    pnl: getTotalPnl(group),
    averageRR: avg(rr),
    totalR: sum(rr),
    expectancy: getExpectancy(group).dollar,
    profitFactor: getProfitFactor(group),
    insufficientData: group.length < minSampleSize,
  };
}

export interface RsiZoneRow extends RsiTimeframeStats {
  zone: RsiZone;
  zoneLabel: string;
}

function getRsiZoneBreakdown(trades: TradeDTO[], timeframe: "15m" | "5m", minSampleSize: number): RsiZoneRow[] {
  const zoneOf = (t: TradeDTO) => (timeframe === "15m" ? t.rsi15mZone : t.rsi5mZone);
  return RSI_ZONES.map((zone) => ({
    zone,
    zoneLabel: rsiZoneLabel(zone),
    ...buildRsiTimeframeStats(trades.filter((t) => zoneOf(t) === zone), minSampleSize),
  }));
}

export interface RsiValueDistribution {
  count: number;
  average: number | null;
  median: number | null;
  min: number | null;
  max: number | null;
}

function rsiValueDistribution(values: number[]): RsiValueDistribution {
  if (!values.length) return { count: 0, average: null, median: null, min: null, max: null };
  return {
    count: values.length,
    average: avg(values),
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export interface RsiValueAnalysis {
  winners: RsiValueDistribution;
  losers: RsiValueDistribution;
}

/**
 * "Jakou RSI hodnotu mám nejčastěji na vítězných vs ztrátových obchodech?"
 * Počítá se jen z obchodů, kde daný cross skutečně nastal a má uloženou
 * číselnou hodnotu (starší obchody bez RSI dat se automaticky vynechají).
 */
function getRsiValueAnalysis(trades: TradeDTO[], timeframe: "15m" | "5m"): RsiValueAnalysis {
  const valueOf = (t: TradeDTO) => (timeframe === "15m" ? t.rsi15mValue : t.rsi5mValue);
  const crossedOf = (t: TradeDTO) => (timeframe === "15m" ? t.rsi15mCrossed : t.rsi5mCrossed);
  const c = closed(trades).filter((t) => crossedOf(t) && valueOf(t) !== null);
  const winnerVals = c.filter((t) => t.result === "WIN").map((t) => valueOf(t) as number);
  const loserVals = c.filter((t) => t.result === "LOSS").map((t) => valueOf(t) as number);
  return { winners: rsiValueDistribution(winnerVals), losers: rsiValueDistribution(loserVals) };
}

export interface RsiComboStats extends RsiTimeframeStats {
  combo: "15M" | "15M+5M" | "5M";
  label: string;
}

/** 15M-only / 15M+5M společně / 5M-only - viz požadavek na kombinační statistiky. */
function getRsiComboStats(trades: TradeDTO[], minSampleSize: number): RsiComboStats[] {
  const defs: { combo: RsiComboStats["combo"]; label: string; pred: (t: TradeDTO) => boolean }[] = [
    { combo: "15M", label: "Pouze 15M RSI Cross", pred: (t) => t.rsi15mCrossed && !t.rsi5mCrossed },
    { combo: "15M+5M", label: "15M + 5M RSI Cross", pred: (t) => t.rsi15mCrossed && t.rsi5mCrossed },
    { combo: "5M", label: "Pouze 5M RSI Cross", pred: (t) => !t.rsi15mCrossed && t.rsi5mCrossed },
  ];
  return defs.map((d) => ({
    combo: d.combo,
    label: d.label,
    ...buildRsiTimeframeStats(trades.filter(d.pred), minSampleSize),
  }));
}

export interface RsiAnalytics {
  timeframe15m: {
    label: string;
    overall: RsiTimeframeStats;
    zones: RsiZoneRow[];
    valueAnalysis: RsiValueAnalysis;
  };
  timeframe5m: {
    label: string;
    overall: RsiTimeframeStats;
    zones: RsiZoneRow[];
    valueAnalysis: RsiValueAnalysis;
  };
  combos: RsiComboStats[];
  minSampleSize: number;
}

/** Souhrnný RSI Cross konfluence bundle - 15M (primární), 5M (sekundární), kombinace a RSI value analýza. */
export function getRsiAnalytics(trades: TradeDTO[], minSampleSize = 10): RsiAnalytics {
  return {
    timeframe15m: {
      label: "RSI Cross 15M (primární)",
      overall: buildRsiTimeframeStats(trades.filter((t) => t.rsi15mCrossed), minSampleSize),
      zones: getRsiZoneBreakdown(trades, "15m", minSampleSize),
      valueAnalysis: getRsiValueAnalysis(trades, "15m"),
    },
    timeframe5m: {
      label: "RSI Cross 5M (sekundární)",
      overall: buildRsiTimeframeStats(trades.filter((t) => t.rsi5mCrossed), minSampleSize),
      zones: getRsiZoneBreakdown(trades, "5m", minSampleSize),
      valueAnalysis: getRsiValueAnalysis(trades, "5m"),
    },
    combos: getRsiComboStats(trades, minSampleSize),
    minSampleSize,
  };
}

/** Jeden souhrnný bundle pro Dashboard / Analytics - počítá se jen jednou nad filtrovanými daty. */
export function getFullAnalytics(
  trades: TradeDTO[],
  startingBalance: number,
  minConfluenceSampleSize = 20,
  minRsiSampleSize = 10
) {
  const c = closed(trades);
  return {
    totals: {
      totalTrades: c.length,
      winningTrades: wins(trades).length,
      losingTrades: losses(trades).length,
      breakevenTrades: bes(trades).length,
      winRate: getWinRate(trades),
      lossRate: getLossRate(trades),
      breakevenRate: getBreakevenRate(trades),
      totalPnl: getTotalPnl(trades),
      totalReturnPercent: startingBalance ? (getTotalPnl(trades) / startingBalance) * 100 : 0,
    },
    rr: {
      averageRR: getAverageRR(trades),
      medianRR: getMedianRR(trades),
      maxRR: getMaxRR(trades),
      averageWin: getAverageWin(trades),
      averageLoss: getAverageLoss(trades),
      largestWin: getBestTrade(trades)?.netPnl ?? 0,
      largestLoss: getWorstTrade(trades)?.netPnl ?? 0,
      profitFactor: getProfitFactor(trades),
      expectancy: getExpectancy(trades),
      payoffRatio: getPayoffRatio(trades),
      grossProfit: getGrossProfit(trades),
      grossLoss: getGrossLoss(trades),
    },
    streaks: getStreaks(trades),
    frequency: getFrequency(trades),
    duration: getDurationStats(trades),
    drawdown: getDrawdownStats(trades, startingBalance),
    equityCurve: getEquityCurve(trades, startingBalance),
    bySession: getBySession(trades),
    byDirection: getByDirection(trades),
    byDayOfWeek: getByDayOfWeek(trades),
    byHour: getByHour(trades),
    byStrategy: getByStrategy(trades),
    byWeek: getByWeek(trades, startingBalance),
    byMonth: getByMonth(trades, startingBalance),
    winnersLosers: getWinnersLosersCards(trades),
    idealRR: getIdealRRStats(trades),
    risk: getRiskStats(trades),
    psychology: getPsychologyStats(trades),
    aPlus: getAPlusStats(trades),
    calendar: getCalendarData(trades, startingBalance),
    bestTrade: getBestTrade(trades),
    worstTrade: getWorstTrade(trades),
    confluences: {
      individual: getConfluenceStats(trades),
      combos: getConfluenceComboStats(trades, minConfluenceSampleSize),
      minSampleSize: minConfluenceSampleSize,
    },
    rsi: getRsiAnalytics(trades, minRsiSampleSize),
  };
}

export type FullAnalytics = ReturnType<typeof getFullAnalytics>;
