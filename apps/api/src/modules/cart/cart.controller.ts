import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user?: { userId: string };
}

@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly svc: CartService) {}

  @Get()
  getCart(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.svc.getCart(userId, sessionId as string);
  }

  @Get('totals')
  getCartTotals(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.svc.calculateCartTotals(userId, sessionId as string);
  }

  @Post('items')
  addToCart(@Body() dto: AddToCartDto, @Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.svc.addToCart(dto, userId, sessionId as string);
  }

  @Patch('items/:itemId')
  updateCartItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.userId;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.svc.updateCartItem(itemId, dto, userId, sessionId as string);
  }

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCartItem(@Param('itemId') itemId: string, @Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.svc.removeCartItem(itemId, userId, sessionId as string);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearCart(@Req() req: RequestWithUser) {
    const userId = req.user?.userId;
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
    return this.svc.clearCart(userId, sessionId as string);
  }

  @Post('merge')
  @HttpCode(HttpStatus.OK)
  mergeGuestCart(@Req() req: RequestWithUser, @Body('guestSessionId') guestSessionId: string) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new Error('User must be authenticated to merge cart.');
    }
    return this.svc.mergeGuestCartIntoCustomerCart(userId, guestSessionId);
  }
}
