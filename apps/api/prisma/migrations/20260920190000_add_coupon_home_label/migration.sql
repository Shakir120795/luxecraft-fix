ALTER TABLE "coupons"
  ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "coupons_show_on_home_idx"
  ON "coupons" ("showOnHome");