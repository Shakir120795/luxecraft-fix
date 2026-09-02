import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { UploadsService } from './uploads.service';

@Controller('admin/uploads')
@UseGuards(AdminJwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('products')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadProductImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.saveProductImage(file);
  }
}
