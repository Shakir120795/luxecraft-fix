import { Controller, Get, Param, Query } from '@nestjs/common';

import { StorefrontService } from './storefront.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly svc: StorefrontService) {}

  @Get('hero')
  getHero() {
    return this.svc.getHero();
  }

  // Categories
  @Get('categories')
  getCategories() {
    return this.svc.getCategories();
  }

  @Get('categories/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.svc.getCategoryBySlug(slug);
  }

  // Product Filters
  @Get('pages/product-filters')
  getProductFilters() {
    return this.svc.getProductFilters();
  }

  // Homepage Videos
  @Get('pages/homepage-videos')
  getHomepageVideos() {
    return this.svc.getHomepageVideos();
  }

  // Products
  @Get('sitemap')
  getSitemapData() {
    return this.svc.getSitemapData();
  }

  @Get('products')
  getProducts(@Query() query: Record<string, string>) {
    const page = query.page ? Math.max(Number.parseInt(query.page, 10), 1) : 1;
    const take = query.take
      ? Math.min(Math.max(Number.parseInt(query.take, 10), 1), 48)
      : 12;
    const skip = query.skip
      ? Math.max(Number.parseInt(query.skip, 10), 0)
      : (page - 1) * take;

    const filters = Object.fromEntries(
      Object.entries(query)
        .filter(([key, value]) => key.startsWith('filter_') && Boolean(value))
        .map(([key, value]) => [key.slice('filter_'.length), value.trim().toLowerCase()]),
    );

    const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : undefined;
    const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;
    const sort =
      query.sort === 'price-low' ||
      query.sort === 'price-high' ||
      query.sort === 'newest' ||
      query.sort === 'featured'
        ? query.sort
        : 'featured';

    return this.svc.getProducts({
      categoryId: query.categoryId,
      isFeatured: query.isFeatured === 'true' ? true : undefined,
      search: query.search?.trim() || undefined,
      skip,
      take,
      minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
      sort,
      filters,
    });
  }

  @Get('products/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.svc.getProductBySlug(slug);
  }

  @Get('featured')
  getFeaturedProducts(@Query('take') take?: string) {
    return this.svc.getFeaturedProducts(
      take ? parseInt(take, 10) : undefined,
    );
  }
}