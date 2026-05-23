import { bulkUpsertOrders, createOrder, listOrders } from "./orders.service.js";

export async function listOrdersController(_req, res, next) {
  try {
    const orders = await listOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

export async function bulkOrdersController(req, res, next) {
  try {
    const result = await bulkUpsertOrders(req.body.items);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createOrderController(req, res, next) {
  try {
    const order = await createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}
