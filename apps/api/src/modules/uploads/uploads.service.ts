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

  async saveProductImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Image size must be 10 MB or smaller.',
      );
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

      // Public URL of the API server.
      // For local development this is localhost:3001.
      // On production, set PUBLIC_API_URL to the real API URL.
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

      throw new InternalServerErrorException(
        'Failed to save image.',
      );
    }
  }
}