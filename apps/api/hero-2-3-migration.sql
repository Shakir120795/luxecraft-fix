-- AlterTable
ALTER TABLE "hero_sections" ADD COLUMN     "hero2ImageUrl" TEXT,
ADD COLUMN     "hero2Link" TEXT,
ADD COLUMN     "hero2ProductId" TEXT,
ADD COLUMN     "hero2Title" TEXT,
ADD COLUMN     "hero3ImageUrl" TEXT,
ADD COLUMN     "hero3Link" TEXT,
ADD COLUMN     "hero3ProductId" TEXT,
ADD COLUMN     "hero3Title" TEXT;

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_sections_hero2ProductId_idx" ON "hero_sections"("hero2ProductId");

-- CreateIndex
CREATE INDEX "hero_sections_hero3ProductId_idx" ON "hero_sections"("hero3ProductId");

-- AddForeignKey
ALTER TABLE "hero_sections" ADD CONSTRAINT "hero_sections_hero2ProductId_fkey" FOREIGN KEY ("hero2ProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_sections" ADD CONSTRAINT "hero_sections_hero3ProductId_fkey" FOREIGN KEY ("hero3ProductId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
