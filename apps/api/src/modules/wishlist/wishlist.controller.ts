import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { MoveToCartDto } from './dto/move-to-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly svc: WishlistService) {}

  @Get()
  getWishlist(@CurrentUser() user: { userId: string }) {
    return this.svc.getWishlist(user.userId);
  }

  @Post('items')
  addToWishlist(@Body() dto: AddToWishlistDto, @CurrentUser() user: { userId: string }) {
    return this.svc.addToWishlist(dto, user.userId);
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  toggleWishlist(@Body() dto: AddToWishlistDto, @CurrentUser() user: { userId: string }) {
    return this.svc.toggleWishlist(dto, user.userId);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFromWishlist(@Param('itemId') itemId: string, @CurrentUser() user: { userId: string }) {
    return this.svc.removeFromWishlist(itemId, user.userId);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearWishlist(@CurrentUser() user: { userId: string }) {
    return this.svc.clearWishlist(user.userId);
  }

  @Post('move-to-cart')
  @HttpCode(HttpStatus.OK)
  moveToCart(
    @Body() dto: MoveToCartDto,
    @CurrentUser() user: { userId: string },
    @Req() req: Request,
  ) {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.svc.moveToCart(dto, user.userId, sessionId as string);
  }

  @Get('check')
  checkInWishlist(
    @Query('productId') productId: string,
    @Query('variantId') variantId: string | undefined,
    @CurrentUser() user: { userId: string },
  ) {
    return this.svc.isInWishlist(productId, variantId, user.userId);
  }
}
