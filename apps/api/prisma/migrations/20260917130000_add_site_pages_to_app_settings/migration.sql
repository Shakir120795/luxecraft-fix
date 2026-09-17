-- Store admin-editable storefront page overrides without changing existing page content.
ALTER TABLE "app_settings"
ADD COLUMN "sitePages" JSONB;
