import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Get,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Throttle,
} from '@nestjs/common';
import { Response } from 'express';
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

  @Get(':id/files/:filename')
  async downloadFile(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() res: Response,
  ) {
    const file = await this.uploads.openPrivateCustomRequestFile(
      id,
      filename,
      Number(expires),
      signature,
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=60, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    file.stream.pipe(res);
  }

  @Post(':id/files')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', CUSTOM_REQUEST_MAX_FILES, {
      storage: diskStorage({
        destination: (_req, _file, callback) => callback(null, CUSTOM_UPLOAD_TMP),
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: {
        fileSize: CUSTOM_REQUEST_MAX_FILE_SIZE,
        files: CUSTOM_REQUEST_MAX_FILES,
        parts: CUSTOM_REQUEST_MAX_FILES,
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
