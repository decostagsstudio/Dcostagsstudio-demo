import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const db = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes("supabase.co") || env.databaseUrl.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

db.on("error", (error) => {
  console.error("Postgres pool error:", error);
});
