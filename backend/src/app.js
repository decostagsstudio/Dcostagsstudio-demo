import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { productsRouter } from "./modules/products/products.routes.js";
import { ordersRouter } from "./modules/orders/orders.routes.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { errorHandler } from "./common/middleware/error-handler.js";

export const app = express();

function isDevelopmentLoopbackOrigin(origin) {
  if (env.nodeEnv === "production") return false;

  try {
    const { hostname, protocol } = new URL(origin);
    const loopbackHosts = ["localhost", "127.0.0.1", "::1", "[::1]"];
    return ["http:", "https:"].includes(protocol) && loopbackHosts.includes(hostname);
  } catch {
    return false;
  }
}

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        env.corsOrigin.includes("*") ||
        env.corsOrigin.includes(origin) ||
        (origin === "null" && env.corsOrigin.includes("null")) ||
        isDevelopmentLoopbackOrigin(origin)
      ) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked"));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "dcosta-store-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);

app.use(notFoundHandler);
app.use(errorHandler);
