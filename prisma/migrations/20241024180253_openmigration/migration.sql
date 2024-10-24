-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" DATETIME,
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false
);

-- CreateTable
CREATE TABLE "BillingSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "hour" INTEGER NOT NULL DEFAULT 10,
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DunningTracker" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "billingCycleIndex" INTEGER NOT NULL,
    "failureReason" TEXT NOT NULL,
    "completedAt" DATETIME,
    "completedReason" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingSchedule_shop_key" ON "BillingSchedule"("shop");

-- CreateIndex
CREATE INDEX "DunningTracker_completedAt_idx" ON "DunningTracker"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DunningTracker_shop_contractId_billingCycleIndex_failureReason_key" ON "DunningTracker"("shop", "contractId", "billingCycleIndex", "failureReason");
