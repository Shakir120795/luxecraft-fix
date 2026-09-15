-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_items_category_idx" ON "faq_items"("category");

-- CreateIndex
CREATE INDEX "faq_items_isActive_idx" ON "faq_items"("isActive");

-- CreateIndex
CREATE INDEX "faq_items_sortOrder_idx" ON "faq_items"("sortOrder");
