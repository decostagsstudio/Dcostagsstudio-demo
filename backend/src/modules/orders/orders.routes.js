import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { ordersBulkSchema } from "./orders.schema.js";
import { bulkOrdersController, listOrdersController } from "./orders.controller.js";

export const ordersRouter = Router();

ordersRouter.get("/", listOrdersController);
ordersRouter.put(
  "/",
  requireAuth,
  requireRole("director", "gerencia"),
  validate(ordersBulkSchema),
  bulkOrdersController,
);
