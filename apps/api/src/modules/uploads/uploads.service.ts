import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UploadsService {
  private readonly uploadRoot = resolve(process.cwd(), 'uploads');
  private readonly productsRoot = join(this.uploadRoot, 'products');
  private readonly categoriesRoot = join(this.uploadRoot, 'categories');
  private readonly heroRoot = join(this.uploadRoot, 'hero');

  async saveHeroImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image size must be 10 MB or smaller.');
    }

    try {
      await mkdir(this.heroRoot, { recursive: true });

      const extension = extname(file.originalname).toLowerCase();
      const filename = `${randomUUID()}${extension}`;
      const destination = join(this.heroRoot, filename);

      await writeFile(destination, file.buffer);

      const publicApiUrl =
        process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, '') ||
        `http://localhost:${process.env.API_PORT ?? 3001}`;

      return {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `${publicApiUrl}/uploads/hero/${filename}`,
        storageKey: `hero/${filename}`,
      };
    } catch (error) {
      throw new BadRequestException('Failed to save hero image.');
    }
  }
  async saveProductImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image size must be 10 MB or smaller.');
    }

    const extension = extname(file.originalname).toLowerCase();

    const allowedExtensions = new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.gif',
      '.avif',
    ]);

    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException(
        'Unsupported image format. Use JPG, PNG, WEBP, GIF or AVIF.',
      );
    }

    try {
      await mkdir(this.productsRoot, { recursive: true });

      const filename = `${randomUUID()}${extension}`;
      const destination = join(this.productsRoot, filename);

      await writeFile(destination, file.buffer);

      const publicApiUrl =
        process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, '') ||
        `http://localhost:${process.env.API_PORT ?? 3001}`;

      const url = `${publicApiUrl}/uploads/products/${filename}`;

      return {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        storageKey: `products/${filename}`,
      };
    } catch (error) {
      console.error('Failed to save product image:', error);

      throw new InternalServerErrorException('Failed to save image.');
    }
  }

  async saveCategoryImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image size must be 10 MB or smaller.');
    }

    const extension = extname(file.originalname).toLowerCase();
    const allowedExtensions = new Set([
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.gif',
      '.avif',
    ]);

    if (!allowedExtensions.has(extension)) {
      throw new BadRequestException(
        'Unsupported image format. Use JPG, PNG, WEBP, GIF or AVIF.',
      );
    }

    try {
      await mkdir(this.categoriesRoot, { recursive: true });

      const filename = `${randomUUID()}${extension}`;
      const destination = join(this.categoriesRoot, filename);

      await writeFile(destination, file.buffer);

      const publicApiUrl =
        process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, '') ||
        `http://localhost:${process.env.API_PORT ?? 3001}`;

      return {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: `${publicApiUrl}/uploads/categories/${filename}`,
        storageKey: `categories/${filename}`,
      };
    } catch (error) {
      console.error('Failed to save category image:', error);
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

    const maxSize = 10 * 1024 * 1024;
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

    for (const file of files) {
      const extension = extname(file.originalname).toLowerCase();
      const expectedMime = allowed.get(extension);

      if (!expectedMime || file.mimetype !== expectedMime) {
        throw new BadRequestException(
          `Unsupported file type: ${file.originalname}`,
        );
      }

      if (file.size > maxSize) {
        throw new BadRequestException(
          `File ${file.originalname} exceeds the 10 MB limit.`,
        );
      }
    }

    try {
      const safeRequestId = customRequestId.replace(/[^a-zA-Z0-9_-]/g, '');
      const requestRoot = join(this.uploadRoot, 'custom-requests', safeRequestId);
      await mkdir(requestRoot, { recursive: true });

      const publicApiUrl =
        process.env.PUBLIC_API_URL?.trim().replace(/\/+$/, '') ||
        `http://localhost:${process.env.API_PORT ?? 3001}`;

      const saved = [];

      for (const file of files) {
        const extension = extname(file.originalname).toLowerCase();
        const filename = `${randomUUID()}${extension}`;
        const destination = join(requestRoot, filename);

        await writeFile(destination, file.buffer);

        saved.push({
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: `${publicApiUrl}/uploads/custom-requests/${safeRequestId}/${filename}`,
          storageKey: `custom-requests/${safeRequestId}/${filename}`,
        });
      }

      return saved;
    } catch (error) {
      console.error('Failed to save custom request files:', error);
      throw new InternalServerErrorException('Failed to save files.');
    }
  }
}



