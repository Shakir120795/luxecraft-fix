import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, open, rename, rm, stat, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  createPrivateFileSignature,
  getMimeTypeForExtension,
  validateUploadedFileSignature,
  verifyPrivateFileSignature,
} from '../../common/utils/upload-security.util';

const MAX_ADMIN_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_CUSTOM_REQUEST_FILE_SIZE = 4 * 1024 * 1024;
const PRIVATE_FILE_URL_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class UploadsService {
  private readonly uploadRoot = resolve(process.cwd(), 'uploads');
  private readonly productsRoot = join(this.uploadRoot, 'products');
  private readonly categoriesRoot = join(this.uploadRoot, 'categories');
  private readonly heroRoot = join(this.uploadRoot, 'hero');
  private readonly customRequestsRoot = join(this.uploadRoot, 'custom-requests-private');

  private publicApiUrl(): string {
    return (
      process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, '') ||
      process.env.APP_URL?.trim().replace(/\/+$/, '') ||
      `http://localhost:${process.env.API_PORT ?? 3001}`
    );
  }

  private async validateImageFile(file: Express.Multer.File): Promise<string> {
    if (!file?.buffer) throw new BadRequestException('Image file is required.');
    if (file.size > MAX_ADMIN_IMAGE_SIZE) {
      throw new BadRequestException('Image size must be 5 MB or smaller.');
    }

    const extension = extname(file.originalname).toLowerCase();
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException(
        'Unsupported image format. Use JPG, PNG, WEBP, GIF or AVIF.',
      );
    }

    const header = file.buffer.subarray(0, 64);
    if (!validateUploadedFileSignature(extension, file.mimetype, header)) {
      throw new BadRequestException(
        'The uploaded image content does not match its declared file type.',
      );
    }

    return extension;
  }

  private async readHeader(filePath: string, length = 64): Promise<Buffer> {
    const handle = await open(filePath, 'r');
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  private async cleanupTempFiles(files: Express.Multer.File[]): Promise<void> {
    await Promise.all(
      (files ?? []).map(async (file) => {
        if (file.path) await rm(file.path, { force: true }).catch(() => undefined);
      }),
    );
  }

  async saveHeroImage(file: Express.Multer.File) {
    const extension = await this.validateImageFile(file);

    try {
      await mkdir(this.heroRoot, { recursive: true });
      const filename = `${randomUUID()}${extension}`;
      await writeFile(join(this.heroRoot, filename), file.buffer);

      return {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `${this.publicApiUrl()}/uploads/hero/${filename}`,
        storageKey: `hero/${filename}`,
      };
    } catch {
      throw new BadRequestException('Failed to save hero image.');
    }
  }

  async saveProductImage(file: Express.Multer.File) {
    const extension = await this.validateImageFile(file);

    try {
      await mkdir(this.productsRoot, { recursive: true });
      const filename = `${randomUUID()}${extension}`;
      await writeFile(join(this.productsRoot, filename), file.buffer);

      const url = `${this.publicApiUrl()}/uploads/products/${filename}`;

      return {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        storageKey: `products/${filename}`,
      };
    } catch {
      throw new InternalServerErrorException('Failed to save image.');
    }
  }

  async saveCategoryImage(file: Express.Multer.File) {
    const extension = await this.validateImageFile(file);

    try {
      await mkdir(this.categoriesRoot, { recursive: true });
      const filename = `${randomUUID()}${extension}`;
      await writeFile(join(this.categoriesRoot, filename), file.buffer);

      return {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `${this.publicApiUrl()}/uploads/categories/${filename}`,
        storageKey: `categories/${filename}`,
      };
    } catch {
      throw new InternalServerErrorException('Failed to save category image.');
    }
  }

  async saveCustomRequestFiles(
    customRequestId: string,
    files: Express.Multer.File[],
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one file is required.');
    }

    if (files.length > 8) {
      await this.cleanupTempFiles(files);
      throw new BadRequestException('You can upload a maximum of 8 files.');
    }

    const allowed = new Map([
      ['.jpg', 'image/jpeg'],
      ['.jpeg', 'image/jpeg'],
      ['.png', 'image/png'],
      ['.webp', 'image/webp'],
      ['.gif', 'image/gif'],
      ['.avif', 'image/avif'],
      ['.pdf', 'application/pdf'],
      ['.doc', 'application/msword'],
      ['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ['.xls', 'application/vnd.ms-excel'],
      ['.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      ['.txt', 'text/plain'],
    ]);

    try {
      for (const file of files) {
        if (!file.path) throw new BadRequestException('Invalid upload stream.');
        if (file.size > MAX_CUSTOM_REQUEST_FILE_SIZE) {
          throw new BadRequestException(
            `File ${file.originalname} exceeds the 4 MB limit.`,
          );
        }

        const extension = extname(file.originalname).toLowerCase();
        const expectedMime = allowed.get(extension);
        if (!expectedMime || file.mimetype !== expectedMime) {
          throw new BadRequestException(
            `Unsupported file type: ${file.originalname}`,
          );
        }

        const header = await this.readHeader(file.path);
        if (!validateUploadedFileSignature(extension, file.mimetype, header)) {
          throw new BadRequestException(
            `The uploaded file content does not match its declared type: ${file.originalname}`,
          );
        }
      }

      const safeRequestId = customRequestId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safeRequestId) throw new BadRequestException('Invalid custom request ID.');

      const requestRoot = join(this.customRequestsRoot, safeRequestId);
      await mkdir(requestRoot, { recursive: true });

      const saved = [];

      for (const file of files) {
        const filename = basename(file.filename || `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
        const destination = join(requestRoot, filename);

        await rename(file.path!, destination);

        const expiresAt = Math.floor(Date.now() / 1000) + PRIVATE_FILE_URL_TTL_SECONDS;
        const signature = createPrivateFileSignature(safeRequestId, filename, expiresAt);
        const url = `${this.publicApiUrl()}/api/v1/custom-requests/${encodeURIComponent(safeRequestId)}/files/${encodeURIComponent(filename)}?expires=${expiresAt}&signature=${signature}`;

        saved.push({
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url,
          storageKey: `custom-requests-private/${safeRequestId}/${filename}`,
        });
      }

      return saved;
    } catch (error) {
      await this.cleanupTempFiles(files);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to save files.');
    }
  }

  async openPrivateCustomRequestFile(
    customRequestId: string,
    filename: string,
    expiresAt: number,
    signature: string,
  ): Promise<{ stream: NodeJS.ReadableStream; mimeType: string; filename: string }> {
    const safeRequestId = customRequestId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFilename = basename(filename);
    if (!safeRequestId || safeFilename !== filename) {
      throw new NotFoundException('File not found.');
    }

    if (
      !verifyPrivateFileSignature(
        safeRequestId,
        safeFilename,
        expiresAt,
        signature,
      )
    ) {
      throw new NotFoundException('File not found.');
    }

    const filePath = join(this.customRequestsRoot, safeRequestId, safeFilename);

    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) throw new Error('Not a file');
      return {
        stream: createReadStream(filePath),
        mimeType: getMimeTypeForExtension(extname(safeFilename)),
        filename: safeFilename,
      };
    } catch {
      throw new NotFoundException('File not found.');
    }
  }
}
