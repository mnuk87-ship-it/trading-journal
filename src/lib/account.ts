import { prisma } from "@/lib/prisma";
import { CONFLUENCE_DEFS } from "@/lib/confluences";

const DEFAULT_STRATEGIES = [
  "Breakout",
  "Pullback",
  "Reversal",
  "Support / Resistance",
  "Range",
  "Trend continuation",
  "Liquidity sweep",
];

/** Zajistí, že existuje alespoň jeden uživatel a jeden účet. Vrací accountId. */
export async function ensureDefaultAccount(): Promise<string> {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { name: "Trader" } });
  }
  let account = await prisma.account.findFirst({ where: { userId: user.id } });
  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Hlavní účet",
        currency: "USD",
        startingBalance: 10000,
      },
    });
    await prisma.strategy.createMany({
      data: DEFAULT_STRATEGIES.map((name) => ({ accountId: account!.id, name })),
    });
  }
  return account.id;
}

/**
 * Zajistí, že v DB existují všechny fixní konfluence (FVG, BPR, OB, ...).
 * Konfluence jsou globální (nejsou vázané na účet) a nelze je přes UI
 * přidávat/mazat - je to fixní, uzavřený seznam definovaný v `src/lib/confluences.ts`.
 * Idempotentní - bezpečné volat opakovaně (upsert).
 */
export async function ensureDefaultConfluences(): Promise<void> {
  await Promise.all(
    CONFLUENCE_DEFS.map((c, index) =>
      prisma.confluence.upsert({
        where: { key: c.key },
        update: { label: c.label, order: index },
        create: { key: c.key, label: c.label, order: index },
      })
    )
  );
}
