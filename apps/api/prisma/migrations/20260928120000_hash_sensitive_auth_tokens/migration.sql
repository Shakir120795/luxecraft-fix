-- Hash high-entropy refresh/password-reset tokens at rest while preserving
-- existing active sessions/reset links. OTP codes are invalidated so no
-- plaintext OTP survives the migration; users can request a fresh code.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Customer refresh tokens
ALTER TABLE "sessions" ADD COLUMN "refreshTokenHash" TEXT;
UPDATE "sessions"
SET "refreshTokenHash" = encode(digest("refreshToken", 'sha256'), 'hex')
WHERE "refreshTokenHash" IS NULL;
ALTER TABLE "sessions" ALTER COLUMN "refreshTokenHash" SET NOT NULL;

CREATE UNIQUE INDEX "sessions_refreshTokenHash_key"
  ON "sessions"("refreshTokenHash");
CREATE INDEX "sessions_refreshTokenHash_idx"
  ON "sessions"("refreshTokenHash");

DROP INDEX IF EXISTS "sessions_refreshToken_key";
DROP INDEX IF EXISTS "sessions_refreshToken_idx";
ALTER TABLE "sessions" DROP COLUMN "refreshToken";

-- Admin refresh tokens
ALTER TABLE "admin_sessions" ADD COLUMN "refreshTokenHash" TEXT;
UPDATE "admin_sessions"
SET "refreshTokenHash" = encode(digest("refreshToken", 'sha256'), 'hex')
WHERE "refreshTokenHash" IS NULL;
ALTER TABLE "admin_sessions" ALTER COLUMN "refreshTokenHash" SET NOT NULL;

CREATE UNIQUE INDEX "admin_sessions_refreshTokenHash_key"
  ON "admin_sessions"("refreshTokenHash");
CREATE INDEX "admin_sessions_refreshTokenHash_idx"
  ON "admin_sessions"("refreshTokenHash");

DROP INDEX IF EXISTS "admin_sessions_refreshToken_key";
DROP INDEX IF EXISTS "admin_sessions_refreshToken_idx";
ALTER TABLE "admin_sessions" DROP COLUMN "refreshToken";

-- Password reset tokens
ALTER TABLE "password_reset_tokens" ADD COLUMN "tokenHash" TEXT;
UPDATE "password_reset_tokens"
SET "tokenHash" = encode(digest("token", 'sha256'), 'hex')
WHERE "tokenHash" IS NULL;
ALTER TABLE "password_reset_tokens" ALTER COLUMN "tokenHash" SET NOT NULL;

CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key"
  ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_tokenHash_idx"
  ON "password_reset_tokens"("tokenHash");

DROP INDEX IF EXISTS "password_reset_tokens_token_key";
DROP INDEX IF EXISTS "password_reset_tokens_token_idx";
ALTER TABLE "password_reset_tokens" DROP COLUMN "token";

-- OTP codes: invalidate existing plaintext codes before removing the column.
DELETE FROM "otp_codes";

ALTER TABLE "otp_codes" ADD COLUMN "codeHash" TEXT;
ALTER TABLE "otp_codes" ALTER COLUMN "codeHash" SET NOT NULL;
ALTER TABLE "otp_codes" DROP COLUMN "code";
