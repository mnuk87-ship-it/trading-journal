-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "entryPrice" REAL NOT NULL,
    "stopLoss" REAL NOT NULL,
    "takeProfit" REAL,
    "exitPrice" REAL,
    "exitTime" TEXT,
    "positionSize" REAL NOT NULL,
    "riskPercent" REAL,
    "riskDollar" REAL,
    "initialRiskDollar" REAL,
    "potentialProfitDollar" REAL,
    "potentialRR" REAL,
    "realizedPnl" REAL,
    "realizedRR" REAL,
    "fees" REAL NOT NULL DEFAULT 0,
    "netPnl" REAL,
    "mfe" REAL,
    "mae" REAL,
    "idealRR" REAL,
    "strategyId" TEXT,
    "entryReason" TEXT,
    "marketCondition" TEXT,
    "trend" TEXT,
    "marketType" TEXT,
    "isAPlus" BOOLEAN NOT NULL DEFAULT false,
    "movedSL" BOOLEAN NOT NULL DEFAULT false,
    "tookPartial" BOOLEAN NOT NULL DEFAULT false,
    "partialPercent" REAL,
    "numPartials" INTEGER,
    "avgExitPrice" REAL,
    "followedPlan" BOOLEAN NOT NULL DEFAULT true,
    "revengeTrade" BOOLEAN NOT NULL DEFAULT false,
    "overtraded" BOOLEAN NOT NULL DEFAULT false,
    "accordingToSetup" BOOLEAN NOT NULL DEFAULT true,
    "emotionBefore" TEXT,
    "emotionAfter" TEXT,
    "confidence" INTEGER,
    "discipline" INTEGER,
    "patience" INTEGER,
    "stress" INTEGER,
    "notesSeen" TEXT,
    "notesGood" TEXT,
    "notesBad" TEXT,
    "notesNext" TEXT,
    "result" TEXT,
    "durationMinutes" INTEGER,
    "rsi15mCrossed" BOOLEAN NOT NULL DEFAULT false,
    "rsi15mDirection" TEXT,
    "rsi15mValue" REAL,
    "rsi15mZone" TEXT,
    "rsi15mCrossTime" TEXT,
    "rsi15mCandlesToEntry" INTEGER,
    "rsi5mCrossed" BOOLEAN NOT NULL DEFAULT false,
    "rsi5mDirection" TEXT,
    "rsi5mValue" REAL,
    "rsi5mZone" TEXT,
    "rsi5mCrossTime" TEXT,
    "rsi5mCandlesToEntry" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trade" ("accordingToSetup", "accountId", "avgExitPrice", "confidence", "createdAt", "date", "direction", "discipline", "durationMinutes", "emotionAfter", "emotionBefore", "entryPrice", "entryReason", "exitPrice", "exitTime", "fees", "followedPlan", "id", "idealRR", "initialRiskDollar", "instrument", "isAPlus", "mae", "marketCondition", "marketType", "mfe", "movedSL", "netPnl", "notesBad", "notesGood", "notesNext", "notesSeen", "numPartials", "overtraded", "partialPercent", "patience", "positionSize", "potentialProfitDollar", "potentialRR", "realizedPnl", "realizedRR", "result", "revengeTrade", "riskDollar", "riskPercent", "session", "stopLoss", "strategyId", "stress", "takeProfit", "time", "timeframe", "tookPartial", "trend", "updatedAt") SELECT "accordingToSetup", "accountId", "avgExitPrice", "confidence", "createdAt", "date", "direction", "discipline", "durationMinutes", "emotionAfter", "emotionBefore", "entryPrice", "entryReason", "exitPrice", "exitTime", "fees", "followedPlan", "id", "idealRR", "initialRiskDollar", "instrument", "isAPlus", "mae", "marketCondition", "marketType", "mfe", "movedSL", "netPnl", "notesBad", "notesGood", "notesNext", "notesSeen", "numPartials", "overtraded", "partialPercent", "patience", "positionSize", "potentialProfitDollar", "potentialRR", "realizedPnl", "realizedRR", "result", "revengeTrade", "riskDollar", "riskPercent", "session", "stopLoss", "strategyId", "stress", "takeProfit", "time", "timeframe", "tookPartial", "trend", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_accountId_date_idx" ON "Trade"("accountId", "date");
CREATE INDEX "Trade_accountId_instrument_idx" ON "Trade"("accountId", "instrument");
CREATE INDEX "Trade_accountId_session_idx" ON "Trade"("accountId", "session");
CREATE INDEX "Trade_accountId_strategyId_idx" ON "Trade"("accountId", "strategyId");
CREATE INDEX "Trade_accountId_result_idx" ON "Trade"("accountId", "result");
CREATE INDEX "Trade_accountId_rsi15mCrossed_idx" ON "Trade"("accountId", "rsi15mCrossed");
CREATE INDEX "Trade_accountId_rsi5mCrossed_idx" ON "Trade"("accountId", "rsi5mCrossed");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
