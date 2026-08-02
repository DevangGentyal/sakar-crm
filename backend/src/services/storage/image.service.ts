import sharp from "sharp";
import { AppError } from "../../utils/appError";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export function assertAllowedImageType(mimeType: string): void {
  if (!ALLOWED_TYPES.has(mimeType)) {
    throw new AppError(
      "Only JPG, JPEG, PNG, and WEBP files are allowed.",
      {
        statusCode: 400,
        code: "FILE_TYPE_NOT_ALLOWED",
      },
    );
  }
}

export async function preprocessLeadPhoto(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(512, 512, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 82 })
    .toBuffer();
}
