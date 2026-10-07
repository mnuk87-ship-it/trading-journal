// RSI Cross konfluence - detailní, číselná data (hodnota, směr, zóna, timing)
// pro 15M (primární potvrzení) a 5M (sekundární potvrzení / přesnější timing).
//
// POZOR: stejně jako obecné konfluence (src/lib/confluences.ts) je toto čistě
// analytický atribut obchodu. NESMÍ nikdy ovlivnit výpočet risku, Position
// Size, PnL ani R:R - ty se počítají výhradně v src/lib/calculations.ts.
//
// RSI zóna se VŽDY dopočítává na serveru z `rsi*Value` (nikdy se nepřijímá
// přímo od klienta) - je to jediný zdroj pravdy pro mapování hodnota → zóna.

export type RsiDirection = "Bullish" | "Bearish";

export const RSI_DIRECTIONS: RsiDirection[] = ["Bullish", "Bearish"];

export const RSI_ZONES = ["<40", "40-45", "45-50", "50-55", "55-60", "60-65", ">65"] as const;

export type RsiZone = (typeof RSI_ZONES)[number];

export function isValidRsiDirection(v: unknown): v is RsiDirection {
  return v === "Bullish" || v === "Bearish";
}

/** Dopočítá RSI zónu z číselné hodnoty 0-100. Vrací null pro neplatnou/chybějící hodnotu. */
export function calcRsiZone(value: number | null | undefined): RsiZone | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (value < 40) return "<40";
  if (value < 45) return "40-45";
  if (value < 50) return "45-50";
  if (value < 55) return "50-55";
  if (value < 60) return "55-60";
  if (value < 65) return "60-65";
  return ">65";
}

/** Hezčí label zóny pro UI (en-dash místo hyphen), např. "50–55". */
export function rsiZoneLabel(zone: string | null | undefined): string {
  if (!zone) return "—";
  return zone.replace("-", "–");
}

export interface RsiCrossInput {
  crossed?: boolean | null;
  direction?: string | null;
  value?: number | null;
  crossTime?: string | null;
  candlesToEntry?: number | null;
}

export interface SanitizedRsiCross {
  crossed: boolean;
  direction: RsiDirection | null;
  value: number | null;
  zone: RsiZone | null;
  crossTime: string | null;
  candlesToEntry: number | null;
}

/**
 * Normalizuje vstupní RSI data pro jeden timeframe (15M nebo 5M).
 * Pokud cross nenastal (`crossed` je false/chybí), všechna detailní pole
 * se nastaví na null - nemá smysl ukládat hodnotu/směr/čas pro cross,
 * který se nestal (zabraňuje nekonzistentním datům).
 */
export function sanitizeRsiCross(input: RsiCrossInput): SanitizedRsiCross {
  const crossed = input.crossed === true;
  if (!crossed) {
    return { crossed: false, direction: null, value: null, zone: null, crossTime: null, candlesToEntry: null };
  }
  const direction = isValidRsiDirection(input.direction) ? input.direction : null;
  const value =
    typeof input.value === "number" && Number.isFinite(input.value) ? Math.round(input.value * 10) / 10 : null;
  const zone = calcRsiZone(value);
  const crossTime = typeof input.crossTime === "string" && input.crossTime.trim() ? input.crossTime : null;
  const candlesToEntry =
    typeof input.candlesToEntry === "number" && Number.isFinite(input.candlesToEntry) && input.candlesToEntry >= 0
      ? Math.round(input.candlesToEntry)
      : null;
  return { crossed, direction, value, zone, crossTime, candlesToEntry };
}
