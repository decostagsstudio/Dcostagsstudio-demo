import { getAllProducts, replaceProducts } from "./products.repository.js";

export async function listProducts() {
  return getAllProducts();
}

export async function bulkUpsertProducts(products) {
  return replaceProducts(products);
}
