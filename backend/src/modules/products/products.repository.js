import { db } from "../../config/database.js";

function mapProductRow(row) {
  return {
    id: row.id,
    reference: row.reference || "",
    name: row.name,
    category: row.category,
    categoryLabel: row.category_label || "",
    price: Number(row.price),
    color: row.color || "",
    stock: row.stock || "Disponible",
    image: row.image || "",
    images: row.images || [],
    description: row.description || "",
    sizes: row.sizes || [],
    sizeStock: row.size_stock || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllProducts() {
  const result = await db.query(
    `SELECT * FROM products ORDER BY created_at DESC`,
  );
  return result.rows.map(mapProductRow);
}

export async function replaceProducts(products) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM products");
    for (const p of products) {
      await client.query(
        `INSERT INTO products
          (id, reference, name, category, category_label, price, color, stock, image, images, description, sizes, size_stock)
         VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          p.id,
          p.reference || "",
          p.name,
          p.category,
          p.categoryLabel || "",
          p.price,
          p.color || "",
          p.stock || "Disponible",
          p.image || "",
          p.images || [],
          p.description || "",
          p.sizes || [],
          p.sizeStock || {},
        ],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return getAllProducts();
}
