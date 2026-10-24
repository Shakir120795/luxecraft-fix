ALTER TABLE "custom_requests"
  ADD COLUMN "submissionKey" TEXT;

CREATE UNIQUE INDEX "custom_requests_submissionKey_key"
  ON "custom_requests"("submissionKey");
