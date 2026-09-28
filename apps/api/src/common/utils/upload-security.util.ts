import * as crypto from 'crypto';

const IMAGE_MIME_BY_EXTENSION: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export function detectImageMime(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString('ascii');
    if (header === 'GIF87a' || header === 'GIF89a') return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
    (buffer.subarray(8, 12).toString('ascii') === 'avif' ||
      buffer.subarray(8, 12).toString('ascii') === 'avis')
  ) {
    return 'image/avif';
  }
  return null;
}

export function validateUploadedFileSignature(
  extension: string,
  declaredMime: string,
  header: Buffer,
): boolean {
  const normalizedExtension = extension.toLowerCase();
  const normalizedMime = declaredMime.toLowerCase();

  const expectedImageMime = IMAGE_MIME_BY_EXTENSION[normalizedExtension];
  if (expectedImageMime) {
    return normalizedMime === expectedImageMime && detectImageMime(header) === expectedImageMime;
  }

  if (normalizedExtension === '.pdf') {
    return normalizedMime === 'application/pdf' && header.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  if (normalizedExtension === '.doc' || normalizedExtension === '.xls') {
    const isOle = header.length >= 8 &&
      header.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
    return normalizedMime === (
      normalizedExtension === '.doc'
        ? 'application/msword'
        : 'application/vnd.ms-excel'
    ) && isOle;
  }

  if (normalizedExtension === '.docx' || normalizedExtension === '.xlsx') {
    const isZip = header.length >= 4 &&
      header.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    return normalizedMime === (
      normalizedExtension === '.docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) && isZip;
  }

  if (normalizedExtension === '.txt') {
    if (normalizedMime !== 'text/plain') return false;
    return !header.includes(0);
  }

  return false;
}

export function getMimeTypeForExtension(extension: string): string {
  const normalized = extension.toLowerCase();
  return IMAGE_MIME_BY_EXTENSION[normalized] || ({
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
  } as Record<string, string>)[normalized] || 'application/octet-stream';
}

function getSigningSecret(): string {
  const secret = process.env.PRIVATE_FILE_SIGNING_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error('PRIVATE_FILE_SIGNING_SECRET or JWT_SECRET is required.');
  return secret;
}

export function createPrivateFileSignature(
  customRequestId: string,
  filename: string,
  expiresAt: number,
): string {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(`${customRequestId}|${filename}|${expiresAt}`, 'utf8')
    .digest('hex');
}

export function verifyPrivateFileSignature(
  customRequestId: string,
  filename: string,
  expiresAt: number,
  signature: string,
): boolean {
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;

  const expected = createPrivateFileSignature(customRequestId, filename, expiresAt);
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}
