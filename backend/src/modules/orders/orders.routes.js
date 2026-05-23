import { Router } from "express";
import { requireAuth, requireRole } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { orderCreateSchema, ordersBulkSchema } from "./orders.schema.js";
import { bulkOrdersController, createOrderController, listOrdersController } from "./orders.controller.js";

export const ordersRouter = Router();

ordersRouter.get("/", requireAuth, requireRole("director", "gerencia"), listOrdersController);
ordersRouter.post("/", validate(orderCreateSchema), createOrderController);
ordersRouter.put(
  "/",
  requireAuth,
  requireRole("director", "gerencia"),
  validate(ordersBulkSchema),
  bulkOrdersController,
);
