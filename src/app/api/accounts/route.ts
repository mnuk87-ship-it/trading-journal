import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccount } from "@/lib/account";

export async function GET() {
  await ensureDefaultAccount();
  const accounts = await prisma.account.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { trades: true } } },
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  let user = await prisma.user.findFirst();
  if (!user) user = await prisma.user.create({ data: { name: "Trader" } });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: body.name ?? "Nový účet",
      currency: body.currency ?? "USD",
      startingBalance: Number(body.startingBalance ?? 10000),
      defaultRiskPct: Number(body.defaultRiskPct ?? 1),
      defaultInstrument: body.defaultInstrument ?? "NQ",
      defaultSession: body.defaultSession ?? "New York",
      commissionPerSide: Number(body.commissionPerSide ?? 0),
      timezone: body.timezone ?? "Europe/Prague",
      breakevenThreshold: Number(body.breakevenThreshold ?? 0),
    },
  });
  return NextResponse.json(account, { status: 201 });
}
