import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccount } from "@/lib/account";
import { fetchTradesForAccount } from "@/lib/trades-query";
import { getFullAnalytics } from "@/lib/analytics";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? (await ensureDefaultAccount());
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const trades = await fetchTradesForAccount(accountId, searchParams);
  const minSampleParam = searchParams.get("minConfluenceSample");
  const minConfluenceSampleSize = minSampleParam ? Math.max(1, parseInt(minSampleParam, 10) || 20) : 20;
  const minRsiSampleParam = searchParams.get("minRsiSample");
  const minRsiSampleSize = minRsiSampleParam ? Math.max(1, parseInt(minRsiSampleParam, 10) || 10) : 10;
  const analytics = getFullAnalytics(trades, account.startingBalance, minConfluenceSampleSize, minRsiSampleSize);

  return NextResponse.json({
    analytics,
    account: {
      id: account.id,
      name: account.name,
      currency: account.currency,
      startingBalance: account.startingBalance,
      currentBalance: account.startingBalance + analytics.totals.totalPnl,
    },
    tradeCount: trades.length,
  });
}
