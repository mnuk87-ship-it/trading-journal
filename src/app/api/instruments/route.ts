import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccount } from "@/lib/account";
import { DEFAULT_INSTRUMENTS } from "@/types/trade";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? (await ensureDefaultAccount());
  const custom = await prisma.instrument.findMany({ where: { accountId }, orderBy: { symbol: "asc" } });
  const symbols = Array.from(new Set([...DEFAULT_INSTRUMENTS, ...custom.map((c) => c.symbol)]));
  return NextResponse.json(symbols);
}

export async function POST(req: Request) {
  const body = await req.json();
  const accountId = body.accountId ?? (await ensureDefaultAccount());
  const symbol = String(body.symbol).toUpperCase().trim();
  const instrument = await prisma.instrument.upsert({
    where: { accountId_symbol: { accountId, symbol } },
    update: {},
    create: { accountId, symbol },
  });
  return NextResponse.json(instrument, { status: 201 });
}
