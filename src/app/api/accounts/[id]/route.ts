import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { accountUpdateSchema } from "@/lib/validation";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = accountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Neplatná data", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;
  const account = await prisma.account.update({
    where: { id },
    data: {
      name: data.name,
      currency: data.currency,
      startingBalance: data.startingBalance,
      defaultRiskPct: data.defaultRiskPct,
      defaultInstrument: data.defaultInstrument,
      defaultSession: data.defaultSession,
      commissionPerSide: data.commissionPerSide,
      timezone: data.timezone,
      breakevenThreshold: data.breakevenThreshold,
    },
  });
  return NextResponse.json(account);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
