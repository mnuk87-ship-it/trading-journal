# Trading Journal & Analytics

Osobní deníkovací a analytická aplikace pro obchodníky na finančních trzích. Umožňuje si zapisovat jednotlivé obchody se všemi detaily (vstup/výstup, risk, R:R, emoce, psychologie, konfluence) a sledovat vlastní statistiky a výkonnost napříč účty, strategiemi, instrumenty a časem.

## Funkce

- **Deník obchodů** – zápis a editace obchodů (instrument, směr, entry/SL/TP/exit, position size, fees, MFE/MAE, výsledek, R:R, PnL)
- **Více účtů** – správa více obchodních účtů s vlastní měnou, počáteční balance, výchozím risk %, komisí a timezone
- **Strategie a tagy** – přiřazování vlastních strategií a tagů k obchodům
- **Psychologie obchodování** – sledování emocí před/po obchodu, disciplíny, trpělivosti, stresu a dodržení plánu (revenge trading, overtrading, podle setupu)
- **RSI Cross konfluence** – detailní sledování RSI cross signálu na primárním (15M) a sekundárním (5M) timeframe: číselná hodnota RSI při crossu, směr, čas, automaticky dopočítaná zóna a počet svíček do vstupu
- **Filtrování obchodů** – podle data, instrumentu, směru, session, timeframe, strategie, výsledku, A+ setupu i RSI parametrů (crossed/direction/zone/hodnota/kombinace 15M+5M)
- **Analytika a dashboard** – win rate, profit factor, průměrné R:R, equity curve, breakdown podle zóny RSI, kombinace 15M/5M, srovnání winnerů vs loserů, s ochranou proti zavádějícím závěrům na malém vzorku dat ("insufficient data")
- **Kalendář obchodů** a **reporty** s exportem/importem dat (CSV)
- **Screenshoty** k obchodům (before/after)

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + [React 19](https://react.dev) + TypeScript
- [Prisma ORM](https://www.prisma.io) nad SQLite (připraveno na snadný přechod na PostgreSQL)
- [Zod](https://zod.dev) pro validaci vstupních dat
- [Tailwind CSS 4](https://tailwindcss.com) pro styling
- [Recharts](https://recharts.org) pro grafy
- ESLint, TypeScript strict mode

## Datový model

Hlavní entity (viz `prisma/schema.prisma`): `User`, `Account`, `Instrument`, `Strategy`, `Tag`, `Trade`, `Confluence`, `Screenshot`. Obchod (`Trade`) je centrální entita nesoucí veškerá obchodní, risk-management i psychologická data a vazby na strategii, tagy, konfluence a screenshoty.

## Spuštění

```bash
# instalace závislostí
npm install

# vytvoření/aktualizace lokální SQLite databáze dle Prisma schématu
npx prisma migrate dev

# spuštění dev serveru
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000).

### Proměnné prostředí

Vytvoř soubor `.env` v rootu projektu (viz `.gitignore` – `.env*` se nikdy nekomituje) s připojením k databázi:

```env
DATABASE_URL="file:./dev.db"
```

## Další příkazy

```bash
npm run build   # produkční build
npm run start   # spuštění produkčního buildu
npm run lint    # ESLint
```

## Struktura projektu

```
src/
  app/            # Next.js App Router stránky a API routes
    dashboard/    # přehledový dashboard
    trades/       # deník obchodů + detail obchodu
    analytics/    # detailní analytika (vč. RSI performance)
    calendar/     # kalendářní pohled na obchody
    strategies/   # správa strategií
    psychology/   # psychologická analytika
    reports/      # reporty a export/import
    settings/     # nastavení účtu
    api/          # REST API routes (trades, accounts, strategies, analytics, ...)
  components/     # React komponenty (formuláře, filtry, grafy, UI)
  hooks/          # custom React hooks (data fetching, stav)
  lib/            # doménová logika (analytics, RSI výpočty, validace, mappery, Prisma klient)
  types/          # centrální doménové typy a DTO
prisma/
  schema.prisma   # datový model
  migrations/     # historie databázových migrací
```

## Licence

Soukromý projekt pro osobní použití.
