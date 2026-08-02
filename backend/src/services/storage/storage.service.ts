import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { env } from "../../config/env";
import { UPLOADS_ROOT } from "../../config/paths";
import { AppError } from "../../utils/appError";

export type UploadInput = {
  buffer: Buffer;
  contentType: string;
  fileName: string;
};

export interface StorageProvider {
  save(input: UploadInput): Promise<string>;
  delete?(url: string): Promise<void>;
}

export class StorageService {
  constructor(private readonly provider: StorageProvider) {}

  async save(input: UploadInput): Promise<string> {
    return this.provider.save(input);
  }
}

export class LocalStorageProvider implements StorageProvider {
  async save(input: UploadInput): Promise<string> {
    const uploadsDir = path.join(UPLOADS_ROOT, "leads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const extension = path.extname(input.fileName) || ".jpg";
    const fileName = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, input.buffer);
    return `/uploads/leads/${fileName}`;
  }
}

export class S3StorageProvider implements StorageProvider {
  async save(_input: UploadInput): Promise<string> {
    throw new AppError(
      "S3 storage provider is not enabled in this build.",
      {
        statusCode: 501,
        code: "STORAGE_ERROR",
      },
    );
  }
}

export function createStorageService(): StorageService {
  const provider =
    env.STORAGE_PROVIDER === "s3"
      ? new S3StorageProvider()
      : new LocalStorageProvider();
  return new StorageService(provider);
}
