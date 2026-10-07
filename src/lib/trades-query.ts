import { prisma } from "@/lib/prisma";
import { tradeInclude, toTradeDTO } from "@/lib/mappers";
import type { TradeDTO } from "@/types/trade";

export async function fetchTradesForAccount(accountId: string, searchParams: URLSearchParams): Promise<TradeDTO[]> {
  const where: Record<string, unknown> = { accountId };
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    where.date = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  const instrument = searchParams.getAll("instrument");
  if (instrument.length) where.instrument = { in: instrument };
  const direction = searchParams.getAll("direction");
  if (direction.length) where.direction = { in: direction };
  const session = searchParams.getAll("session");
  if (session.length) where.session = { in: session };
  const result = searchParams.getAll("result");
  if (result.length) where.result = { in: result };
  const timeframe = searchParams.getAll("timeframe");
  if (timeframe.length) where.timeframe = { in: timeframe };
  const strategyId = searchParams.getAll("strategyId");
  if (strategyId.length) where.strategyId = { in: strategyId };
  const isAPlus = searchParams.get("isAPlus");
  if (isAPlus !== null) where.isAPlus = isAPlus === "true";

  // --- RSI filtry ---
  const rsi15mCrossed = searchParams.get("rsi15mCrossed");
  if (rsi15mCrossed !== null) where.rsi15mCrossed = rsi15mCrossed === "true";
  const rsi5mCrossed = searchParams.get("rsi5mCrossed");
  if (rsi5mCrossed !== null) where.rsi5mCrossed = rsi5mCrossed === "true";

  const rsi15mDirection = searchParams.getAll("rsi15mDirection");
  if (rsi15mDirection.length) where.rsi15mDirection = { in: rsi15mDirection };
  const rsi5mDirection = searchParams.getAll("rsi5mDirection");
  if (rsi5mDirection.length) where.rsi5mDirection = { in: rsi5mDirection };

  const rsi15mZone = searchParams.getAll("rsi15mZone");
  if (rsi15mZone.length) where.rsi15mZone = { in: rsi15mZone };
  const rsi5mZone = searchParams.getAll("rsi5mZone");
  if (rsi5mZone.length) where.rsi5mZone = { in: rsi5mZone };

  const rsi15mValueMin = searchParams.get("rsi15mValueMin");
  const rsi15mValueMax = searchParams.get("rsi15mValueMax");
  if (rsi15mValueMin !== null || rsi15mValueMax !== null) {
    where.rsi15mValue = {
      ...(rsi15mValueMin !== null ? { gte: Number(rsi15mValueMin) } : {}),
      ...(rsi15mValueMax !== null ? { lte: Number(rsi15mValueMax) } : {}),
    };
  }
  const rsi5mValueMin = searchParams.get("rsi5mValueMin");
  const rsi5mValueMax = searchParams.get("rsi5mValueMax");
  if (rsi5mValueMin !== null || rsi5mValueMax !== null) {
    where.rsi5mValue = {
      ...(rsi5mValueMin !== null ? { gte: Number(rsi5mValueMin) } : {}),
      ...(rsi5mValueMax !== null ? { lte: Number(rsi5mValueMax) } : {}),
    };
  }

  // Kombinace: "15M" (jen 15M), "15M+5M" (oba), "5M" (jen 5M)
  const rsiCombo = searchParams.getAll("rsiCombo");
  if (rsiCombo.length) {
    const comboOr: Record<string, unknown>[] = [];
    if (rsiCombo.includes("15M")) comboOr.push({ rsi15mCrossed: true, rsi5mCrossed: false });
    if (rsiCombo.includes("15M+5M")) comboOr.push({ rsi15mCrossed: true, rsi5mCrossed: true });
    if (rsiCombo.includes("5M")) comboOr.push({ rsi15mCrossed: false, rsi5mCrossed: true });
    if (comboOr.length) where.OR = comboOr;
  }

  const trades = await prisma.trade.findMany({
    where,
    include: tradeInclude,
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
  return trades.map(toTradeDTO);
}
