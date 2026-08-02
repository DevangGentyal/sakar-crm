import { Request, Response, NextFunction } from "express";
import { sendError, sendSuccess } from "../utils/apiResponse";
import {
  assertAllowedImageType,
  preprocessLeadPhoto,
} from "../services/storage/image.service";
import { createStorageService } from "../services/storage/storage.service";
import { getPublicImageUrl } from "../services/storage/public-url";

const storageService = createStorageService();

export async function uploadLeadPhotoHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      sendError(res, "Photo file is required", { statusCode: 400, code: "PHOTO_REQUIRED" });
      return;
    }

    assertAllowedImageType(file.mimetype);
    const processed = await preprocessLeadPhoto(file.buffer);
    const path = await storageService.save({
      buffer: processed,
      contentType: "image/webp",
      fileName: file.originalname.replace(/\.[^.]+$/, ".webp"),
    });

    sendSuccess(
      res,
      { path, url: getPublicImageUrl(path) },
      { statusCode: 201, message: "Photo uploaded successfully" },
    );
  } catch (err) {
    next(err);
  }
}
