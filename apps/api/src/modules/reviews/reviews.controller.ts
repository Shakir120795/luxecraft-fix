import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}
  @Get('products/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  list(@Param('productId') productId: string, @Req() req: any) {
    return this.reviews.listForProduct(productId, req.user?.id);
  }
  @Post('products/:productId') @UseGuards(JwtAuthGuard)
  create(@Param('productId') productId: string, @Body() body: { rating: number; title?: string; content?: string }, @CurrentUser() user: { id: string }) {
    return this.reviews.create(user.id, productId, body.rating, body.title, body.content);
  }
}
