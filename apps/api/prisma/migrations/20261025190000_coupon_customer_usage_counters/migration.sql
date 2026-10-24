CREATE TABLE "coupon_customer_usages" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "userId" TEXT,
  "guestEmail" TEXT,
  "reservedCount" INTEGER NOT NULL DEFAULT 0,
  "usedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "coupon_customer_usages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupon_customer_usages_couponId_userId_key"
  ON "coupon_customer_usages"("couponId", "userId");
CREATE UNIQUE INDEX "coupon_customer_usages_couponId_guestEmail_key"
  ON "coupon_customer_usages"("couponId", "guestEmail");
CREATE INDEX "coupon_customer_usages_couponId_idx"
  ON "coupon_customer_usages"("couponId");

ALTER TABLE "coupon_customer_usages"
  ADD CONSTRAINT "coupon_customer_usages_couponId_fkey"
  FOREIGN KEY ("couponId") REFERENCES "coupons"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Backfill already recorded reservations/redemptions before enforcing per-customer caps.
INSERT INTO "coupon_customer_usages"
  ("id", "couponId", "userId", "guestEmail", "reservedCount", "usedCount", "createdAt", "updatedAt")
SELECT
  'legacy_' || md5(o."couponId" || ':user:' || o."userId"),
  o."couponId",
  o."userId",
  NULL,
  COUNT(*) FILTER (WHERE o."couponUsageStatus" = 'RESERVED')::INTEGER,
  COUNT(*) FILTER (WHERE o."couponUsageStatus" = 'USED')::INTEGER,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "orders" o
WHERE o."couponId" IS NOT NULL
  AND o."userId" IS NOT NULL
  AND o."couponUsageStatus" IN ('RESERVED', 'USED')
GROUP BY o."couponId", o."userId";

INSERT INTO "coupon_customer_usages"
  ("id", "couponId", "userId", "guestEmail", "reservedCount", "usedCount", "createdAt", "updatedAt")
SELECT
  'legacy_' || md5(o."couponId" || ':email:' || LOWER(BTRIM(o."guestEmail"))),
  o."couponId",
  NULL,
  LOWER(BTRIM(o."guestEmail")),
  COUNT(*) FILTER (WHERE o."couponUsageStatus" = 'RESERVED')::INTEGER,
  COUNT(*) FILTER (WHERE o."couponUsageStatus" = 'USED')::INTEGER,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "orders" o
WHERE o."couponId" IS NOT NULL
  AND o."userId" IS NULL
  AND NULLIF(BTRIM(o."guestEmail"), '') IS NOT NULL
  AND o."couponUsageStatus" IN ('RESERVED', 'USED')
GROUP BY o."couponId", LOWER(BTRIM(o."guestEmail"));
