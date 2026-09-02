import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomRequestsService } from '../custom-requests/custom-requests.service';
import { CustomDesignsService } from './custom-designs.service';

/** Customer approval/revision actions for a design preview. */
@Controller('custom-designs')
@UseGuards(JwtAuthGuard)
export class CustomDesignsController {
  constructor(
    private readonly designs: CustomDesignsService,
    private readonly requests: CustomRequestsService,
  ) {}

  @Post(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    await this.assertOwner(id, user.id);
    return this.designs.approve(id, user.id);
  }

  @Post(':id/request-revision')
  async requestRevision(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    await this.assertOwner(id, user.id);
    return this.designs.requestRevision(id, reason);
  }

  private async assertOwner(designId: string, userId: string) {
    const design = await this.designs.findOne(designId);
    await this.requests.findOneForUser(design.customRequestId, userId);
  }
}
