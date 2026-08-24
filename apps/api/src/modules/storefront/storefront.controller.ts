import { Controller, Get, Param, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service';

@Controller('storefront')
export class StorefrontController {
  constructor(private readonly svc: StorefrontService) {}

  // ── Categories ─────────────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.svc.getCategories();
  }

  @Get('categories/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.svc.getCategoryBySlug(slug);
  }

  // ── Products ───────────────────────────────────────────────────

  @Get('products')
  getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.svc.getProducts({
      categoryId,
      isFeatured: isFeatured === 'true' ? true : undefined,
      search,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('products/:slug')
  getProductBySlug(@Param('slug') slug: string) {
    return this.svc.getProductBySlug(slug);
  }

  @Get('featured')
  getFeaturedProducts(@Query('take') take?: string) {
    return this.svc.getFeaturedProducts(take ? parseInt(take, 10) : undefined);
  }
}
