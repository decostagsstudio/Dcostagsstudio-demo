import fs from "fs/promises";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import { db } from "../config/database.js";
import { replaceProducts } from "../modules/products/products.repository.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORY_LABELS = {
  men: "Hombre",
  women: "Mujer",
  wallets: "Carteras",
  bags: "Bolsos",
};

function makeSizeStock(product) {
  if (product.sizeStock && typeof product.sizeStock === "object") {
    return product.sizeStock;
  }

  const units = String(product.stock || "").toLowerCase().includes("pocas") ? 2 : 8;
  return (Array.isArray(product.sizes) ? product.sizes : []).reduce((acc, size) => {
    acc[String(size)] = units;
    return acc;
  }, {});
}

async function loadCatalog() {
  const catalogPath = path.resolve(__dirname, "../../../data/catalog.js");
  const source = await fs.readFile(catalogPath, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: catalogPath });
  const productsByCategory = sandbox.window.DCOSTA_PRODUCTS_BY_CATEGORY || {};

  return Object.entries(productsByCategory).flatMap(([category, items]) =>
    items.map((product, index) => ({
      ...product,
      id: product.id || `${category}-${index + 1}`,
      reference: product.reference || product.id || `${category}-${index + 1}`,
      category,
      categoryLabel: product.categoryLabel || CATEGORY_LABELS[category] || category,
      price: Number(product.price || 0),
      images: Array.isArray(product.images) ? product.images : [product.image].filter(Boolean),
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      sizeStock: makeSizeStock(product),
    })),
  );
}

async function run() {
  const products = await loadCatalog();
  const saved = await replaceProducts(products);
  console.log(`Catalog seeded: ${saved.length} products`);
}

run()
  .then(async () => {
    await db.end();
  })
  .catch(async (error) => {
    console.error(error);
    await db.end();
    process.exit(1);
  });
