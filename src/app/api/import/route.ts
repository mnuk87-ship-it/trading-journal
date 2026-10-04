import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccount } from "@/lib/account";
import { computeTrade, calcRiskPercent } from "@/lib/calculations";
import type { Direction, Session, Timeframe } from "@/types/trade";

interface ImportRow {
  date: string;
  time?: string;
  instrument: string;
  direction: string;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  positionSize?: number;
  session?: string;
  timeframe?: string;
  setup?: string;
  fees?: number;
}

const VALID_SESSIONS: Session[] = ["Asia", "London", "New York", "Other"];
const VALID_TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "30m", "1H", "4H", "Daily"];

function normalizeDate(raw: string): string {
  // podporuje YYYY-MM-DD, DD.MM.YYYY, MM/DD/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dot = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dot) return `${dot[3]}-${dot[2].padStart(2, "0")}-${dot[1].padStart(2, "0")}`;
  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  throw new Error(`Neplatné datum: ${raw}`);
}

export async function POST(req: Request) {
  const body = await req.json();
  const accountId: string = body.accountId ?? (await ensureDefaultAccount());
  const rows: ImportRow[] = body.rows ?? [];

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const errors: { row: number; message: string }[] = [];
  let imported = 0;

  const strategyCache = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      if (!row.instrument || !row.date || row.entryPrice === undefined) {
        throw new Error("Chybí povinné pole (date, instrument, entryPrice)");
      }
      const direction: Direction = String(row.direction).toUpperCase().startsWith("S") ? "SHORT" : "LONG";
      const session: Session = VALID_SESSIONS.includes(row.session as Session)
        ? (row.session as Session)
        : "Other";
      const timeframe: Timeframe = VALID_TIMEFRAMES.includes(row.timeframe as Timeframe)
        ? (row.timeframe as Timeframe)
        : "15m";

      let strategyId: string | null = null;
      if (row.setup) {
        const key = row.setup.trim();
        if (strategyCache.has(key)) {
          strategyId = strategyCache.get(key)!;
        } else {
          const strategy = await prisma.strategy.upsert({
            where: { accountId_name: { accountId, name: key } },
            update: {},
            create: { accountId, name: key, isCustom: true },
          });
          strategyId = strategy.id;
          strategyCache.set(key, strategy.id);
        }
      }

      const entryPrice = Number(row.entryPrice);
      const stopLoss = row.stopLoss !== undefined ? Number(row.stopLoss) : entryPrice * (direction === "LONG" ? 0.999 : 1.001);
      const positionSize = row.positionSize !== undefined ? Number(row.positionSize) : 1;
      const takeProfit = row.takeProfit !== undefined ? Number(row.takeProfit) : null;
      const exitPrice = row.exitPrice !== undefined ? Number(row.exitPrice) : null;
      const fees = row.fees !== undefined ? Number(row.fees) : 0;
      const time = row.time ?? "09:30";
      const instrument = row.instrument.toUpperCase();

      const calc = computeTrade({
        instrument,
        direction,
        entryPrice,
        stopLoss,
        takeProfit,
        exitPrice,
        positionSize,
        fees,
        time,
        breakevenThresholdR: account.breakevenThreshold,
      });
      const riskPercent = calcRiskPercent(calc.riskDollar, account.startingBalance);

      await prisma.trade.create({
        data: {
          accountId,
          instrument,
          direction,
          date: new Date(normalizeDate(row.date) + "T00:00:00.000Z"),
          time,
          session,
          timeframe,
          entryPrice,
          stopLoss,
          takeProfit,
          exitPrice,
          positionSize,
          riskPercent,
          riskDollar: calc.riskDollar,
          initialRiskDollar: calc.initialRiskDollar,
          potentialProfitDollar: calc.potentialProfitDollar,
          potentialRR: calc.potentialRR,
          realizedPnl: calc.realizedPnl,
          realizedRR: calc.realizedRR,
          fees,
          netPnl: calc.netPnl,
          idealRR: calc.idealRR,
          strategyId,
          result: calc.result,
          durationMinutes: calc.durationMinutes,
        },
      });
      imported++;
    } catch (e) {
      errors.push({ row: i + 1, message: e instanceof Error ? e.message : "Neznámá chyba" });
    }
  }

  return NextResponse.json({ imported, errors, total: rows.length });
}
