-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "badge" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "minPriceCents" INTEGER NOT NULL DEFAULT 0,
    "ratingAvg" REAL NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("badge", "category", "createdAt", "description", "featured", "id", "name", "slug", "tagline", "updatedAt") SELECT "badge", "category", "createdAt", "description", "featured", "id", "name", "slug", "tagline", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_featured_idx" ON "Product"("featured");
CREATE INDEX "Product_minPriceCents_idx" ON "Product"("minPriceCents");
CREATE INDEX "Product_ratingAvg_idx" ON "Product"("ratingAvg");
CREATE INDEX "Product_ratingCount_idx" ON "Product"("ratingCount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
