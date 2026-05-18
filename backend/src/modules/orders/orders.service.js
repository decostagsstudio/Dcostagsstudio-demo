import { getAllOrders, replaceOrders } from "./orders.repository.js";

export async function listOrders() {
  return getAllOrders();
}

export async function bulkUpsertOrders(items) {
  return replaceOrders(items);
}
