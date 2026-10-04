import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const account = await prisma.account.update({
    where: { id },
    data: {
      name: body.name,
      currency: body.currency,
      startingBalance: body.startingBalance !== undefined ? Number(body.startingBalance) : undefined,
      defaultRiskPct: body.defaultRiskPct !== undefined ? Number(body.defaultRiskPct) : undefined,
      defaultInstrument: body.defaultInstrument,
      defaultSession: body.defaultSession,
      commissionPerSide: body.commissionPerSide !== undefined ? Number(body.commissionPerSide) : undefined,
      timezone: body.timezone,
      breakevenThreshold: body.breakevenThreshold !== undefined ? Number(body.breakevenThreshold) : undefined,
    },
  });
  return NextResponse.json(account);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
