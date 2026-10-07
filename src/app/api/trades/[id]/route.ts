import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tradeInclude, toTradeDTO } from "@/lib/mappers";
import { tradeSchema } from "@/lib/validation";
import { computeTrade, calcRiskPercent } from "@/lib/calculations";
import { ensureDefaultConfluences } from "@/lib/account";
import { sanitizeConfluenceKeys } from "@/lib/confluences";
import { sanitizeRsiCross } from "@/lib/rsi";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trade = await prisma.trade.findUnique({ where: { id }, include: tradeInclude });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(toTradeDTO(trade));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await prisma.trade.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = tradeSchema.safeParse({ ...body, accountId: existing.accountId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const account = await prisma.account.findUnique({ where: { id: existing.accountId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const calc = computeTrade({
    instrument: data.instrument,
    direction: data.direction,
    entryPrice: data.entryPrice,
    stopLoss: data.stopLoss,
    takeProfit: data.takeProfit,
    exitPrice: data.exitPrice,
    positionSize: data.positionSize,
    fees: data.fees,
    mfe: data.mfe,
    time: data.time,
    exitTime: data.exitTime,
    breakevenThresholdR: account.breakevenThreshold,
  });
  const riskPercent = calcRiskPercent(calc.riskDollar, account.startingBalance);

  const tagNames: string[] = data.tags ?? [];
  const tagRecords = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { accountId_name: { accountId: existing.accountId, name } },
        update: {},
        create: { accountId: existing.accountId, name },
      })
    )
  );

  await prisma.tradeTag.deleteMany({ where: { tradeId: id } });

  // RSI Cross konfluence - server-side sanitizace + dopočet zóny (nikdy od klienta).
  const rsi15m = sanitizeRsiCross({
    crossed: data.rsi15mCrossed,
    direction: data.rsi15mDirection,
    value: data.rsi15mValue,
    crossTime: data.rsi15mCrossTime,
    candlesToEntry: data.rsi15mCandlesToEntry,
  });
  const rsi5m = sanitizeRsiCross({
    crossed: data.rsi5mCrossed,
    direction: data.rsi5mDirection,
    value: data.rsi5mValue,
    crossTime: data.rsi5mCrossTime,
    candlesToEntry: data.rsi5mCandlesToEntry,
  });

  // Auto-sync RSI_15M/RSI_5M do obecného seznamu konfluencí (viz POST route).
  const confluenceKeys = sanitizeConfluenceKeys(data.confluences);
  if (rsi15m.crossed && !confluenceKeys.includes("RSI_15M")) confluenceKeys.push("RSI_15M");
  if (rsi5m.crossed && !confluenceKeys.includes("RSI_5M")) confluenceKeys.push("RSI_5M");
  if (confluenceKeys.length) await ensureDefaultConfluences();
  await prisma.tradeConfluence.deleteMany({ where: { tradeId: id } });

  const screenshots = Array.isArray(body.screenshots) ? body.screenshots : null;
  if (screenshots) {
    await prisma.screenshot.deleteMany({ where: { tradeId: id } });
  }

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      instrument: data.instrument,
      direction: data.direction,
      date: new Date(data.date + "T00:00:00.000Z"),
      time: data.time,
      session: data.session,
      timeframe: data.timeframe,
      entryPrice: data.entryPrice,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit ?? null,
      exitPrice: data.exitPrice ?? null,
      exitTime: data.exitTime ?? null,
      positionSize: data.positionSize,
      riskPercent,
      riskDollar: calc.riskDollar,
      initialRiskDollar: calc.initialRiskDollar,
      potentialProfitDollar: calc.potentialProfitDollar,
      potentialRR: calc.potentialRR,
      realizedPnl: calc.realizedPnl,
      realizedRR: calc.realizedRR,
      fees: data.fees ?? 0,
      netPnl: calc.netPnl,
      mfe: data.mfe ?? null,
      mae: data.mae ?? null,
      idealRR: calc.idealRR,
      strategyId: data.strategyId || null,
      entryReason: data.entryReason ?? null,
      marketCondition: data.marketCondition ?? null,
      trend: data.trend ?? null,
      marketType: data.marketType ?? null,
      isAPlus: data.isAPlus ?? false,
      movedSL: data.movedSL ?? false,
      tookPartial: data.tookPartial ?? false,
      partialPercent: data.partialPercent ?? null,
      numPartials: data.numPartials ?? null,
      avgExitPrice: data.avgExitPrice ?? null,
      followedPlan: data.followedPlan ?? true,
      revengeTrade: data.revengeTrade ?? false,
      overtraded: data.overtraded ?? false,
      accordingToSetup: data.accordingToSetup ?? true,
      emotionBefore: data.emotionBefore ?? null,
      emotionAfter: data.emotionAfter ?? null,
      confidence: data.confidence ?? null,
      discipline: data.discipline ?? null,
      patience: data.patience ?? null,
      stress: data.stress ?? null,
      notesSeen: data.notesSeen ?? null,
      notesGood: data.notesGood ?? null,
      notesBad: data.notesBad ?? null,
      notesNext: data.notesNext ?? null,
      result: calc.result,
      durationMinutes: calc.durationMinutes,

      rsi15mCrossed: rsi15m.crossed,
      rsi15mDirection: rsi15m.direction,
      rsi15mValue: rsi15m.value,
      rsi15mZone: rsi15m.zone,
      rsi15mCrossTime: rsi15m.crossTime,
      rsi15mCandlesToEntry: rsi15m.candlesToEntry,

      rsi5mCrossed: rsi5m.crossed,
      rsi5mDirection: rsi5m.direction,
      rsi5mValue: rsi5m.value,
      rsi5mZone: rsi5m.zone,
      rsi5mCrossTime: rsi5m.crossTime,
      rsi5mCandlesToEntry: rsi5m.candlesToEntry,

      tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
      confluences: { create: confluenceKeys.map((key) => ({ confluenceKey: key })) },
      ...(screenshots
        ? { screenshots: { create: screenshots.map((s: { type: string; url: string }) => ({ type: s.type, url: s.url })) } }
        : {}),
    },
    include: tradeInclude,
  });

  return NextResponse.json(toTradeDTO(trade));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.trade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
