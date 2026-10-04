// Specifikace futures kontraktů (tick size / tick value) pro správný výpočet
// risk $, PnL a R:R. Position Size u futures je POČET KONTRAKTŮ, ne $ hodnota,
// takže $ dopad jednoho bodu pohybu ceny ("point value") se liší instrument od
// instrumentu - u akcií/forexu/krypta je naproti tomu typicky 1 jednotka = $1
// na bod (proto je tam fallback pointValue = 1, které zachovává původní chování).
//
// point value = tick value / tick size
// (ověřeno na zadání: MNQ 0.25 bodu / $0.50 => $2 za bod; NQ 0.25 bodu / $5 => $20 za bod)

export interface ContractSpec {
  tickSize: number;
  tickValue: number; // $ za 1 tick, za 1 kontrakt
  pointValue: number; // $ za 1 bod (= tickValue / tickSize), za 1 kontrakt
}

function spec(tickSize: number, tickValue: number): ContractSpec {
  return { tickSize, tickValue, pointValue: tickValue / tickSize };
}

/** Známé futures kontrakty (CME a další). Klíč = symbol v horních znacích. */
export const CONTRACT_SPECS: Record<string, ContractSpec> = {
  // Nasdaq-100
  NQ: spec(0.25, 5),
  MNQ: spec(0.25, 0.5),
  // S&P 500
  ES: spec(0.25, 12.5),
  MES: spec(0.25, 1.25),
  // Dow Jones
  YM: spec(1, 5),
  MYM: spec(1, 0.5),
  // Zlato
  GC: spec(0.1, 10),
  MGC: spec(0.1, 1),
  // Ropa
  CL: spec(0.01, 10),
  MCL: spec(0.01, 1),
  // Stříbro
  SI: spec(0.005, 25),
  // Euro FX futures
  "6E": spec(0.00005, 6.25),
};

/** Instrumenty, u nichž 1 jednotka position size = 1 $ na bod pohybu ceny (výchozí chování). */
const DEFAULT_SPEC: ContractSpec = { tickSize: 1, tickValue: 1, pointValue: 1 };

/** Vrátí specifikaci kontraktu pro daný symbol (case-insensitive). Neznámý/nefutures
 * symbol (akcie, forex, krypto, CFD...) dostane fallback s pointValue = 1, což odpovídá
 * dřívějšímu chování aplikace (risk $ = cenový rozdíl × position size). */
export function getContractSpec(instrument: string | null | undefined): ContractSpec {
  if (!instrument) return DEFAULT_SPEC;
  const key = instrument.trim().toUpperCase();
  return CONTRACT_SPECS[key] ?? DEFAULT_SPEC;
}

export function getPointValue(instrument: string | null | undefined): number {
  return getContractSpec(instrument).pointValue;
}
