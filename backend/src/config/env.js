import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function parseCorsOrigins(value) {
  const origins = (value || "*")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (origins.includes("file://") && !origins.includes("null")) {
    origins.push("null");
  }

  return origins;
}

const nodeEnv = process.env.NODE_ENV || "development";
const corsOrigin = parseCorsOrigins(process.env.CORS_ORIGIN);
const jwtSecret = required("JWT_SECRET");
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";
const cloudinaryEnabled = Boolean(cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret);
const imageUploadMaxMb = Number(process.env.IMAGE_UPLOAD_MAX_MB || 8);
const orderNotificationWebhookUrl = process.env.ORDER_NOTIFICATION_WEBHOOK_URL || "";
const orderNotificationWebhookSecret = process.env.ORDER_NOTIFICATION_WEBHOOK_SECRET || "";
const orderNotificationToEmail = process.env.ORDER_NOTIFICATION_TO_EMAIL || "";

if (nodeEnv === "production") {
  if (corsOrigin.includes("*")) {
    throw new Error("CORS_ORIGIN must list explicit origins in production.");
  }

  if (jwtSecret === "change_this_secret" || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be a strong secret with at least 32 characters in production.");
  }

}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 4000),
  corsOrigin,
  databaseUrl: required("DATABASE_URL"),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  trustProxy: ["1", "true", "yes"].includes(String(process.env.TRUST_PROXY || "").toLowerCase()),
  serveFrontend: ["1", "true", "yes"].includes(String(process.env.SERVE_FRONTEND || (nodeEnv === "production" ? "true" : "")).toLowerCase()),
  cloudinary: {
    cloudName: cloudinaryCloudName,
    apiKey: cloudinaryApiKey,
    apiSecret: cloudinaryApiSecret,
    folder: process.env.CLOUDINARY_FOLDER || "dcosta/products",
    enabled: cloudinaryEnabled,
  },
  imageUploadMaxMb: Number.isFinite(imageUploadMaxMb) && imageUploadMaxMb > 0 ? imageUploadMaxMb : 8,
  storePublicUrl: process.env.STORE_PUBLIC_URL || "",
  orderNotifications: {
    webhookUrl: orderNotificationWebhookUrl,
    webhookSecret: orderNotificationWebhookSecret,
    toEmail: orderNotificationToEmail,
    enabled: Boolean(orderNotificationWebhookUrl),
  },
};
