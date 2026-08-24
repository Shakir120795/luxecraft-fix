import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  AdminProductsController,
  PublicProductsController,
} from './products.controller';

@Module({
  controllers: [AdminProductsController, PublicProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
