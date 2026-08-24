import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import throttlerConfig from './config/throttler.config';

// Infrastructure
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { QueueModule } from './modules/queue/queue.module';

// Phase 2 — Auth & Security
import { UsersModule } from './modules/users/users.module';
import { OtpModule } from './modules/otp/otp.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminAuthModule } from './modules/admin-auth/admin-auth.module';

// Phase 3 — Catalog & Inventory
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StorefrontModule } from './modules/storefront/storefront.module';

// Phase 4 — Cart & Wishlist
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';

// Phase 5 — Checkout, Payments, Shipping & Orders
import { AddressesModule } from './modules/addresses/addresses.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { TaxModule } from './modules/tax/tax.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CheckoutModule } from './modules/checkout/checkout.module';

// Phase 6 — Luxury Custom Design Engine
import { CustomRequestsModule } from './modules/custom-requests/custom-requests.module';
import { CustomMessagesModule } from './modules/custom-messages/custom-messages.module';
import { CustomQuotesModule } from './modules/custom-quotes/custom-quotes.module';
import { CustomDesignsModule } from './modules/custom-designs/custom-designs.module';

// Phase 7 — Admin Management
import { AdminDashboardModule } from './modules/admin-dashboard/admin-dashboard.module';
import { AdminCustomersModule } from './modules/admin-customers/admin-customers.module';
import { AdminOrdersModule } from './modules/admin-orders/admin-orders.module';
import { AdminCustomOrdersModule } from './modules/admin-custom-orders/admin-custom-orders.module';
import { AdminPaymentsModule } from './modules/admin-payments/admin-payments.module';
import { AdminInventoryModule } from './modules/admin-inventory/admin-inventory.module';
import { AdminCmsModule } from './modules/admin-cms/admin-cms.module';
import { AdminCouponsModule } from './modules/admin-coupons/admin-coupons.module';
import { AdminReviewsModule } from './modules/admin-reviews/admin-reviews.module';
import { AdminNotificationsModule } from './modules/admin-notifications/admin-notifications.module';

// Phase 8 — Analytics & SEO
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SeoModule } from './modules/seo/seo.module';

// Feature
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // ----- Config -------------------------------------------
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, throttlerConfig],
      envFilePath: ['.env', '../../.env'],
    }),

    // ----- Rate limiting (global) ---------------------------
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 60 s window (in ms for v6)
        limit: 100,
      },
    ]),

    // ----- Infrastructure -----------------------------------
    PrismaModule,
    RedisModule,
    QueueModule,

    // ----- Phase 2 — Auth & Security -----------------------
    UsersModule,
    OtpModule,
    AuditModule,
    AuthModule,
    AdminAuthModule,

    // ----- Phase 3 — Catalog & Inventory -------------------
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    StorefrontModule,

    // ----- Phase 4 — Cart & Wishlist -----------------------
    CartModule,
    WishlistModule,

    // ----- Phase 5 — Checkout, Payments, Shipping & Orders -
    AddressesModule,
    ShippingModule,
    TaxModule,
    OrdersModule,
    PaymentsModule,
    CheckoutModule,

    // ----- Phase 6 — Luxury Custom Design Engine -----------
    CustomRequestsModule,
    CustomMessagesModule,
    CustomQuotesModule,
    CustomDesignsModule,

    // ----- Phase 7 — Admin Management ---------------------
    AdminDashboardModule,
    AdminCustomersModule,
    AdminOrdersModule,
    AdminCustomOrdersModule,
    AdminPaymentsModule,
    AdminInventoryModule,
    AdminCmsModule,
    AdminCouponsModule,
    AdminReviewsModule,
    AdminNotificationsModule,

    // ----- Phase 8 — Analytics & SEO ----------------------
    AnalyticsModule,
    SeoModule,

    // ----- Feature modules ----------------------------------
    HealthModule,
  ],
  providers: [
    // Apply ThrottlerGuard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
