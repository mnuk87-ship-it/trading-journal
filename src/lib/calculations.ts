// Čisté výpočetní funkce pro obchody - žádné side-effecty, snadno testovatelné.
// Toto je jediné místo, kde se počítá risk/RR/PnL, aby všechny statistiky
// v aplikaci byly vždy konzistentní (viz požadavek na centrální analytickou vrstvu).
//
// DŮLEŽITÉ (futures): 1 bod pohybu ceny NENÍ u futures univerzálně $1 - záleží
// na kontraktu (point value = tick value / tick size). Proto se risk/PnL/RR
// NIKDY nepočítá jen jako `cenový rozdíl × position size`, ale vždy přes
// `getPointValue(instrument)`, který vrátí správný multiplikátor pro daný
// symbol (viz src/lib/contractSpecs.ts). U instrumentů, které nejsou futures
// (akcie, forex, krypto...), je point value 1, takže výpočet odpovídá
// původnímu/očekávanému chování (cenový rozdíl × position size).

import type { Direction } from "@/types/trade";
import { getPointValue } from "@/lib/contractSpecs";

export interface TradeCalcInput {
  instrument: string;
  direction: Direction;
  entryPrice: number;
  stopLoss: number;
  takeProfit?: number | null;
  exitPrice?: number | null;
  /** Skutečný (ACTUAL) počet kontraktů/jednotek, se kterými se obchod reálně
   * obchodoval. Zadává uživatel ručně - aplikace tuto hodnotu NIKDY
   * nepřepočítává ani nepřepisuje, pouze z ní odvozuje risk/PnL/RR. */
  positionSize: number;
  fees?: number | null;
  mfe?: number | null; // v $ (absolutní, kladné číslo)
  mae?: number | null;
  time?: string | null;
  exitTime?: string | null;
  breakevenThresholdR?: number; // v R, default 0
}

export interface TradeCalcResult {
  riskDollar: number;
  initialRiskDollar: number;
  potentialProfitDollar: number | null;
  potentialRR: number | null;
  realizedPnl: number | null;
  realizedRR: number | null;
  netPnl: number | null;
  idealRR: number | null;
  durationMinutes: number | null;
  result: "WIN" | "LOSS" | "BE" | null;
}

const sideMultiplier = (direction: Direction) => (direction === "LONG" ? 1 : -1);

/**
 * Risk v $ = |Entry - Stop Loss| (ve stop distance bodech) × point value instrumentu × počet kontraktů.
 * Ekvivalentně dle zadání: (stop distance / tick size) × tick value × contracts.
 */
export function calcRiskDollar(
  entryPrice: number,
  stopLoss: number,
  positionSize: number,
  instrument: string
): number {
  const pointValue = getPointValue(instrument);
  return Math.abs(entryPrice - stopLoss) * pointValue * positionSize;
}

export function calcPotentialProfitDollar(
  entryPrice: number,
  takeProfit: number | null | undefined,
  positionSize: number,
  instrument: string
): number | null {
  if (takeProfit === null || takeProfit === undefined || Number.isNaN(takeProfit)) return null;
  const pointValue = getPointValue(instrument);
  return Math.abs(takeProfit - entryPrice) * pointValue * positionSize;
}

export function calcRealizedPnl(
  direction: Direction,
  entryPrice: number,
  exitPrice: number | null | undefined,
  positionSize: number,
  instrument: string
): number | null {
  if (exitPrice === null || exitPrice === undefined || Number.isNaN(exitPrice)) return null;
  const pointValue = getPointValue(instrument);
  return (exitPrice - entryPrice) * pointValue * positionSize * sideMultiplier(direction);
}

export function calcDurationMinutes(
  time?: string | null,
  exitTime?: string | null
): number | null {
  if (!time || !exitTime) return null;
  const [h1, m1] = time.split(":").map(Number);
  const [h2, m2] = exitTime.split(":").map(Number);
  if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return null;
  let diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60; // obchod přes půlnoc
  return diff;
}

