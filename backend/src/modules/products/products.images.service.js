import { Readable } from "node:stream";
import { cloudinary } from "../../config/cloudinary.js";
import { env } from "../../config/env.js";

function buildPublicId(file, index) {
  const baseName = String(file.originalname || `product-${index + 1}`)
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return `${baseName || "product"}-${Date.now()}-${index + 1}`;
}

function uploadBuffer(file, index) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinary.folder,
        public_id: buildPublicId(file, index),
        resource_type: "image",
        format: "webp",
        transformation: [
          { quality: "auto", fetch_format: "webp" },
          { width: 1800, crop: "limit" },
        ],
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    Readable.from(file.buffer).pipe(stream);
  });
}

export async function uploadProductImages(files = []) {
  if (!env.cloudinary.enabled) {
    const error = new Error("Cloudinary is not configured.");
    error.statusCode = 503;
    throw error;
  }

  if (!files.length) {
    const error = new Error("No image files received.");
    error.statusCode = 400;
    throw error;
  }

  return Promise.all(files.map((file, index) => uploadBuffer(file, index)));
}
