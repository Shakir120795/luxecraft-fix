-- AlterTable
ALTER TABLE "products" ADD COLUMN "careInstructions" TEXT,
ADD COLUMN "collection" TEXT,
ADD COLUMN "color" TEXT,
ADD COLUMN "deliveryInfo" TEXT,
ADD COLUMN "material" TEXT,
ADD COLUMN "origin" TEXT,
ADD COLUMN "productNote" TEXT,
ADD COLUMN "returnsInfo" TEXT,
ADD COLUMN "shippingInfo" TEXT,
ADD COLUMN "style" TEXT,
ADD COLUMN "taxrate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "orderId" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_sections" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "imageUrl" TEXT,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "primaryCtaText" TEXT,
    "primaryCtaLink" TEXT,
    "secondaryCtaText" TEXT,
    "secondaryCtaLink" TEXT,
    "hero2ProductId" TEXT,
    "hero2ImageUrl" TEXT,
    "hero2Title" TEXT,
    "hero2Link" TEXT,
    "hero3ProductId" TEXT,
    "hero3ImageUrl" TEXT,
    "hero3Title" TEXT,
    "hero3Link" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hero_sections_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_messages_userId_idx" ON "contact_messages"("userId");
CREATE INDEX "contact_messages_email_idx" ON "contact_messages"("email");
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");
CREATE INDEX "contact_messages_createdAt_idx" ON "contact_messages"("createdAt");

CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "webhook_events"("eventId");
CREATE INDEX "webhook_events_provider_idx" ON "webhook_events"("provider");
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");
CREATE INDEX "webhook_events_eventId_idx" ON "webhook_events"("eventId");
CREATE INDEX "webhook_events_paymentIntentId_idx" ON "webhook_events"("paymentIntentId");
CREATE INDEX "webhook_events_orderId_idx" ON "webhook_events"("orderId");
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

CREATE INDEX "hero_sections_productId_idx" ON "hero_sections"("productId");
CREATE INDEX "hero_sections_hero2ProductId_idx" ON "hero_sections"("hero2ProductId");
CREATE INDEX "hero_sections_hero3ProductId_idx" ON "hero_sections"("hero3ProductId");
CREATE INDEX "hero_sections_isActive_idx" ON "hero_sections"("isActive");

CREATE INDEX "faq_items_category_idx" ON "faq_items"("category");
CREATE INDEX "faq_items_isActive_idx" ON "faq_items"("isActive");
CREATE INDEX "faq_items_sortOrder_idx" ON "faq_items"("sortOrder");

-- AddForeignKey
ALTER TABLE "contact_messages"
ADD CONSTRAINT "contact_messages_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hero_sections"
ADD CONSTRAINT "hero_sections_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hero_sections"
ADD CONSTRAINT "hero_sections_hero2ProductId_fkey"
FOREIGN KEY ("hero2ProductId") REFERENCES "products"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hero_sections"
ADD CONSTRAINT "hero_sections_hero3ProductId_fkey"
FOREIGN KEY ("hero3ProductId") REFERENCES "products"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
