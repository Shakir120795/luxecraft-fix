ALTER TABLE "coupons"
  ADD COLUMN "reservedCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "orders"
  ADD COLUMN "couponId" TEXT,
  ADD COLUMN "couponUsageStatus" TEXT;

CREATE INDEX "orders_couponId_idx" ON "orders"("couponId");

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "coupons"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