export function calcResult(
  netPnl: number | null,
  riskDollar: number,
  breakevenThresholdR = 0
): "WIN" | "LOSS" | "BE" | null {
  if (netPnl === null || netPnl === undefined) return null;
  const thresholdDollar = breakevenThresholdR * riskDollar;
  if (Math.abs(netPnl) <= thresholdDollar) return "BE";
  return netPnl > 0 ? "WIN" : "LOSS";
}

export function calcIdealRR(
  direction: Direction,
  mfe: number | null | undefined,
  riskDollar: number
): number | null {
  if (mfe === null || mfe === undefined || riskDollar <= 0) return null;
  return mfe / riskDollar;
}

/** Spočítá všechny odvozené hodnoty obchodu z jeho vstupních parametrů. */
export function computeTrade(input: TradeCalcInput): TradeCalcResult {
  const riskDollar = calcRiskDollar(input.entryPrice, input.stopLoss, input.positionSize, input.instrument);
  const potentialProfitDollar = calcPotentialProfitDollar(
    input.entryPrice,
    input.takeProfit,
    input.positionSize,
    input.instrument
  );
  const potentialRR =
    potentialProfitDollar !== null && riskDollar > 0 ? potentialProfitDollar / riskDollar : null;

  const realizedPnl = calcRealizedPnl(
    input.direction,
    input.entryPrice,
    input.exitPrice,
    input.positionSize,
    input.instrument
  );
  const fees = input.fees ?? 0;
  const netPnl = realizedPnl !== null ? realizedPnl - fees : null;
  // R:R dle skutečné vzdálenosti Entry -> Exit vs. Entry -> Stop (netPnl už v sobě
  // nese správnou point value i směr obchodu, riskDollar také - poměr je tedy přímo R).
  const realizedRR = netPnl !== null && riskDollar > 0 ? netPnl / riskDollar : null;

  const idealRR = calcIdealRR(input.direction, input.mfe, riskDollar);

  const durationMinutes = calcDurationMinutes(input.time, input.exitTime);

  const result = calcResult(netPnl, riskDollar, input.breakevenThresholdR ?? 0);

  return {
    riskDollar,
    initialRiskDollar: riskDollar,
    potentialProfitDollar,
    potentialRR,
    realizedPnl,
    realizedRR,
    netPnl,
    idealRR,
    durationMinutes,
    result,
  };
}

export function calcRiskPercent(riskDollar: number, accountBalance: number): number | null {
  if (!accountBalance) return null;
  return (riskDollar / accountBalance) * 100;
}

export interface RecommendedPositionSize {
  /** Nezaokrouhlený počet kontraktů/jednotek odpovídající přesně zadanému risku. */
  exact: number;
  /** Maximální celočíselný počet kontraktů, který nepřekročí zadaný risk (floor). */
  maxContracts: number;
  /** Risk $ cíl, ze kterého se počítalo (accountBalance × riskPercent / 100). */
  targetRiskDollar: number;
  /** Risk $ při reálně obchodovatelném (celočíselném) počtu kontraktů. */
  riskDollarAtMax: number;
}

/**
 * Doporučená / maximální position size pro zadaný risk % a stop distance -
 * POUZE informativní hodnota pro rozhodování před vstupem do obchodu.
 * Nikdy se nepoužívá k přepsání skutečně zadané (actual) position size obchodu.
 */
export function calcRecommendedPositionSize(
  accountBalance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
  instrument: string
): RecommendedPositionSize | null {
  const distance = Math.abs(entryPrice - stopLoss);
  if (!accountBalance || !riskPercent || distance <= 0) return null;
  const pointValue = getPointValue(instrument);
  const riskPerUnit = distance * pointValue;
  if (riskPerUnit <= 0) return null;

  const targetRiskDollar = (accountBalance * riskPercent) / 100;
  const exact = targetRiskDollar / riskPerUnit;
  const maxContracts = Math.floor(exact);

  return {
    exact,
    maxContracts,
    targetRiskDollar,
    riskDollarAtMax: maxContracts * riskPerUnit,
  };
}
