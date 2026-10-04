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

  const trades = await prisma.trade.findMany({
    where,
    include: tradeInclude,
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });
  return trades.map(toTradeDTO);
}
