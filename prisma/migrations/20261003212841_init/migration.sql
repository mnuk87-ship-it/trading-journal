-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT 'Trader',
    "email" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'cs',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startingBalance" REAL NOT NULL DEFAULT 10000,
    "defaultRiskPct" REAL NOT NULL DEFAULT 1,
    "defaultInstrument" TEXT NOT NULL DEFAULT 'NQ',
    "defaultSession" TEXT NOT NULL DEFAULT 'New York',
    "commissionPerSide" REAL NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Prague',
    "breakevenThreshold" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Instrument_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Strategy_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeTag" (
    "tradeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("tradeId", "tagId"),
    CONSTRAINT "TradeTag_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Screenshot_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instrument_accountId_symbol_key" ON "Instrument"("accountId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Strategy_accountId_name_key" ON "Strategy"("accountId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_accountId_name_key" ON "Tag"("accountId", "name");

-- CreateIndex
CREATE INDEX "Trade_accountId_date_idx" ON "Trade"("accountId", "date");

-- CreateIndex
CREATE INDEX "Trade_accountId_instrument_idx" ON "Trade"("accountId", "instrument");

-- CreateIndex
CREATE INDEX "Trade_accountId_session_idx" ON "Trade"("accountId", "session");

-- CreateIndex
CREATE INDEX "Trade_accountId_strategyId_idx" ON "Trade"("accountId", "strategyId");

-- CreateIndex
CREATE INDEX "Trade_accountId_result_idx" ON "Trade"("accountId", "result");
