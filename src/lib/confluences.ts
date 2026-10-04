// Fixní seznam konfluencí pro obchodní strategii.
// POZOR: konfluence jsou čistě analytický atribut obchodu. NESMÍ nikdy
// ovlivnit výpočet risku, Position Size, PnL ani R:R - ty se počítají
// výhradně v src/lib/calculations.ts na základě cenových/velikostních údajů.
//
// Tento soubor je sdílený mezi klientem (formulář, detail obchodu) i
// serverem (seed, validace, API) - je to jediný zdroj pravdy pro seznam
// a pořadí konfluencí.

export interface ConfluenceDef {
  key: string;
  label: string;
}

export const CONFLUENCE_DEFS: ConfluenceDef[] = [
  { key: "FVG", label: "FVG" },
  { key: "BPR", label: "BPR" },
  { key: "OB", label: "OB" },
  { key: "RSI_15M", label: "RSI Cross 15M" },
  { key: "RSI_5M", label: "RSI Cross 5M" },
  { key: "RSI_1H", label: "RSI Cross 1H" },
  { key: "HVN", label: "HVN" },
  { key: "POC", label: "POC" },
];

export const CONFLUENCE_KEYS: string[] = CONFLUENCE_DEFS.map((d) => d.key);

export function isValidConfluenceKey(key: string): boolean {
  return CONFLUENCE_KEYS.includes(key);
}

export function confluenceLabel(key: string): string {
  return CONFLUENCE_DEFS.find((d) => d.key === key)?.label ?? key;
}

/** Vyfiltruje a deduplikuje vstupní klíče na jen ty platné (bezpečné pro uložení do DB). */
export function sanitizeConfluenceKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  const unique = new Set<string>();
  for (const k of keys) {
    if (typeof k === "string" && isValidConfluenceKey(k)) unique.add(k);
  }
  // zachovat definované pořadí
  return CONFLUENCE_KEYS.filter((k) => unique.has(k));
}

/** Všechny neprázdné kombinace (podmnožiny) o velikosti >= `minSize` z fixního seznamu konfluencí. */
export function generateCombinations(keys: string[] = CONFLUENCE_KEYS, minSize = 2): string[][] {
  const result: string[][] = [];
  const n = keys.length;
  for (let mask = 1; mask < 1 << n; mask++) {
    const combo: string[] = [];
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) combo.push(keys[i]);
    }
    if (combo.length >= minSize) result.push(combo);
  }
  return result;
}
