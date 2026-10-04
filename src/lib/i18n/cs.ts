// Český slovník. Struktura je připravena na doplnění dalších jazyků
// (src/lib/i18n/en.ts) a přepínání přes `locale` uložené u uživatele.
const cs = {
  nav: {
    dashboard: "Dashboard",
    trades: "Obchody",
    calendar: "Kalendář",
    analytics: "Analytika",
    strategies: "Strategie",
    sessions: "Session",
    psychology: "Psychologie",
    reports: "Reporty",
    settings: "Nastavení",
  },
  direction: { LONG: "LONG", SHORT: "SHORT" },
  session: { Asia: "Asie", London: "Londýn", "New York": "New York", Other: "Ostatní" },
  result: { WIN: "WIN", LOSS: "LOSS", BE: "BE" },
  trend: { Bullish: "Bullish", Bearish: "Bearish", Neutral: "Neutrální" },
  marketType: { Trend: "Trend", Range: "Range", Choppy: "Choppy" },
  emotion: {
    Calm: "Klid",
    Confident: "Jistota",
    Fear: "Strach",
    FOMO: "FOMO",
    Greedy: "Hamižnost",
    Angry: "Vztek",
    Revenge: "Pomsta",
    Uncertain: "Nejistota",
  },
} as const;

export default cs;
export type Dictionary = typeof cs;
