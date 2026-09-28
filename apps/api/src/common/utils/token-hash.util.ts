import * as crypto from 'crypto';

export function hashOpaqueToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function hashOtpCode(
  secret: string,
  email: string,
  purpose: string,
  code: string,
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${email.toLowerCase().trim()}|${purpose}|${code}`, 'utf8')
    .digest('hex');
}

export function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) {
    return false;
  }
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
