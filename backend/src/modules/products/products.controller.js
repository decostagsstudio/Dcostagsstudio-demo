import { bulkUpsertProducts, listProducts } from "./products.service.js";
import { uploadProductImages } from "./products.images.service.js";

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

export async function uploadProductImagesController(req, res, next) {
  try {
    const uploaded = await uploadProductImages(req.files || []);
    res.status(201).json({
      images: uploaded,
      urls: uploaded.map((image) => image.url),
    });
  } catch (error) {
    next(error);
  }
}
