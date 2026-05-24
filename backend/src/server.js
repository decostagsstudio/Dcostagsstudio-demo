import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./config/database.js";

async function bootstrap() {
  app.listen(env.port, async () => {
    console.log(`Backend listening on http://localhost:${env.port}`);

    try {
      await db.query("SELECT 1");
      console.log("Database connection ready");
    } catch (error) {
      console.error("Database connection check failed:", error);
    }
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
