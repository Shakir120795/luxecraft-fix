import { Module } from '@nestjs/common';
import { AdminReviewsService } from './admin-reviews.service';

@Module({
  providers: [AdminReviewsService],
  exports: [AdminReviewsService],
})
export class AdminReviewsModule {}
