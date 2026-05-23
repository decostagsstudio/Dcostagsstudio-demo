import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const PRODUCT_CSV_HEADERS = [
  "id",
  "reference",
  "name",
  "category",
  "categoryLabel",
  "price",
  "salePrice",
  "isFeatured",
  "isActive",
  "stock",
  "color",
  "material",
  "fit",
  "badge",
  "care",
  "sizes",
  "sizeStock",
  "image",
  "image_url",
  "images",
  "description",
];

const CATEGORY_LABELS = {
  women: "Mujer",
  men: "Hombre",
  wallets: "Carteras",
  bags: "Bolsos",
};

let productsBulkSchema = null;
let schemaLoadWarning = "";
try {
  ({ productsBulkSchema } = await import("../backend/src/modules/products/products.schema.js"));
} catch (error) {
  schemaLoadWarning = `Backend schema validation skipped: ${error?.message || error}`;
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && inQuotes && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  out.push(current);
  return out;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cols[index] ?? ""]));
  });

  return { headers, rows };
}

function parseBooleanInput(value, fallback = false) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return fallback;
  return ["1", "true", "si", "sí", "yes", "y"].includes(text);
}

function parseImagesInput(value) {
  return String(value || "").split(/[\n|]+/).map((item) => item.trim()).filter(Boolean);
}

function parseSizeStockInput(value, rowNumber, errors) {
  const text = String(value || "").trim();
  if (!text) return {};

  const out = {};
  const tokens = text.split(/[\n,|]+/).map((item) => item.trim()).filter(Boolean);
  tokens.forEach((token) => {
    const [rawSize, rawQty, ...rest] = token.split(":").map((item) => String(item || "").trim());
    if (!rawSize || rawQty === "" || rest.length) {
      errors.push(`Row ${rowNumber}: sizeStock "${token}" must use SIZE:QTY format.`);
      return;
    }

    const qty = Number(rawQty);
    if (!Number.isInteger(qty) || qty < 0) {
      errors.push(`Row ${rowNumber}: sizeStock "${token}" must use a non-negative integer quantity.`);
      return;
    }

    out[rawSize] = qty;
  });

  return out;
}

function isUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function normalizeProduct(row, index, errors, warnings) {
  const rowNumber = index + 2;
  const category = String(row.category || "women").trim();
  const sizes = String(row.sizes || "").split("|").map((item) => item.trim()).filter(Boolean);
  const sizeStock = parseSizeStockInput(String(row.sizeStock || "").replaceAll("|", ","), rowNumber, errors);
  const image = String(row.image_url || row.image || "").trim();
  const images = parseImagesInput(row.images || "");

  if (row.image && row.image_url) {
    warnings.push(`Row ${rowNumber}: image_url is set and will override image.`);
  }

  return {
    id: String(row.id || `imp-${Date.now()}-${index}`).trim(),
    reference: String(row.reference || "").trim(),
    name: String(row.name || `Producto ${index + 1}`).trim(),
    category,
    categoryLabel: String(row.categoryLabel || CATEGORY_LABELS[category] || category).trim(),
    price: Math.max(0, Number(row.price) || 0),
    salePrice: row.salePrice ? Math.max(0, Number(row.salePrice) || 0) : null,
    isFeatured: parseBooleanInput(row.isFeatured, false),
    isActive: parseBooleanInput(row.isActive, true),
    stock: String(row.stock || "Disponible").trim(),
    color: String(row.color || "").trim(),
    material: String(row.material || "").trim(),
    fit: String(row.fit || "").trim(),
    badge: String(row.badge || "").trim(),
    care: String(row.care || "").trim(),
    sizes,
    sizeStock,
    image,
    images,
    description: String(row.description || "").trim(),
  };
}

function validateHeaders(headers, errors, warnings) {
  if (!headers.length) {
    errors.push("CSV is empty.");
    return;
  }

  const headerSet = new Set(headers);
  PRODUCT_CSV_HEADERS.forEach((header) => {
    if (!headerSet.has(header)) errors.push(`Missing column: ${header}`);
  });

  headers.forEach((header) => {
    if (!PRODUCT_CSV_HEADERS.includes(header)) warnings.push(`Unknown column ignored by admin import: ${header}`);
  });
}

