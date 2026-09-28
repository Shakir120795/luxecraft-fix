-- Bind a verified crypto transaction to exactly one payment.
-- Existing payments start with NULL, so this is non-breaking for historical data.

ALTER TABLE "payments"
ADD COLUMN "cryptoTransactionHash" TEXT;

CREATE UNIQUE INDEX "payments_cryptoTransactionHash_key"
  ON "payments"("cryptoTransactionHash");
