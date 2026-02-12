-- CreateTable
CREATE TABLE "PostPurchaseOffer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shop" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "variantId" TEXT NOT NULL DEFAULT '',
    "discountPercent" INTEGER NOT NULL DEFAULT 10,
    "sellingPlanId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PostPurchaseOffer_shop_key" ON "PostPurchaseOffer"("shop");
