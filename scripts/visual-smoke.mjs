import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "docs", "visual-test");
let activeOutputDir = outputDir;

const chromeCandidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const results = [];
const failures = [];
const warnings = [];
const browserEvents = [];
const screenshotPaths = [];
let blockedResourceCount = 0;

function logPass(label) {
  results.push(label);
}

function fail(label, detail = "") {
  failures.push(detail ? `${label}: ${detail}` : label);
}

function warn(label, detail = "") {
  warnings.push(detail ? `${label}: ${detail}` : label);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findChrome() {
  for (const candidate of chromeCandidates) {
    if (candidate && await pathExists(candidate)) return candidate;
  }
  throw new Error("No se encontro Chrome o Edge. Define CHROME_PATH si esta instalado en otra ruta.");
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error(`Timeout requesting ${url}`));
    });
  });
}

function startStaticServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname === "/") pathname = "/index.html";

      let filePath = path.normalize(path.join(rootDir, pathname));
      if (!filePath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      let stat = await fs.stat(filePath).catch(() => null);
      if (stat?.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        stat = await fs.stat(filePath).catch(() => null);
      }

      if (!stat?.isFile()) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": mimeTypes[ext] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(await fs.readFile(filePath));
    } catch (error) {
      res.writeHead(500);
      res.end(String(error?.stack || error));
    }
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${server.address().port}`,
      });
    });
  });
}

class PipeCdpClient {
  constructor(chrome) {
    this.chrome = chrome;
    this.input = chrome.stdio[3];
    this.output = chrome.stdio[4];
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
    this.buffer = "";
    this.closed = false;
  }

  async connect() {
    if (!this.input || !this.output) {
      throw new Error("Chrome no expuso pipes CDP.");
    }

    this.output.setEncoding("utf8");
    this.output.on("data", (chunk) => {
      this.buffer += chunk;
      let boundary = this.buffer.indexOf("\0");
      while (boundary !== -1) {
        const raw = this.buffer.slice(0, boundary);
        this.buffer = this.buffer.slice(boundary + 1);
        if (raw) this.handleMessage(JSON.parse(raw));
        boundary = this.buffer.indexOf("\0");
      }
    });

    this.chrome.once("exit", (code) => {
      this.closed = true;
      for (const [id, { reject }] of this.pending) {
        reject(new Error(`Chrome finalizo antes de responder al comando ${id} (codigo ${code}).`));
      }
      this.pending.clear();
    });
  }

  handleMessage(message) {
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
      else resolve(message.result);
      return;
    }

    const handlers = this.handlers.get(message.method) || [];
    handlers.forEach((handler) => handler(message.params || {}));
  }

  send(method, params = {}, sessionId = undefined) {
    if (this.closed) {
      return Promise.reject(new Error("Chrome CDP pipe cerrado."));
    }
    const id = this.nextId++;
    const payload = sessionId ? { id, method, params, sessionId } : { id, method, params };
    this.input.write(`${JSON.stringify(payload)}\0`);
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`Timeout CDP: ${method}`));
      }, 10000);
    });
  }

  on(method, handler) {
    const handlers = this.handlers.get(method) || [];
    handlers.push(handler);
    this.handlers.set(method, handlers);
  }

  session(sessionId) {
    return {
      send: (method, params = {}) => this.send(method, params, sessionId),
      on: (method, handler) => this.on(method, handler),
      close: () => this.close(),
    };
  }

  close() {
    this.input?.destroy();
    this.output?.destroy();
  }
}

async function startChrome(chromePath) {
  const profileDir = await fs.mkdtemp(path.join(os.tmpdir(), "dcosta-visual-"));
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-debugging-pipe",
    `--user-data-dir=${profileDir}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });

  const transport = new PipeCdpClient(chrome);
  await transport.connect();
  const { targetId } = await transport.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await transport.send("Target.attachToTarget", { targetId, flatten: true });
  const cdp = transport.session(sessionId);

  return { chrome, cdp, profileDir };
}

async function evaluate(cdp, expression, awaitPromise = false) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || "Runtime exception");
  }
  return result.result?.value;
}

async function waitFor(cdp, expression, label, timeout = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if (await evaluate(cdp, `Boolean(${expression})`)) return;
    } catch {
      // Keep polling while the page is navigating.
    }
    await sleep(120);
  }
  throw new Error(`Timeout esperando ${label}`);
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await waitFor(cdp, "document.readyState === 'complete'", `carga de ${url}`, 10000);
  await sleep(250);
}

async function setViewport(cdp, width, height, mobile = false) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
}

async function screenshot(cdp, name) {
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const filePath = path.join(activeOutputDir, `${name}.png`);
  await fs.writeFile(filePath, Buffer.from(result.data, "base64"));
  screenshotPaths.push(filePath);
}

