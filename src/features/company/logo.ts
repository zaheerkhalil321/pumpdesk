/** Logo rules shared by the form (quick checks) and the server (the real checks). */

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp';

export type LogoType = { mime: 'image/png' | 'image/jpeg' | 'image/webp'; extension: 'png' | 'jpg' | 'webp' };

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, i) => bytes[offset + i] === value);

/**
 * The real type of an image, read from its first bytes. The file name and the browser's
 * claimed type are ignored, so a renamed SVG, HTML or script file is rejected.
 */
export function detectLogoType(bytes: Uint8Array): LogoType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', extension: 'png' };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', extension: 'jpg' };
  // WebP is "RIFF", four size bytes, then "WEBP".
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: 'image/webp', extension: 'webp' };
  }
  return null;
}
