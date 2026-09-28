import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AdminJwtAuthGuard } from '../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRoles } from '../admin-auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../admin-auth/guards/admin-roles.guard';
import { AdminRole } from '@prisma/client';
import { UploadsService } from './uploads.service';

const ADMIN_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const CUSTOM_REQUEST_MAX_FILE_SIZE = 4 * 1024 * 1024;
const CUSTOM_REQUEST_MAX_FILES = 8;
const CUSTOM_UPLOAD_TMP = join(process.cwd(), 'uploads', '.tmp', 'custom-requests');

mkdirSync(CUSTOM_UPLOAD_TMP, { recursive: true });

@Controller('admin/uploads')
@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post('categories')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      limits: {
        fileSize: ADMIN_IMAGE_MAX_SIZE,
      },
    }),
  )
  async uploadCategoryImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.saveCategoryImage(file);
  }

  @AdminRoles(AdminRole.SUPER_ADMIN)
  @Post('hero')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined,
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadHeroImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadsService.saveHeroImage(file);
  }
  @AdminRoles(AdminRole.SUPER_ADMIN)
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

