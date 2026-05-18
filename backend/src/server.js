import { app } from "./app.js";
import { env } from "./config/env.js";
import { db } from "./config/database.js";

async function bootstrap() {
  await db.query("SELECT 1");
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