function validateProductRules(product, index, errors, warnings) {
  const rowNumber = index + 2;
  const requiredText = ["id", "name", "category", "categoryLabel", "stock"];
  requiredText.forEach((field) => {
    if (!String(product[field] || "").trim()) errors.push(`Row ${rowNumber}: ${field} is required.`);
  });

  if (!CATEGORY_LABELS[product.category]) {
    errors.push(`Row ${rowNumber}: category must be one of ${Object.keys(CATEGORY_LABELS).join(", ")}.`);
  }

  if (product.price <= 0) {
    errors.push(`Row ${rowNumber}: price must be greater than 0.`);
  }

  if (product.salePrice !== null && product.salePrice > product.price) {
    errors.push(`Row ${rowNumber}: salePrice must be empty or lower/equal than price.`);
  }

  if (!product.sizes.length) {
    errors.push(`Row ${rowNumber}: sizes is required.`);
  }

  if (!Object.keys(product.sizeStock).length) {
    errors.push(`Row ${rowNumber}: sizeStock is required.`);
  }

  product.sizes.forEach((size) => {
    if (!Object.prototype.hasOwnProperty.call(product.sizeStock, size)) {
      errors.push(`Row ${rowNumber}: size "${size}" is missing from sizeStock.`);
    }
  });

  Object.keys(product.sizeStock).forEach((size) => {
    if (!product.sizes.includes(size)) {
      errors.push(`Row ${rowNumber}: sizeStock has "${size}" but sizes does not.`);
    }
  });

  if (!product.image) {
    errors.push(`Row ${rowNumber}: image or image_url is required.`);
  } else if (!isUrl(product.image)) {
    errors.push(`Row ${rowNumber}: main image must be an http/https URL.`);
  }

  product.images.forEach((imageUrl) => {
    if (!isUrl(imageUrl)) errors.push(`Row ${rowNumber}: gallery image must be an http/https URL: ${imageUrl}`);
  });

  if (product.isActive === false) {
    warnings.push(`Row ${rowNumber}: product is inactive and should stay hidden in storefront.`);
  }
}

function validateUniqueProducts(products, errors) {
  const byId = new Map();
  const byReference = new Map();

  products.forEach((product, index) => {
    const rowNumber = index + 2;
    if (byId.has(product.id)) {
      errors.push(`Row ${rowNumber}: duplicate id also used on row ${byId.get(product.id)}.`);
    } else {
      byId.set(product.id, rowNumber);
    }

    if (product.reference) {
      if (byReference.has(product.reference)) {
        errors.push(`Row ${rowNumber}: duplicate reference also used on row ${byReference.get(product.reference)}.`);
      } else {
        byReference.set(product.reference, rowNumber);
      }
    }
  });
}

async function run() {
  const inputArg = process.argv[2] || "data/products-import-template.csv";
  const inputPath = path.resolve(rootDir, inputArg);
  const text = await fs.readFile(inputPath, "utf8");
  const { headers, rows } = parseCsv(text);
  const errors = [];
  const warnings = [];

  validateHeaders(headers, errors, warnings);

  if (errors.length) {
    console.error(`Product import validation failed for ${path.relative(rootDir, inputPath)}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  if (!rows.length) {
    console.log(`OK: ${path.relative(rootDir, inputPath)} has a valid header and no products yet.`);
    return;
  }

  const products = rows.map((row, index) => normalizeProduct(row, index, errors, warnings));
  products.forEach((product, index) => validateProductRules(product, index, errors, warnings));
  validateUniqueProducts(products, errors);

  if (productsBulkSchema) {
    const schemaResult = productsBulkSchema.safeParse({ products });
    if (!schemaResult.success) {
      schemaResult.error.issues.forEach((issue) => {
        errors.push(`Schema: ${issue.path.join(".")} ${issue.message}`);
      });
    }
  } else if (schemaLoadWarning) {
    warnings.push(schemaLoadWarning);
  }

  if (errors.length) {
    console.error(`Product import validation failed for ${path.relative(rootDir, inputPath)}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  const activeCount = products.filter((product) => product.isActive !== false).length;
  const imageCount = products.filter((product) => product.image).length;
  const galleryImageCount = products.reduce((sum, product) => sum + product.images.length, 0);
  const totalUnits = products.reduce(
    (sum, product) => sum + Object.values(product.sizeStock).reduce((stockSum, qty) => stockSum + qty, 0),
    0,
  );

  console.log(`OK: ${products.length} products valid in ${path.relative(rootDir, inputPath)}.`);
  console.log(`Visibility: ${activeCount} active, ${products.length - activeCount} inactive.`);
  console.log(`Images: ${imageCount} main URLs, ${galleryImageCount} gallery URLs. URL syntax checked only.`);
  console.log(`Stock: ${totalUnits} units across ${products.reduce((sum, product) => sum + product.sizes.length, 0)} size entries.`);

  if (warnings.length) {
    console.log("Warnings:");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }
}

run().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
