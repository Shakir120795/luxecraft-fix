import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProduct(productId: string) {
    return this.prisma.review.findMany({ where: { productId, status: 'APPROVED' }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, productId: string, rating: number, title?: string, content?: string) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5.');
    const purchased = await this.prisma.orderItem.findFirst({
      where: { productId, order: { userId, paymentStatus: 'PAID' } }, select: { id: true },
    });
    if (!purchased) throw new BadRequestException('Only verified purchasers can review this product.');
    return this.prisma.review.create({ data: { userId, productId, rating, title, content, status: 'PENDING' } });
  }
}
