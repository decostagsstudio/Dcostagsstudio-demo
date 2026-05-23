import { getAllOrders, insertOrder, replaceOrders } from "./orders.repository.js";

export async function listOrders() {
  return getAllOrders();
}

export async function bulkUpsertOrders(items) {
  return replaceOrders(items);
}

export async function createOrder(order) {
  const id = order.id || `DC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return insertOrder({
    ...order,
    id,
    status: order.status || "Pendiente",
  });
}
