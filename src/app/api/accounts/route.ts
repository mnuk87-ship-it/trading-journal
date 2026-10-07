import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccount } from "@/lib/account";
import { accountCreateSchema } from "@/lib/validation";

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
  const parsed = accountCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  let user = await prisma.user.findFirst();
  if (!user) user = await prisma.user.create({ data: { name: "Trader" } });

  const account = await prisma.account.create({
    data: {
      userId: user.id,
      name: data.name,
      currency: data.currency,
      startingBalance: data.startingBalance ?? 10000,
      defaultRiskPct: data.defaultRiskPct ?? 1,
      defaultInstrument: data.defaultInstrument,
      defaultSession: data.defaultSession,
      commissionPerSide: data.commissionPerSide ?? 0,
      timezone: data.timezone,
      breakevenThreshold: data.breakevenThreshold ?? 0,
    },
  });
  return NextResponse.json(account, { status: 201 });
}