async function expect(cdp, expression, label) {
  const value = await evaluate(cdp, expression);
  if (value) logPass(label);
  else fail(label);
}

async function text(cdp, selector) {
  return evaluate(cdp, `document.querySelector(${JSON.stringify(selector)})?.textContent?.trim() || ""`);
}

function registerBrowserEvents(cdp) {
  cdp.on("Runtime.exceptionThrown", (params) => {
    browserEvents.push(`JS exception: ${params.exceptionDetails?.text || "sin detalle"}`);
  });
  cdp.on("Log.entryAdded", (params) => {
    const entry = params.entry || {};
    if (entry.level === "error") {
      const message = String(entry.text || "");
      if (message.includes("Failed to load resource")) {
        blockedResourceCount += 1;
        return;
      }
      if (!message.includes("localhost:4000/api") && !message.includes("net::ERR_CONNECTION_REFUSED")) {
        browserEvents.push(`Console error: ${message}`);
      }
    }
  });
}

async function runVisualFlow(cdp, baseUrl) {
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");
  registerBrowserEvents(cdp);

  await setViewport(cdp, 1440, 920);
  await navigate(cdp, `${baseUrl}/index.html`);
  await evaluate(cdp, "localStorage.clear(); sessionStorage.clear(); true");
  await cdp.send("Page.reload");
  await waitFor(cdp, "document.querySelectorAll('.card').length >= 30", "catalogo de tienda");

  await expect(cdp, "document.querySelector('.overlay h1')?.textContent.includes('DCOSTA')", "Home: hero visible");
  await expect(cdp, "document.querySelectorAll('#womens-products .card').length > 0 && document.querySelectorAll('#mens-products .card').length > 0", "Home: productos mujer y hombre renderizados");
  await expect(cdp, "document.querySelectorAll('#wallet-products .card').length > 0 && document.querySelectorAll('#bag-products .card').length > 0", "Home: accesorios renderizados");
  await screenshot(cdp, "01-home-desktop");

  const imageStats = await evaluate(cdp, `(() => {
    const imgs = Array.from(document.images);
    return { total: imgs.length, loaded: imgs.filter((img) => img.complete && img.naturalWidth > 0).length };
  })()`);
  if (imageStats.loaded < Math.max(1, Math.floor(imageStats.total * 0.6))) {
    warn("Imagenes externas", `${imageStats.loaded}/${imageStats.total} cargadas en el entorno de prueba`);
  } else {
    logPass("Imagenes: mayoria de imagenes de producto cargadas");
  }

  await evaluate(cdp, "document.querySelector('#search-button').click(); true");
  await waitFor(cdp, "document.querySelector('#search-panel')?.classList.contains('is-open')", "panel de busqueda");
  await evaluate(cdp, `(() => {
    const input = document.querySelector('#search-input');
    input.value = 'bolso';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`);
  await waitFor(cdp, "document.querySelectorAll('.search-result').length > 0", "resultados de busqueda");
  await expect(cdp, "document.querySelector('#search-results')?.textContent.toLowerCase().includes('bolso')", "Busqueda: resultados para bolso");
  await screenshot(cdp, "02-search-desktop");

  await evaluate(cdp, "document.querySelector('.search-result').click(); true");
  await waitFor(cdp, "location.pathname.endsWith('/product.html') && document.querySelector('#product-detail h1')", "ficha de producto");
  await expect(cdp, "document.querySelectorAll('.size-chip').length > 0", "Producto: tallas renderizadas");
  await expect(cdp, "!document.querySelector('#add-to-cart')?.disabled", "Producto: boton de bolsa disponible");
  await evaluate(cdp, "document.querySelector('#add-to-cart').click(); true");
  await waitFor(cdp, "document.querySelector('#product-message')?.textContent.length > 0", "mensaje de anadir a bolsa");
  const productMessage = await text(cdp, "#product-message");
  if (productMessage.toLowerCase().includes("adido") || productMessage.toLowerCase().includes("añadido")) {
    logPass("Producto: anadir a bolsa funciona");
  } else {
    fail("Producto: anadir a bolsa funciona", productMessage);
  }
  await screenshot(cdp, "03-product-desktop");

  await navigate(cdp, `${baseUrl}/index.html`);
  await waitFor(cdp, "document.querySelectorAll('.card').length >= 30", "home tras ficha");
  await evaluate(cdp, "document.querySelector('#cart-button').click(); true");
  await waitFor(cdp, "document.querySelector('#checkout')?.classList.contains('is-open')", "panel de bolsa");
  await expect(cdp, "document.querySelectorAll('.cart-item').length > 0", "Bolsa: articulo persistido");
  await evaluate(cdp, `(() => {
    document.querySelector('[name="customer"]').value = 'Prueba Visual';
    document.querySelector('[name="phone"]').value = '+34 600 000 000';
    document.querySelector('[name="email"]').value = 'visual@example.com';
    document.querySelector('[name="notes"]').value = 'Pedido de smoke visual';
    document.querySelector('[name="legalAccepted"]').checked = true;
    document.querySelector('#checkout-form button[type="submit"]').click();
    return true;
  })()`);
  await waitFor(cdp, "document.querySelector('#form-message')?.textContent.includes('Solicitud enviada')", "solicitud enviada");
  await expect(cdp, "JSON.parse(localStorage.getItem('dcosta-orders') || '[]').length > 0", "Checkout: pedido guardado localmente");
  await screenshot(cdp, "04-checkout-desktop");

  await navigate(cdp, `${baseUrl}/cliente/index.html#/pedidos`);
  await waitFor(cdp, "document.querySelector('#client-view')?.textContent.length > 0", "area cliente pedidos");
  await expect(cdp, "document.querySelector('#client-view')?.textContent.includes('Prueba Visual') || document.querySelector('#client-view')?.textContent.includes('Pedidos')", "Cliente: pedidos visible");
  await screenshot(cdp, "05-cliente-pedidos-desktop");

  await navigate(cdp, `${baseUrl}/admin/index.html#/inicio`);
  await waitFor(cdp, "document.querySelector('#unlock-password')", "login admin");
  await evaluate(cdp, `(() => {
    document.querySelector('#unlock-password').value = 'Director#2026';
    document.querySelector('#unlock-btn').click();
    return true;
  })()`);
  await waitFor(cdp, "document.querySelectorAll('.kpi-grid .card').length >= 4", "admin dashboard", 12000);
  await expect(cdp, "document.querySelectorAll('.kpi-grid .card').length >= 4", "Admin: dashboard cargado");
  await screenshot(cdp, "06-admin-dashboard-desktop");

  await evaluate(cdp, "location.hash = '#/productos'; true");
  await waitFor(cdp, "document.querySelector('#route-title')?.textContent.includes('Productos')", "admin productos");
  await expect(cdp, "document.querySelectorAll('#view table tbody tr').length > 0", "Admin: modulo productos disponible");
  await screenshot(cdp, "07-admin-productos-desktop");

  await setViewport(cdp, 390, 844, true);
  await navigate(cdp, `${baseUrl}/index.html`);
  await waitFor(cdp, "document.querySelectorAll('.card').length >= 30", "home mobile");
  await expect(cdp, "document.documentElement.scrollWidth <= window.innerWidth + 2", "Mobile tienda: sin overflow horizontal");
  await screenshot(cdp, "08-home-mobile");

  await navigate(cdp, `${baseUrl}/cliente/index.html#/acceso`);
  await waitFor(cdp, "document.querySelector('#client-view')", "cliente mobile");
  await expect(cdp, "document.documentElement.scrollWidth <= window.innerWidth + 2", "Mobile cliente: sin overflow horizontal");
  await screenshot(cdp, "09-cliente-mobile");
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runOutputDir = path.join(outputDir, runId);
  await fs.mkdir(runOutputDir, { recursive: true });
  activeOutputDir = runOutputDir;

  let staticServer;
  let chrome;
  let cdp;
  let profileDir;

  try {
    const chromePath = await findChrome();
    staticServer = await startStaticServer();
    ({ chrome, cdp, profileDir } = await startChrome(chromePath));

    await runVisualFlow(cdp, staticServer.baseUrl);

    if (blockedResourceCount) {
      warn("Recursos bloqueados por entorno headless", `${blockedResourceCount} cargas externas/API no accesibles`);
    }

    if (browserEvents.length) {
      browserEvents.forEach((event) => fail("Evento de navegador", event));
    }

    const report = {
      baseUrl: staticServer.baseUrl,
      passed: results,
      warnings,
      failures,
      screenshots: screenshotPaths,
    };
    await fs.writeFile(path.join(runOutputDir, "report.json"), JSON.stringify(report, null, 2));

    console.log(`Visual smoke completado: ${results.length} checks OK, ${warnings.length} avisos, ${failures.length} fallos.`);
    console.log(`Artefactos: ${runOutputDir}`);
    if (warnings.length) {
      console.log("\nAvisos:");
      warnings.forEach((item) => console.log(`- ${item}`));
    }
    if (failures.length) {
      console.log("\nFallos:");
      failures.forEach((item) => console.log(`- ${item}`));
      process.exitCode = 1;
    }
  } finally {
    cdp?.close();
    if (chrome && !chrome.killed) chrome.kill();
    if (staticServer?.server) await new Promise((resolve) => staticServer.server.close(resolve));
    if (profileDir) await fs.rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
