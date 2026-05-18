import { bulkUpsertProducts, listProducts } from "./products.service.js";

export async function listProductsController(_req, res, next) {
  try {
    const products = await listProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function bulkProductsController(req, res, next) {
  try {
    const result = await bulkUpsertProducts(req.body.products);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
