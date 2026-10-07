// Centrální doménové typy pro Trading Journal.
// Architektura je připravena na i18n - labely jsou oddělené od hodnot (kódy).

import type { RsiDirection, RsiZone } from "@/lib/rsi";

export type Direction = "LONG" | "SHORT";

export type Session = "Asia" | "London" | "New York" | "Other";

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "Daily";

export type Trend = "Bullish" | "Bearish" | "Neutral";

export type MarketType = "Trend" | "Range" | "Choppy";

export type Emotion =
  | "Calm"
  | "Confident"
  | "Fear"
  | "FOMO"
  | "Greedy"
  | "Angry"
  | "Revenge"
  | "Uncertain";

export type TradeResult = "WIN" | "LOSS" | "BE";

export type ScreenshotType = "BEFORE" | "AFTER";

export const DIRECTIONS: Direction[] = ["LONG", "SHORT"];
export const SESSIONS: Session[] = ["Asia", "London", "New York", "Other"];
export const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "Daily"];
export const TRENDS: Trend[] = ["Bullish", "Bearish", "Neutral"];
export const MARKET_TYPES: MarketType[] = ["Trend", "Range", "Choppy"];
export const EMOTIONS: Emotion[] = [
  "Calm",
  "Confident",
  "Fear",
  "FOMO",
  "Greedy",
  "Angry",
  "Revenge",
  "Uncertain",
];
export const DEFAULT_INSTRUMENTS = [
  "NQ",
  "MNQ",
  "ES",
  "MES",
  "XAUUSD",
  "EURUSD",
  "US30",
  "BTCUSD",
];

export interface ScreenshotDTO {
  id: string;
  type: ScreenshotType;
  url: string;
}

export interface TagDTO {
  id: string;
  name: string;
}

export interface StrategyDTO {
  id: string;
  name: string;
  description?: string | null;
  isCustom: boolean;
}

export interface TradeDTO {
  id: string;
  accountId: string;
  instrument: string;
  direction: Direction;
  date: string; // ISO yyyy-MM-dd
  time: string;
  session: Session;
  timeframe: Timeframe;

  entryPrice: number;
  stopLoss: number;
  takeProfit: number | null;
  exitPrice: number | null;
  exitTime: string | null;
  positionSize: number;
  riskPercent: number | null;
  riskDollar: number | null;
  initialRiskDollar: number | null;
  potentialProfitDollar: number | null;
  potentialRR: number | null;
  realizedPnl: number | null;
  realizedRR: number | null;
  fees: number;
  netPnl: number | null;

  mfe: number | null;
  mae: number | null;
  idealRR: number | null;

  strategyId: string | null;
  strategy?: StrategyDTO | null;
  entryReason: string | null;
  marketCondition: string | null;
  trend: Trend | null;
  marketType: MarketType | null;
  isAPlus: boolean;

  movedSL: boolean;
  tookPartial: boolean;
  partialPercent: number | null;
  numPartials: number | null;
  avgExitPrice: number | null;
  followedPlan: boolean;
  revengeTrade: boolean;
  overtraded: boolean;
  accordingToSetup: boolean;

  emotionBefore: Emotion | null;
  emotionAfter: Emotion | null;
  confidence: number | null;
  discipline: number | null;
  patience: number | null;
  stress: number | null;
  notesSeen: string | null;
  notesGood: string | null;
  notesBad: string | null;
  notesNext: string | null;

  result: TradeResult | null;
  durationMinutes: number | null;

  // --- RSI Cross konfluence (detailní, číselná data) ---
  // Čistě analytický atribut - nikdy neovlivňuje risk/Position Size/PnL/R:R.
  // `rsi*Zone` je vždy server-computed z `rsi*Value` (src/lib/rsi.ts).
  rsi15mCrossed: boolean;
  rsi15mDirection: RsiDirection | null;
  rsi15mValue: number | null;
  rsi15mZone: RsiZone | null;
  rsi15mCrossTime: string | null;
  rsi15mCandlesToEntry: number | null;

  rsi5mCrossed: boolean;
  rsi5mDirection: RsiDirection | null;
  rsi5mValue: number | null;
  rsi5mZone: RsiZone | null;
  rsi5mCrossTime: string | null;
  rsi5mCandlesToEntry: number | null;

  screenshots: ScreenshotDTO[];
  tags: TagDTO[];
  /** Klíče konfluencí (FVG, BPR, OB, RSI_15M, RSI_5M, RSI_1H, HVN, POC), které platily pro tento obchod.
   *  Čistě analytický atribut - nikdy neovlivňuje risk/Position Size/PnL/R:R. */
  confluences: string[];

  createdAt: string;
  updatedAt: string;
}

export interface TradeFilters {
  accountId?: string;
  from?: string;
  to?: string;
  instrument?: string[];
  direction?: Direction[];
  session?: Session[];
  strategyId?: string[];
  result?: TradeResult[];
  timeframe?: Timeframe[];
  isAPlus?: boolean;
  search?: string;

  // --- RSI filtry ---
  rsi15mCrossed?: boolean;
  rsi5mCrossed?: boolean;
  rsi15mDirection?: RsiDirection[];
  rsi5mDirection?: RsiDirection[];
  rsi15mZone?: RsiZone[];
  rsi5mZone?: RsiZone[];
  rsi15mValueMin?: number;
  rsi15mValueMax?: number;
  rsi5mValueMin?: number;
  rsi5mValueMax?: number;
  /** "15M" (jen 15M cross), "15M+5M" (oba), "5M" (jen 5M cross) */
  rsiCombo?: ("15M" | "15M+5M" | "5M")[];
}
