import { NextResponse } from "next/server";
import { ensureDefaultAccount } from "@/lib/account";
import { fetchTradesForAccount } from "@/lib/trades-query";

function flatten(trades: Awaited<ReturnType<typeof fetchTradesForAccount>>) {
  return trades.map((t) => ({
    id: t.id,
    date: t.date,
    time: t.time,
    instrument: t.instrument,
    direction: t.direction,
    session: t.session,
    timeframe: t.timeframe,
    setup: t.strategy?.name ?? "",
    entryPrice: t.entryPrice,
    stopLoss: t.stopLoss,
    takeProfit: t.takeProfit ?? "",
    exitPrice: t.exitPrice ?? "",
    positionSize: t.positionSize,
    riskPercent: t.riskPercent ?? "",
    riskDollar: t.riskDollar ?? "",
    realizedPnl: t.realizedPnl ?? "",
    netPnl: t.netPnl ?? "",
    realizedRR: t.realizedRR ?? "",
    idealRR: t.idealRR ?? "",
    result: t.result ?? "",
    isAPlus: t.isAPlus,
    tags: t.tags.map((tag) => tag.name).join("|"),
  }));
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? (await ensureDefaultAccount());
  const format = searchParams.get("format") ?? "csv";

  const trades = await fetchTradesForAccount(accountId, searchParams);

  if (format === "json") {
    return new NextResponse(JSON.stringify(trades, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="trades-export-${Date.now()}.json"`,
      },
    });
  }

  const csv = toCsv(flatten(trades));
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trades-export-${Date.now()}.csv"`,
    },
  });
}
