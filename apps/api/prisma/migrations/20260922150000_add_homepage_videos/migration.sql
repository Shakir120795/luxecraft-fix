-- Add admin-managed homepage videos to app settings.
ALTER TABLE "app_settings"
ADD COLUMN "homepageVideos" JSONB;
