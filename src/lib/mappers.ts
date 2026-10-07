import type { Prisma } from "@prisma/client";
import type { TradeDTO } from "@/types/trade";

export const tradeInclude = {
  strategy: true,
  screenshots: true,
  tags: { include: { tag: true } },
  confluences: true,
} satisfies Prisma.TradeInclude;

type TradeWithRelations = Prisma.TradeGetPayload<{ include: typeof tradeInclude }>;

export function toTradeDTO(trade: TradeWithRelations): TradeDTO {
  return {
    id: trade.id,
    accountId: trade.accountId,
    instrument: trade.instrument,
    direction: trade.direction as TradeDTO["direction"],
    date: trade.date.toISOString().slice(0, 10),
    time: trade.time,
    session: trade.session as TradeDTO["session"],
    timeframe: trade.timeframe as TradeDTO["timeframe"],

    entryPrice: trade.entryPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    exitPrice: trade.exitPrice,
    exitTime: trade.exitTime,
    positionSize: trade.positionSize,
    riskPercent: trade.riskPercent,
    riskDollar: trade.riskDollar,
    initialRiskDollar: trade.initialRiskDollar,
    potentialProfitDollar: trade.potentialProfitDollar,
    potentialRR: trade.potentialRR,
    realizedPnl: trade.realizedPnl,
    realizedRR: trade.realizedRR,
    fees: trade.fees,
    netPnl: trade.netPnl,

    mfe: trade.mfe,
    mae: trade.mae,
    idealRR: trade.idealRR,

    strategyId: trade.strategyId,
    strategy: trade.strategy
      ? {
          id: trade.strategy.id,
          name: trade.strategy.name,
          description: trade.strategy.description,
          isCustom: trade.strategy.isCustom,
        }
      : null,
    entryReason: trade.entryReason,
    marketCondition: trade.marketCondition,
    trend: trade.trend as TradeDTO["trend"],
    marketType: trade.marketType as TradeDTO["marketType"],
    isAPlus: trade.isAPlus,

    movedSL: trade.movedSL,
    tookPartial: trade.tookPartial,
    partialPercent: trade.partialPercent,
    numPartials: trade.numPartials,
    avgExitPrice: trade.avgExitPrice,
    followedPlan: trade.followedPlan,
    revengeTrade: trade.revengeTrade,
    overtraded: trade.overtraded,
    accordingToSetup: trade.accordingToSetup,

    emotionBefore: trade.emotionBefore as TradeDTO["emotionBefore"],
    emotionAfter: trade.emotionAfter as TradeDTO["emotionAfter"],
    confidence: trade.confidence,
    discipline: trade.discipline,
    patience: trade.patience,
    stress: trade.stress,
    notesSeen: trade.notesSeen,
    notesGood: trade.notesGood,
    notesBad: trade.notesBad,
    notesNext: trade.notesNext,

    result: trade.result as TradeDTO["result"],
    durationMinutes: trade.durationMinutes,

    rsi15mCrossed: trade.rsi15mCrossed,
    rsi15mDirection: trade.rsi15mDirection as TradeDTO["rsi15mDirection"],
    rsi15mValue: trade.rsi15mValue,
    rsi15mZone: trade.rsi15mZone as TradeDTO["rsi15mZone"],
    rsi15mCrossTime: trade.rsi15mCrossTime,
    rsi15mCandlesToEntry: trade.rsi15mCandlesToEntry,

    rsi5mCrossed: trade.rsi5mCrossed,
    rsi5mDirection: trade.rsi5mDirection as TradeDTO["rsi5mDirection"],
    rsi5mValue: trade.rsi5mValue,
    rsi5mZone: trade.rsi5mZone as TradeDTO["rsi5mZone"],
    rsi5mCrossTime: trade.rsi5mCrossTime,
    rsi5mCandlesToEntry: trade.rsi5mCandlesToEntry,

    screenshots: trade.screenshots.map((s) => ({ id: s.id, type: s.type as "BEFORE" | "AFTER", url: s.url })),
    tags: trade.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
    confluences: trade.confluences.map((c) => c.confluenceKey),

    createdAt: trade.createdAt.toISOString(),
    updatedAt: trade.updatedAt.toISOString(),
  };
}
