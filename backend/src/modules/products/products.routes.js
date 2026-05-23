import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import { productImagesUpload } from "../../common/middleware/upload-memory.js";
import { validate } from "../../common/middleware/validate.js";
import { productsBulkSchema } from "./products.schema.js";
import { bulkProductsController, listProductsController, uploadProductImagesController } from "./products.controller.js";

export const productsRouter = Router();

productsRouter.get("/", listProductsController);
productsRouter.post(
  "/images",
  requireAuth,
  requireRole("director", "gerencia"),
  productImagesUpload.array("images", 8),
  uploadProductImagesController,
);
productsRouter.put(
  "/bulk",
  requireAuth,
  requireRole("director", "gerencia"),
  validate(productsBulkSchema),
  bulkProductsController,
);
