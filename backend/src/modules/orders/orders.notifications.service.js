import { env } from "../../config/env.js";

function orderSummary(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  return {
    id: order.id,
    customer: order.customer || "",
    email: order.email || "",
    phone: order.phone || "",
    total: Number(order.total || 0),
    status: order.status || "Pendiente",
    createdAt: order.createdAt || new Date().toISOString(),
    itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    items: items.map((item) => ({
      name: item.name || "",
      size: item.size || "",
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
    })),
  };
}

export async function notifyOrderCreated(order) {
  if (!env.orderNotifications.enabled) return;
  if (typeof fetch !== "function") {
    console.warn("[orders] notification skipped: fetch is not available in this Node.js runtime.");
    return;
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (env.orderNotifications.webhookSecret) {
    headers["X-DCOSTA-Webhook-Secret"] = env.orderNotifications.webhookSecret;
  }

  const payload = {
    event: "order.created",
    toEmail: env.orderNotifications.toEmail,
    storeUrl: env.storePublicUrl,
    order: orderSummary(order),
  };

  try {
    const response = await fetch(env.orderNotifications.webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Order notification failed with HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn("[orders] notification failed:", error?.message || error);
  }
}
