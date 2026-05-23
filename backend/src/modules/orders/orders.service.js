import { getAllOrders, insertOrder, replaceOrders } from "./orders.repository.js";
import { notifyOrderCreated } from "./orders.notifications.service.js";

export async function listOrders() {
  return getAllOrders();
}

export async function bulkUpsertOrders(items) {
  return replaceOrders(items);
}

export async function createOrder(order) {
  const id = order.id || `DC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created = await insertOrder({
    ...order,
    id,
    status: order.status || "Pendiente",
  });
  await notifyOrderCreated(created);
  return created;
}
