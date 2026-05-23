const DEFAULT_FRONTEND_URL = "https://dcostagsstudio-demo.vercel.app";
const DEFAULT_BACKEND_API_URL = "https://dcosta-store.onrender.com/api";

const args = process.argv.slice(2);
const frontendOnly = args.includes("--frontend-only");
const positional = args.filter((arg) => !arg.startsWith("--"));

const frontendUrl = trimTrailingSlash(
  process.env.DCOSTA_PUBLIC_URL || positional[0] || DEFAULT_FRONTEND_URL,
);
const backendApiUrl = trimTrailingSlash(
  process.env.DCOSTA_API_BASE_URL || positional[1] || DEFAULT_BACKEND_API_URL,
);

const results = [];

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function record(status, label, detail = "") {
  results.push({ status, label, detail });
  const marker = status === "ok" ? "OK" : status === "warn" ? "WARN" : "FAIL";
  console.log(`${marker} ${label}${detail ? ` - ${detail}` : ""}`);
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await response.text();
  return { response, text };
}

async function checkText(url, label, predicate) {
  try {
    const { response, text } = await fetchText(url);
    if (!response.ok) {
      record("fail", label, `HTTP ${response.status}`);
      return "";
    }
    const detail = predicate(text);
    if (detail === true) {
      record("ok", label);
    } else {
      record("fail", label, typeof detail === "string" ? detail : "contenido inesperado");
    }
    return text;
  } catch (error) {
    record("fail", label, error.message);
    return "";
  }
}

async function checkJson(url, label, predicate) {
  try {
    const { response, text } = await fetchText(url);
    if (!response.ok) {
      record("fail", label, `HTTP ${response.status}: ${text.slice(0, 120)}`);
      return null;
    }
    const payload = JSON.parse(text);
    const detail = predicate(payload);
    if (detail === true) {
      record("ok", label);
    } else {
      record("fail", label, typeof detail === "string" ? detail : "JSON inesperado");
    }
    return payload;
  } catch (error) {
    record("fail", label, error.message);
    return null;
  }
}

function parseRuntimeConfig(text) {
  const match = text.match(/window\.DCOSTA_CONFIG\s*=\s*(\{[\s\S]*?\})\s*;/);
  if (!match) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

await checkText(`${frontendUrl}/`, "Frontend publico", (text) =>
  text.includes("DCOSTA GS STUDIO") || "no aparece la marca",
);

await checkText(`${frontendUrl}/legal.html`, "Aviso legal publicado", (text) =>
  text.includes("Antonia Sanchez Fernandez") && text.includes("23242398R")
    ? true
    : "faltan datos fiscales",
);

const runtimeText = await checkText(`${frontendUrl}/scripts/runtime-config.js`, "Runtime config", (text) =>
  text.includes("window.DCOSTA_CONFIG") || "no existe window.DCOSTA_CONFIG",
);

const runtimeConfig = parseRuntimeConfig(runtimeText);
if (runtimeConfig.dataSource === "api" && runtimeConfig.apiBaseUrl) {
  record("ok", "Vercel conectado a API", runtimeConfig.apiBaseUrl);
} else {
  record(
    "warn",
    "Vercel todavia en modo local",
    "define DCOSTA_DATA_SOURCE=api y DCOSTA_API_BASE_URL en Vercel y redeploy",
  );
}

if (!frontendOnly) {
  await checkJson(`${backendApiUrl}/health`, "Backend health", (payload) =>
    payload?.ok === true && payload?.service === "dcosta-store-backend" ? true : "respuesta no reconocida",
  );
  await checkJson(`${backendApiUrl}/ready`, "Backend database ready", (payload) =>
    payload?.ok === true && payload?.database === "ready" ? true : "base de datos no lista",
  );
}

const failed = results.filter((result) => result.status === "fail");
const warned = results.filter((result) => result.status === "warn");

console.log("");
console.log(`Resumen: ${results.length - failed.length - warned.length} OK, ${warned.length} avisos, ${failed.length} fallos.`);

if (failed.length) {
  process.exitCode = 1;
}
