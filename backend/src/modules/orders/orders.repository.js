import { db } from "../../config/database.js";

function mapOrderRow(row) {
  return {
    id: row.id,
    customer: row.customer || "",
    email: row.email || "",
    phone: row.phone || "",
    dni: row.dni || "",
    status: row.status,
    statusDetail: row.status_detail || "",
    notes: row.notes || "",
    assignedTo: row.assigned_to || "",
    total: Number(row.total),
    createdAt: row.created_at,
    items: row.items || [],
    statusHistory: row.status_history || [],
  };
}

export async function getAllOrders() {
  const result = await db.query(
    `SELECT * FROM orders ORDER BY created_at DESC`,
  );
  return result.rows.map(mapOrderRow);
}

export async function insertOrder(order) {
  const result = await db.query(
    `INSERT INTO orders
     (id, customer, email, phone, dni, status, status_detail, notes, assigned_to, total, created_at, items, status_history)
     VALUES
     ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      order.id,
      order.customer || "",
      order.email || "",
      order.phone || "",
      order.dni || "",
      order.status || "Pendiente",
      order.statusDetail || "",
      order.notes || "",
      order.assignedTo || null,
      order.total,
      order.createdAt ? new Date(order.createdAt) : new Date(),
      JSON.stringify(order.items || []),
      JSON.stringify(order.statusHistory || []),
    ],
  );
  return mapOrderRow(result.rows[0]);
}

export async function replaceOrders(orders) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM orders");
    for (const o of orders) {
      await client.query(
        `INSERT INTO orders
         (id, customer, email, phone, dni, status, status_detail, notes, assigned_to, total, created_at, items, status_history)
         VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          o.id,
          o.customer || "",
          o.email || "",
          o.phone || "",
          o.dni || "",
          o.status || "pending",
          o.statusDetail || "",
          o.notes || "",
          o.assignedTo || null,
          o.total,
          o.createdAt ? new Date(o.createdAt) : new Date(),
          JSON.stringify(o.items || []),
          JSON.stringify(o.statusHistory || []),
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
  return getAllOrders();
}
