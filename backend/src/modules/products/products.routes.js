import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { bulkProductsSchema } from "./products.schema.js";
import { bulkProductsController, listProductsController } from "./products.controller.js";

export const productsRouter = Router();

productsRouter.get("/", listProductsController);
productsRouter.put(
  "/bulk",
  requireAuth,
  requireRole("director", "gerencia"),
  validate(bulkProductsSchema),
  bulkProductsController,
);
