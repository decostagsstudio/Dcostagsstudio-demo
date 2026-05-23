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

async function copyEntry(entry) {
  const source = path.join(rootDir, entry);
  const target = path.join(outputDir, entry);
  await fs.cp(source, target, { recursive: true });
}

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await Promise.all(entries.map(copyEntry));

console.log(`Static site built in ${path.relative(rootDir, outputDir)}`);
