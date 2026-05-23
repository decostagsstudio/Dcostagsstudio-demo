import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const outputDir = path.join(rootDir, "dist");

const entries = [
  "index.html",
  "product.html",
  "legal.html",
  "robots.txt",
  "sitemap.xml",
  "admin",
  "assets",
  "cliente",
  "data",
  "scripts",
  "styles",
];
const optionalEntries = new Set(["assets"]);

async function copyEntry(entry) {
  const source = path.join(rootDir, entry);
  const target = path.join(outputDir, entry);
  if (optionalEntries.has(entry)) {
    try {
      await fs.stat(source);
    } catch (error) {
      if (error?.code === "ENOENT") {
        return;
      }
      throw error;
    }
  }
  await fs.cp(source, target, { recursive: true });
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await Promise.all(entries.map(copyEntry));

const runtimeConfig = {
  ...(process.env.DCOSTA_DATA_SOURCE ? { dataSource: process.env.DCOSTA_DATA_SOURCE } : {}),
  ...(process.env.DCOSTA_API_BASE_URL ? { apiBaseUrl: process.env.DCOSTA_API_BASE_URL } : {}),
};

await fs.writeFile(
  path.join(outputDir, "scripts", "runtime-config.js"),
  `window.DCOSTA_CONFIG = ${JSON.stringify(runtimeConfig, null, 2)};\n`,
);

console.log(`Static site built in ${path.relative(rootDir, outputDir)}`);
