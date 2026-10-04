-- CreateTable
CREATE TABLE "Confluence" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TradeConfluence" (
    "tradeId" TEXT NOT NULL,
    "confluenceKey" TEXT NOT NULL,

    PRIMARY KEY ("tradeId", "confluenceKey"),
    CONSTRAINT "TradeConfluence_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeConfluence_confluenceKey_fkey" FOREIGN KEY ("confluenceKey") REFERENCES "Confluence" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);
