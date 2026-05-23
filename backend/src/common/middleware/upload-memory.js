import multer from "multer";
import { env } from "../../config/env.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const productImagesUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Math.max(1, env.imageUploadMaxMb) * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Only JPG, PNG and WEBP product images are allowed.");
      error.statusCode = 400;
      callback(error);
      return;
    }

    callback(null, true);
  },
});
