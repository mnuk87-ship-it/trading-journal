import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDefaultAccount } from "@/lib/account";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId") ?? (await ensureDefaultAccount());
  const strategies = await prisma.strategy.findMany({
    where: { accountId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(strategies);
}

export async function POST(req: Request) {
  const body = await req.json();
  const accountId = body.accountId ?? (await ensureDefaultAccount());
  const strategy = await prisma.strategy.create({
    data: {
      accountId,
      name: body.name,
      description: body.description ?? null,
      isCustom: true,
    },
  });
  return NextResponse.json(strategy, { status: 201 });
}
