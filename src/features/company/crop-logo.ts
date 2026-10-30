/** What the crop box picked, in pixels of the original image. */
export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The saved logo is never bigger than this on a side: plenty for a sidebar badge or a printed header. */
const MAX_SIDE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read that image'));
    image.src = src;
  });
}

/**
 * Cuts the chosen square out of the image (after any rotation) and returns it as a PNG.
 * Parts of the square that fall outside the picture stay transparent, so a wide logo can be
 * zoomed out and padded.
 */
export async function cropLogo(src: string, crop: PixelCrop, rotation: number): Promise<Blob> {
  const image = await loadImage(src);
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  // The box that holds the picture once it is turned.
  const boxWidth = image.width * cos + image.height * sin;
  const boxHeight = image.width * sin + image.height * cos;

  const turned = document.createElement('canvas');
  turned.width = boxWidth;
  turned.height = boxHeight;
  const turnedContext = turned.getContext('2d');
  if (!turnedContext) throw new Error('Could not edit that image');
  turnedContext.translate(boxWidth / 2, boxHeight / 2);
  turnedContext.rotate(radians);
  turnedContext.drawImage(image, -image.width / 2, -image.height / 2);

  const side = Math.min(MAX_SIDE, Math.round(crop.width));
  const output = document.createElement('canvas');
  output.width = side;
  output.height = side;
  const outputContext = output.getContext('2d');
  if (!outputContext) throw new Error('Could not edit that image');
  outputContext.imageSmoothingQuality = 'high';
  outputContext.drawImage(turned, crop.x, crop.y, crop.width, crop.height, 0, 0, side, side);

  return new Promise((resolve, reject) => {
    output.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not save that image'))), 'image/png');
  });
}

/**
 * Reads the file as a picture the crop box can show. Returns null when the browser cannot open it
 * as one, which is what a renamed text file or script looks like.
 */
export async function readImage(file: File): Promise<string | null> {
  const src = await new Promise<string | null>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
  if (!src) return null;
  try {
    await loadImage(src);
    return src;
  } catch {
    return null;
  }
}

/** The biggest picture we will open to crop. It is shrunk before saving, so this can be generous. */
export const LOGO_SOURCE_MAX_BYTES = 15 * 1024 * 1024;
