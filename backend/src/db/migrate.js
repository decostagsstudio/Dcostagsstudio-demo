import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureMigrationsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function listAppliedMigrations() {
  const result = await db.query(`SELECT name FROM schema_migrations`);
  return new Set(result.rows.map((row) => row.name));
}

async function run() {
  await ensureMigrationsTable();
  const applied = await listAppliedMigrations();
  const migrationsDir = path.join(__dirname, "sql");
  const files = (await fs.readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations(name) VALUES ($1)`, [file]);
      await client.query("COMMIT");
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

run()
  .then(async () => {
    console.log("Migrations complete");
    await db.end();
  })
  .catch(async (error) => {
    console.error("Migration failed:", error);
    await db.end();
    process.exit(1);
  });
