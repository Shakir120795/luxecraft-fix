-- Attach an idempotent custom-design order to the accepted quote that created it.
ALTER TABLE "orders" ADD COLUMN "customQuoteId" TEXT;

CREATE UNIQUE INDEX "orders_customQuoteId_key"
  ON "orders"("customQuoteId");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_customQuoteId_fkey"
  FOREIGN KEY ("customQuoteId") REFERENCES "custom_quotes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
