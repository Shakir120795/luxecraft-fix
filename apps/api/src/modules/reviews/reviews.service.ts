import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProduct(productId: string, userId?: string) {
    return this.prisma.review.findMany({
      where: { productId, status: { in: ['APPROVED', 'PENDING'] } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productId: true,
        rating: true,
        title: true,
        content: true,
        isFeatured: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }).then((reviews) =>
      reviews.map(({ userId: reviewUserId, user: reviewer, ...review }) => ({
        ...review,
        customerName:
          [reviewer?.firstName, reviewer?.lastName].filter(Boolean).join(' ') || 'Customer',
        isMine: Boolean(userId && reviewUserId === userId),
      })),
    );
  }

  async create(userId: string, productId: string, rating: number, title?: string, content?: string) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5.');
    }

    const deliveredPurchase = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          paymentStatus: 'PAID',
          orderStatus: 'DELIVERED',
        },
      },
      select: { id: true },
    });

    if (!deliveredPurchase) {
      throw new BadRequestException(
        'You can review a product after its order has been delivered.',
      );
    }

    const existingReview = await this.prisma.review.findFirst({
      where: { userId, productId },
      select: { id: true, status: true },
    });

    if (existingReview) {
      throw new BadRequestException(
        'You have already submitted a review for this product.',
      );
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title: title?.trim() || null,
        content: content?.trim() || null,
        status: 'APPROVED',
      },
    });
  }
}
