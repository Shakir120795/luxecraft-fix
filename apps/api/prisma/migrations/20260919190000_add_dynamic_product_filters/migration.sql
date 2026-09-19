ALTER TABLE "app_settings"
ADD COLUMN "productFilters" JSONB;

ALTER TABLE "products"
ADD COLUMN "filterData" JSONB;

CREATE INDEX "products_filter_data_gin_idx"
ON "products" USING GIN ("filterData");
