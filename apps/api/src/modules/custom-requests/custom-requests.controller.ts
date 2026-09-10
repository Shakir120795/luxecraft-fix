import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CustomRequestsService } from './custom-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CustomMessagesService } from '../custom-messages/custom-messages.service';
import { UploadsService } from '../uploads/uploads.service';
import { SenderType } from '@prisma/client';

@Controller('custom-requests')
export class CustomRequestsController {
  constructor(
    private readonly svc: CustomRequestsService,
    private readonly messages: CustomMessagesService,
    private readonly uploads: UploadsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() data: any) {
    return this.svc.create({ userId: user.id, ...data });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: { id: string }) {
    return this.svc.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.svc.findOneForUser(id, user.id);
  }

  @Post(':id/files')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 8, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadFiles(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: { id: string },
  ) {
    await this.svc.findOneForUser(id, user.id);
    return this.uploads.saveCustomRequestFiles(id, files);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  async createMessage(
    @Param('id') id: string,
    @Body('message') message: string,
    @Body('attachments') attachments: string[] | undefined,
    @CurrentUser() user: { id: string },
  ) {
    await this.svc.findOneForUser(id, user.id);
    return this.messages.create({
      customRequestId: id,
      senderId: user.id,
      senderType: SenderType.CUSTOMER,
      message: message?.trim() || 'Reference files attached.',
      attachments: Array.isArray(attachments) ? attachments : [],
    });
  }
}
