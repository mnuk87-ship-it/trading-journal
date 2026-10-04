import { z } from "zod";

export const tradeSchema = z.object({
  accountId: z.string().min(1),
  instrument: z.string().min(1, "Instrument je povinný"),
  direction: z.enum(["LONG", "SHORT"]),
  date: z.string().min(1, "Datum je povinné"),
  time: z.string().min(1, "Čas je povinný"),
  session: z.enum(["Asia", "London", "New York", "Other"]),
  timeframe: z.enum(["1m", "5m", "15m", "30m", "1H", "4H", "Daily"]),

  entryPrice: z.number({ error: "Entry musí být číslo" }).finite(),
  stopLoss: z.number({ error: "Stop Loss musí být číslo" }).finite(),
  takeProfit: z.number().finite().nullable().optional(),
  exitPrice: z.number().finite().nullable().optional(),
  exitTime: z.string().nullable().optional(),
  positionSize: z.number().positive("Position Size musí být kladné číslo"),
  fees: z.number().finite().optional().default(0),
  mfe: z.number().finite().nullable().optional(),
  mae: z.number().finite().nullable().optional(),

  strategyId: z.string().nullable().optional(),
  entryReason: z.string().nullable().optional(),
  marketCondition: z.string().nullable().optional(),
  trend: z.enum(["Bullish", "Bearish", "Neutral"]).nullable().optional(),
  marketType: z.enum(["Trend", "Range", "Choppy"]).nullable().optional(),
  isAPlus: z.boolean().optional().default(false),

  movedSL: z.boolean().optional().default(false),
  tookPartial: z.boolean().optional().default(false),
  partialPercent: z.number().min(0).max(100).nullable().optional(),
  numPartials: z.number().int().min(0).nullable().optional(),
  avgExitPrice: z.number().nullable().optional(),
  followedPlan: z.boolean().optional().default(true),
  revengeTrade: z.boolean().optional().default(false),
  overtraded: z.boolean().optional().default(false),
  accordingToSetup: z.boolean().optional().default(true),

  emotionBefore: z
    .enum(["Calm", "Confident", "Fear", "FOMO", "Greedy", "Angry", "Revenge", "Uncertain"])
    .nullable()
    .optional(),
  emotionAfter: z
    .enum(["Calm", "Confident", "Fear", "FOMO", "Greedy", "Angry", "Revenge", "Uncertain"])
    .nullable()
    .optional(),
  confidence: z.number().int().min(1).max(10).nullable().optional(),
  discipline: z.number().int().min(1).max(10).nullable().optional(),
  patience: z.number().int().min(1).max(10).nullable().optional(),
  stress: z.number().int().min(1).max(10).nullable().optional(),
  notesSeen: z.string().nullable().optional(),
  notesGood: z.string().nullable().optional(),
  notesBad: z.string().nullable().optional(),
  notesNext: z.string().nullable().optional(),

  tags: z.array(z.string()).optional().default([]),
  // Analytický atribut obchodu - validace membership proti fixnímu seznamu
  // (CONFLUENCE_KEYS) se provádí přes sanitizeConfluenceKeys() v API route,
  // zde jen zajistíme tvar pole stringů.
  confluences: z.array(z.string()).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.stopLoss === data.entryPrice) {
    ctx.addIssue({ code: "custom", message: "Stop Loss nesmí být stejný jako Entry", path: ["stopLoss"] });
  }
  if (data.direction === "LONG" && data.stopLoss > data.entryPrice) {
    ctx.addIssue({ code: "custom", message: "U LONG obchodu musí být SL pod Entry", path: ["stopLoss"] });
  }
  if (data.direction === "SHORT" && data.stopLoss < data.entryPrice) {
    ctx.addIssue({ code: "custom", message: "U SHORT obchodu musí být SL nad Entry", path: ["stopLoss"] });
  }
});

export type TradeInput = z.infer<typeof tradeSchema>;
