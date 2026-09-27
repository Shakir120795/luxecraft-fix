-- Add ADMIN role for granular authorization.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'AdminRole'
      AND e.enumlabel = 'ADMIN'
  ) THEN
    ALTER TYPE "AdminRole" ADD VALUE 'ADMIN';
  END IF;
END $$;

-- Store one-time two-factor login challenges hashed at rest.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'AdminTwoFactorChallengeKind'
  ) THEN
    CREATE TYPE "AdminTwoFactorChallengeKind" AS ENUM ('LOGIN', 'SETUP');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "admin_two_factor_challenges" (
  "id" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "kind" "AdminTwoFactorChallengeKind" NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_two_factor_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_two_factor_challenges_tokenHash_key"
  ON "admin_two_factor_challenges"("tokenHash");
CREATE INDEX IF NOT EXISTS "admin_two_factor_challenges_adminId_idx"
  ON "admin_two_factor_challenges"("adminId");
CREATE INDEX IF NOT EXISTS "admin_two_factor_challenges_expiresAt_idx"
  ON "admin_two_factor_challenges"("expiresAt");
CREATE INDEX IF NOT EXISTS "admin_two_factor_challenges_kind_idx"
  ON "admin_two_factor_challenges"("kind");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'admin_two_factor_challenges_adminId_fkey'
  ) THEN
    ALTER TABLE "admin_two_factor_challenges"
      ADD CONSTRAINT "admin_two_factor_challenges_adminId_fkey"
      FOREIGN KEY ("adminId") REFERENCES "admin_users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
