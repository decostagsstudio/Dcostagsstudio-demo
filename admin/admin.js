const view = document.querySelector("#view");
const routeTitle = document.querySelector("#route-title");
const syncStatus = document.querySelector("#sync-status");
const navLinks = document.querySelectorAll("[data-route]");
const toast = document.querySelector("#toast");
const selectedProducts = new Set();
const DEFAULT_PERMISSIONS = {
  canManageUsers: false,
  canDelete: false,
  canBulkPrice: false,
  canConfig: false,
  canEditProducts: true,
  canEditOrders: false,
  canViewBilling: true,
};
const ROLE_RANK = {
  empleado: 1,
  gerencia: 2,
  director: 3,
};

const GERENCIA_PERMISSIONS = {
  canManageUsers: true,
  canDelete: true,
  canBulkPrice: true,
  canConfig: true,
  canEditProducts: true,
  canEditOrders: true,
  canViewBilling: true,
};
const DIRECTOR_PERMISSIONS = {
  canManageUsers: true,
  canDelete: true,
  canBulkPrice: true,
  canConfig: true,
  canEditProducts: true,
  canEditOrders: true,
  canViewBilling: true,
};
const SESSION_STATE_KEY = "dcosta-admin-session-state";
const SESSION_SETTINGS_KEY = "dcosta-admin-session-settings";
const DEFAULT_SESSION_SETTINGS = { inactivityMinutes: 15 };

const money = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

const STATUS = ["Pendiente", "En preparacion", "Enviado", "Completado"];

const demoOrders = [
  { id: "PED-2401", customer: "Laura Gomez", items: 3, total: 129.9, status: "Pendiente", date: "2026-05-12" },
  { id: "PED-2402", customer: "David Ruiz", items: 2, total: 84.0, status: "En preparacion", date: "2026-05-13" },
  { id: "PED-2403", customer: "Ana Martin", items: 1, total: 49.9, status: "Enviado", date: "2026-05-14" },
  { id: "PED-2404", customer: "Pablo Diaz", items: 4, total: 212.5, status: "Completado", date: "2026-05-15" },
  { id: "PED-2405", customer: "Elena Torres", items: 2, total: 97.8, status: "En preparacion", date: "2026-05-16" },
];

const ORDER_STATUSES = ["Pendiente", "En preparacion", "Enviado", "Completado", "Cancelado"];

const salesByDay = [
  { label: "Lun", amount: 340 },
  { label: "Mar", amount: 480 },
  { label: "Mie", amount: 390 },
  { label: "Jue", amount: 620 },
  { label: "Vie", amount: 710 },
  { label: "Sab", amount: 560 },
  { label: "Dom", amount: 430 },
];

const salesByMonth = [
  { label: "Ene", amount: 5200 },
  { label: "Feb", amount: 6100 },
  { label: "Mar", amount: 5800 },
  { label: "Abr", amount: 6900 },
  { label: "May", amount: 7400 },
  { label: "Jun", amount: 8100 },
];

const salesByYear = [
  { label: "2023", amount: 68400 },
  { label: "2024", amount: 75800 },
  { label: "2025", amount: 82900 },
  { label: "2026", amount: 47100 },
];

const PRODUCT_CSV_HEADERS = ["id", "reference", "name", "category", "categoryLabel", "price", "salePrice", "isFeatured", "isActive", "stock", "color", "material", "fit", "badge", "care", "sizes", "sizeStock", "image", "image_url", "images", "description"];

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  syncStatus.textContent = "Guardado local listo para backend/API";
}

function nowIso() {
  return new Date().toISOString();
}

function getSessionSettings() {
  return load(SESSION_SETTINGS_KEY, DEFAULT_SESSION_SETTINGS);
}

function getSessionState() {
  const apiSession = window.DCOSTA_STORE_API?.getAuthSession?.();
  const hasApiToken = Boolean(apiSession?.token && apiSession?.user?.email);
  return load(SESSION_STATE_KEY, {
    isAuthenticated: hasApiToken,
    lastActivityAt: Date.now(),
    lockedReason: "",
    userId: "",
    authVersionAtLogin: 1,
  });
}

function saveSessionState(next) {
  save(SESSION_STATE_KEY, next);
}

function touchSessionActivity() {
  const state = getSessionState();
  if (!state.isAuthenticated) return;
  saveSessionState({
    ...state,
    lastActivityAt: Date.now(),
  });
}

function lockSession(reason) {
  const state = getSessionState();
  saveSessionState({
    ...state,
    isAuthenticated: false,
    lockedReason: reason || "Sesion bloqueada",
  });
}

function unlockSession() {
  const state = getSessionState();
  saveSessionState({
    ...state,
    isAuthenticated: true,
    lockedReason: "",
    lastActivityAt: Date.now(),
  });
}

function maybeAutoLockSession() {
  const state = getSessionState();
  if (!state.isAuthenticated) return;
  const minutes = Math.max(1, Number(getSessionSettings().inactivityMinutes || 15));
  const maxMs = minutes * 60 * 1000;
  if (Date.now() - Number(state.lastActivityAt || 0) > maxMs) {
    lockSession("Bloqueada por inactividad");
  }
}

function getUsers() {
  return load("dcosta-admin-users", [
    { id: "u-dir-1", name: "Dirección", email: "director@dcostagsstudio.com", role: "director", password: "Director#2026", active: true, failedAttempts: 0, lockedUntil: 0, authVersion: 1, permissions: { ...DIRECTOR_PERMISSIONS } },
    { id: "u-ger-1", name: "Gerencia", email: "gerencia@dcostagsstudio.com", role: "gerencia", password: "Gerencia#2026", active: true, failedAttempts: 0, lockedUntil: 0, authVersion: 1, permissions: { ...GERENCIA_PERMISSIONS } },
    { id: "u-emp-1", name: "Equipo tienda", email: "equipo@dcostagsstudio.com", role: "empleado", password: "Empleado#2026", active: true, failedAttempts: 0, lockedUntil: 0, authVersion: 1, permissions: { ...DEFAULT_PERMISSIONS, canEditProducts: true } },
  ]);
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(String(password || ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return `sha256$${toHex(hashBuffer)}`;
}

async function ensureUsersPasswordHashes() {
  const users = getUsers();
  let changed = false;
  const mapped = users.map((u) => {
    // Migración de rol antiguo "gerente" al nuevo rol "gerencia"
    if (u.role === "gerente") {
      changed = true;
      return { ...u, role: "gerencia" };
    }
    return u;
  });
  const next = await Promise.all(mapped.map(async (u) => {
    const normalized = {
      failedAttempts: Number(u.failedAttempts || 0),
      lockedUntil: Number(u.lockedUntil || 0),
      authVersion: Number(u.authVersion || 1),
    };
    if (String(u.password || "").startsWith("sha256$")) {
      if (
        normalized.failedAttempts !== Number(u.failedAttempts || 0) ||
        normalized.lockedUntil !== Number(u.lockedUntil || 0) ||
        normalized.authVersion !== Number(u.authVersion || 1)
      ) changed = true;
      return { ...u, ...normalized };
    }
    changed = true;
    return { ...u, ...normalized, password: await hashPassword(u.password || "") };
  }));

  // Garantiza que exista al menos un usuario director
  if (!next.some((u) => u.role === "director")) {
    changed = true;
    next.unshift({
      id: `u-dir-${Date.now()}`,
      name: "Dirección",
      email: "director@dcostagsstudio.com",
      role: "director",
      password: await hashPassword("Director#2026"),
      active: true,
      failedAttempts: 0,
      lockedUntil: 0,
      authVersion: 1,
      permissions: { ...DIRECTOR_PERMISSIONS },
    });
  }

  // Evita bloqueo total: debe existir al menos un director activo.
  const hasActiveDirector = next.some((u) => u.role === "director" && u.active !== false);
  if (!hasActiveDirector) {
    changed = true;
    const firstDirectorIndex = next.findIndex((u) => u.role === "director");
    if (firstDirectorIndex >= 0) {
      next[firstDirectorIndex] = { ...next[firstDirectorIndex], active: true };
    }
  }

  if (changed) {
    save("dcosta-admin-users", next);
    const sessionUserId = load("dcosta-admin-session-user-id", "");
    if (!next.some((u) => u.id === sessionUserId)) {
      const director = next.find((u) => u.role === "director");
      if (director) {
        save("dcosta-admin-session-user-id", director.id);
      }
    }
  }
}

function getUserById(userId) {
  return getUsers().find((u) => u.id === userId) || null;
}

function isUserLocked(user) {
  return Number(user?.lockedUntil || 0) > Date.now();
}

function minutesLeft(user) {
  return Math.max(1, Math.ceil((Number(user.lockedUntil || 0) - Date.now()) / 60000));
}

function recordFailedLogin(userId) {
  const users = getUsers();
  const next = users.map((u) => {
    if (u.id !== userId) return u;
    const attempts = Number(u.failedAttempts || 0) + 1;
    if (attempts >= 5) {
      return { ...u, failedAttempts: 0, lockedUntil: Date.now() + (15 * 60 * 1000) };
    }
    return { ...u, failedAttempts: attempts };
  });
  save("dcosta-admin-users", next);
}

function recordSuccessfulLogin(userId) {
  const users = getUsers();
  const next = users.map((u) => (u.id === userId ? { ...u, failedAttempts: 0, lockedUntil: 0 } : u));
  save("dcosta-admin-users", next);
}

function beginSessionForUser(user) {
  save("dcosta-admin-session-user-id", user.id);
  saveSessionState({
    isAuthenticated: true,
    lockedReason: "",
    lastActivityAt: Date.now(),
    userId: user.id,
    authVersionAtLogin: Number(user.authVersion || 1),
  });
}

function getApiErrorStatus(error) {
  if (error?.statusCode) return Number(error.statusCode);
  const message = String(error?.message || "");
  const match = message.match(/API request failed:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function isEmergencyApiFailure(error) {
  const status = getApiErrorStatus(error);
  if (status === 400 || status === 401 || status === 403 || status === 423) return false;
  return true;
}

function canUseLocalEmergencyAuth() {
  const hostname = window.location.hostname;
  return (
    window.location.protocol === "file:" ||
    ["", "localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname)
  );
}

function ensureLocalUserFromApiUser(apiUser) {
  if (!apiUser?.email) return null;
  const users = getUsers();
  const email = String(apiUser.email || "").toLowerCase();
  const existing = users.find((u) => String(u.email || "").toLowerCase() === email);
  if (existing) {
    const role = apiUser.role || existing.role || "empleado";
    const next = users.map((u) => (u.id === existing.id ? { ...u, name: apiUser.name || u.name, role } : u));
    save("dcosta-admin-users", next);
    return next.find((u) => u.id === existing.id) || existing;
  }

  const role = apiUser.role || "empleado";
  const permissions = role === "director"
    ? { ...DIRECTOR_PERMISSIONS }
    : role === "gerencia"
      ? { ...GERENCIA_PERMISSIONS }
      : { ...DEFAULT_PERMISSIONS, canEditProducts: true };

  const created = {
    id: `u-api-${Date.now()}`,
    name: apiUser.name || apiUser.email,
    email: apiUser.email,
    role,
    password: "",
    active: true,
    failedAttempts: 0,
    lockedUntil: 0,
    authVersion: 1,
    permissions,
  };
  const next = [created, ...users];
  save("dcosta-admin-users", next);
  return created;
}

async function authenticateAdmin(user, password, auditScope) {
  if (!user) return { ok: false, reason: "user-not-found" };
  if (isUserLocked(user)) return { ok: false, reason: "locked" };
  if (!window.DCOSTA_STORE_API?.loginAdmin) {
    if (!canUseLocalEmergencyAuth()) {
      addAuditLog("LOGIN_API_UNAVAILABLE", `API no disponible en dominio publico: ${user.name}`);
      return { ok: false, reason: "api-unavailable" };
    }
    const localOk = await verifyUserPassword(user, password);
    if (!localOk) {
      recordFailedLogin(user.id);
      return { ok: false, reason: "invalid-credentials" };
    }
    recordSuccessfulLogin(user.id);
    beginSessionForUser(user);
    addAuditLog("LOGIN_FALLBACK_LOCAL", `API no disponible, fallback local: ${user.name}`);
    return { ok: true, mode: "fallback", user };
  }

  try {
    const payload = await window.DCOSTA_STORE_API.loginAdmin(user.email, password);
    const mapped = ensureLocalUserFromApiUser(payload?.user) || user;
    recordSuccessfulLogin(mapped.id);
    beginSessionForUser(mapped);
    addAuditLog(auditScope, `Inicio API: ${mapped.name}`);
    return { ok: true, mode: "api", user: mapped };
  } catch (error) {
    const status = getApiErrorStatus(error);
    if (status === 423) {
      addAuditLog("LOGIN_FAILED", `Usuario bloqueado API: ${user.name}`);
      return { ok: false, reason: "locked" };
    }
    if (!isEmergencyApiFailure(error)) {
      recordFailedLogin(user.id);
      addAuditLog("LOGIN_FAILED", `Credenciales invalidas API: ${user.name}`);
      return { ok: false, reason: "invalid-credentials" };
    }

    if (!canUseLocalEmergencyAuth()) {
      addAuditLog("LOGIN_API_UNAVAILABLE", `Fallback local bloqueado en dominio publico: ${user.name}`);
      return { ok: false, reason: "api-unavailable" };
    }

    const localOk = await verifyUserPassword(user, password);
    if (!localOk) {
      recordFailedLogin(user.id);
      addAuditLog("LOGIN_FAILED", `Fallback local fallido: ${user.name}`);
      return { ok: false, reason: "invalid-credentials" };
    }

    recordSuccessfulLogin(user.id);
    beginSessionForUser(user);
    addAuditLog("LOGIN_FALLBACK_LOCAL", `API no disponible, fallback local: ${user.name}`);
    return { ok: true, mode: "fallback", user };
  }
}

async function verifyUserPassword(user, plainPassword) {
  if (!user) return false;
  const stored = String(user.password || "");
  if (stored.startsWith("sha256$")) {
    const hashed = await hashPassword(plainPassword);
    return hashed === stored;
  }
  return stored === String(plainPassword || "");
}

function validatePasswordPolicy(password) {
  const value = String(password || "");
  if (value.length < 10) return "Minimo 10 caracteres";
  if (!/[a-z]/.test(value)) return "Debe incluir minusculas";
  if (!/[A-Z]/.test(value)) return "Debe incluir mayusculas";
  if (!/[0-9]/.test(value)) return "Debe incluir numeros";
  if (!/[^A-Za-z0-9]/.test(value)) return "Debe incluir simbolos";
  return "";
}

async function requireManagerReauth(reason) {
  const actor = getSessionUser();
  if (!actor || (actor.role !== "director" && actor.role !== "gerencia")) {
    showToast("Solo dirección o gerencia puede confirmar esta acción");
    return false;
  }
  const input = window.prompt(`Reautenticación de dirección/gerencia requerida (${reason}). Introduce tu contraseña:`);
  if (input === null) return false;
  if (window.DCOSTA_STORE_API?.loginAdmin) {
    try {
      await window.DCOSTA_STORE_API.loginAdmin(actor.email, input);
      addAuditLog("MANAGER_REAUTH_OK", `${reason} (API)`);
      return true;
    } catch (error) {
      if (!isEmergencyApiFailure(error)) {
        showToast("Reautenticacion fallida");
        addAuditLog("MANAGER_REAUTH_FAILED", `${reason} (API credenciales)`);
        return false;
      }
      if (!canUseLocalEmergencyAuth()) {
        showToast("API no disponible. Reintenta cuando el backend responda.");
        addAuditLog("MANAGER_REAUTH_FAILED", `${reason} (API no disponible)`);
        return false;
      }
      const okLocal = await verifyUserPassword(actor, input);
      if (!okLocal) {
        showToast("Reautenticacion fallida");
        addAuditLog("MANAGER_REAUTH_FAILED", `${reason} (fallback local)`);
        return false;
      }
      addAuditLog("MANAGER_REAUTH_OK", `${reason} (fallback local emergencia)`);
      return true;
    }
  }
  if (!canUseLocalEmergencyAuth()) {
    showToast("API no disponible. Reintenta cuando el backend responda.");
    addAuditLog("MANAGER_REAUTH_FAILED", `${reason} (API no disponible)`);
    return false;
  }
  const ok = await verifyUserPassword(actor, input);
  if (!ok) {
    showToast("Reautenticacion fallida");
    addAuditLog("MANAGER_REAUTH_FAILED", `${reason} (solo local)`);
    return false;
  }
  addAuditLog("MANAGER_REAUTH_OK", `${reason} (solo local)`);
  return true;
}

function getSessionUserId() {
  return load("dcosta-admin-session-user-id", "u-dir-1");
}

function getSessionUser() {
  const users = getUsers();
  return users.find((u) => u.id === getSessionUserId()) || users[0];
}

function getPermissions() {
  const user = getSessionUser();
  return {
    ...DEFAULT_PERMISSIONS,
    ...(user?.permissions || {}),
  };
}

function getUserRank(user) {
  return ROLE_RANK[user?.role] || 0;
}

function canManageTargetUser(actor, target) {
  if (!actor || !target) return false;
  return getUserRank(actor) > getUserRank(target);
}

function addAuditLog(action, detail = "", metadata = {}) {
  const logs = load("dcosta-admin-audit-log", []);
  const actor = getSessionUser();
  const entry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    at: nowIso(),
    actorName: actor?.name || "Usuario",
    actorRole: actor?.role || "empleado",
    action,
    detail,
    ...metadata,
  };
  save("dcosta-admin-audit-log", [entry, ...logs].slice(0, 1000));
}

function getUserGoals() {
  return load("dcosta-admin-user-goals", {});
}

function saveUserGoals(goals) {
  save("dcosta-admin-user-goals", goals);
}

let toastTimer = null;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function routeFromHash() {
  return window.location.hash.replace("#/", "") || "inicio";
}

function setActiveRoute(route) {
  navLinks.forEach((link) => {
    const perms = getPermissions();
    const disallowed =
      (link.dataset.route === "usuarios" && !perms.canManageUsers) ||
      (link.dataset.route === "auditoria" && !perms.canManageUsers) ||
      (link.dataset.route === "configuracion" && !perms.canConfig) ||
      (link.dataset.route === "facturacion" && !perms.canViewBilling);
    link.style.display = disallowed ? "none" : "";
    link.classList.toggle("is-active", link.dataset.route === route && !disallowed);
  });
}

function badgeClass(status) {
  if (status === "Pendiente") return "st-pendiente";
  if (status === "En preparacion") return "st-preparacion";
  if (status === "Pagado") return "st-preparacion";
  if (status === "Enviado") return "st-enviado";
  return "st-completado";
}

function getLocalOrders() {
  const raw = load("dcosta-admin-demo-orders", null);
  const base = raw && Array.isArray(raw) ? raw : load("dcosta-orders", null);
  const source = Array.isArray(base) && base.length ? base : demoOrders;
  return source.map((o) => ({
    ...o,
    status: o.status || "Pendiente",
    notes: o.notes || "",
    assignedTo: o.assignedTo || "",
    statusHistory: Array.isArray(o.statusHistory) ? o.statusHistory : [],
  }));
}

async function getOrders() {
  if (window.DCOSTA_STORE_API?.getOrders) {
    return await window.DCOSTA_STORE_API.getOrders();
  }

  return getLocalOrders();
}

async function saveOrders(orders) {
  if (window.DCOSTA_STORE_API?.saveOrders) {
    await window.DCOSTA_STORE_API.saveOrders(orders);
  }
  save("dcosta-admin-demo-orders", orders);
  save("dcosta-orders", orders);
}

function getSalesMode() {
  return load("dcosta-admin-sales-mode", "dias");
}

function getSalesData() {
  const mode = getSalesMode();
  if (mode === "meses") return salesByMonth;
  if (mode === "anios") return salesByYear;
  return salesByDay;
}

function getInvoiceConfig() {
  return load("dcosta-admin-invoice", { taxRate: 0.21, currency: "EUR" });
}

async function getProductsCount() {
  const products = await (window.DCOSTA_STORE_API?.getProducts?.() || Promise.resolve([]));
  return products.length || 0;
}

function renderOrdersTable(orders) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Articulos</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map((order) => `
            <tr>
              <td>${order.id}</td>
              <td>${order.customer}</td>
              <td>${formatLocalDateTime(order.createdAt || order.date)}</td>
              <td>${orderItemCount(order)}</td>
              <td>${money.format(order.total)}</td>
              <td><span class="pill ${badgeClass(order.status)}">${order.status}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function normalizeOrderStatus(status) {
  if (!status) return "Pendiente";
  const s = String(status).toLowerCase();
  if (s.includes("prepar") || s.includes("paga")) return "En preparacion";
  if (s.includes("camino") || s.includes("envia")) return "Enviado";
  if (s.includes("entreg") || s.includes("complet")) return "Completado";
  if (s.includes("cancel")) return "Cancelado";
  return "Pendiente";
}

function orderItemCount(order) {
  if (!Array.isArray(order.items)) return Number(order.items || 0);
  return order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
}

function renderOrderDetail(order, users) {
  const items = Array.isArray(order.items) ? order.items : [];
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const assigned = users.find((u) => u.id === order.assignedTo);
  return `
    <details class="order-detail">
      <summary>Ver detalle de pedido</summary>
      <div class="order-detail-grid">
        <section class="order-detail-section">
          <h3>Cliente</h3>
          <p>${escapeHtml(order.customer || "-")}</p>
          <p class="muted">${escapeHtml(order.email || "Email no disponible")}</p>
          <p class="muted">${escapeHtml(order.phone || "Telefono no disponible")}</p>
          <p class="muted">${escapeHtml(order.dni || "DNI no disponible")}</p>
        </section>
        <section class="order-detail-section">
          <h3>Seguimiento</h3>
          <p>${escapeHtml(order.statusDetail || "Sin detalle de estado")}</p>
          <p class="muted">Responsable: ${escapeHtml(assigned?.name || "Sin asignar")}</p>
          <p class="muted">Notas: ${escapeHtml(order.notes || "Sin notas")}</p>
        </section>
        <section class="order-detail-section order-detail-wide">
          <h3>Articulos</h3>
          <div class="order-items-list">
            ${items.length ? items.map((item) => `
              <div class="order-item-row">
                <span>${escapeHtml(item.name || "-")}</span>
                <span>Talla ${escapeHtml(item.size || "-")}</span>
                <span>x${Number(item.quantity || 0)}</span>
                <strong>${money.format(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
              </div>
            `).join("") : '<p class="muted">Sin articulos registrados.</p>'}
          </div>
        </section>
        <section class="order-detail-section order-detail-wide">
          <h3>Historial</h3>
          <div class="order-history-list">
            ${history.length ? history.map((entry) => `
              <div class="order-history-row">
                <span>${formatLocalDateTime(entry.at)}</span>
                <span>${escapeHtml(entry.from || "-")} -> ${escapeHtml(entry.to || "-")}</span>
                <span>${escapeHtml(entry.actor || "Sistema")}</span>
              </div>
            `).join("") : '<p class="muted">Sin cambios de estado registrados.</p>'}
          </div>
        </section>
      </div>
    </details>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function getProducts() {
  return window.DCOSTA_STORE_API?.getProducts?.() || [];
}

async function saveProducts(products) {
  if (window.DCOSTA_STORE_API?.saveCatalog) {
    try {
      await window.DCOSTA_STORE_API.saveCatalog(products, { requireApi: true });
      syncStatus.textContent = "Guardado en Supabase/API";
      return;
    } catch (error) {
      const status = getApiErrorStatus(error);
      syncStatus.textContent = "Error guardando en Supabase/API";
      if (status === 401) {
        showToast("Sesion API caducada. Cierra sesion y vuelve a entrar en admin.");
      } else if (status === 403) {
        showToast("Tu usuario no tiene permiso para guardar productos.");
      } else if (status === 400) {
        showToast("Catalogo invalido. Revisa los campos del producto.");
      } else {
        showToast("No se pudo guardar en Supabase. Revisa backend y conexion.");
      }
      throw error;
    }
  }

  throw new Error("API de productos no disponible");
}

function productKey(product) {
  return product.id || product.name;
}

function productRef(product) {
  return String(product?.reference || product?.sku || product?.id || "").trim();
}

function parseSizeStockInput(value) {
  const text = String(value || "").trim();
  if (!text) return {};
  const tokens = text.split(/[\n,|]+/).map((x) => x.trim()).filter(Boolean);
  const out = {};
  tokens.forEach((token) => {
    const [rawSize, rawQty] = token.split(":").map((x) => String(x || "").trim());
    if (!rawSize) return;
    const qty = Math.max(0, Number(rawQty || 0));
    out[rawSize] = Number.isFinite(qty) ? qty : 0;
  });
  return out;
}

function normalizeSizeStock(product) {
  const fromObject = product?.sizeStock && typeof product.sizeStock === "object"
    ? Object.entries(product.sizeStock).reduce((acc, [size, qty]) => {
      const normalized = Math.max(0, Number(qty || 0));
      if (size) acc[String(size)] = Number.isFinite(normalized) ? normalized : 0;
      return acc;
    }, {})
    : {};

  if (Object.keys(fromObject).length) return fromObject;
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  return sizes.reduce((acc, size) => {
    if (size) acc[String(size)] = 0;
    return acc;
  }, {});
}

function formatSizeStock(sizeStock) {
  return Object.entries(sizeStock || {}).map(([size, qty]) => `${size}:${qty}`).join(", ");
}

function parseBooleanInput(value, fallback = false) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return fallback;
  return ["1", "true", "si", "sí", "yes", "y"].includes(text);
}

function parseImagesInput(value) {
  return String(value || "").split(/[\n|]+/).map((x) => x.trim()).filter(Boolean);
}

function formatImagesInput(images) {
  return (Array.isArray(images) ? images : []).join("|");
}

async function uploadProductImagesFromInput(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return [];

  if (!window.DCOSTA_STORE_API?.uploadProductImages) {
    throw new Error("Subida Cloudinary no disponible");
  }

  const result = await window.DCOSTA_STORE_API.uploadProductImages(files);
  return Array.isArray(result?.urls) ? result.urls.filter(Boolean) : [];
}

function totalUnits(product) {
  const sizeStock = normalizeSizeStock(product);
  return Object.values(sizeStock).reduce((sum, qty) => sum + Number(qty || 0), 0);
}

function refsFromSelection(products, selectedSet) {
  return products
    .filter((p) => selectedSet.has(productKey(p)))
    .map((p) => productRef(p) || productKey(p))
    .join(", ");
}

function cloneProductForAudit(product) {
  return JSON.parse(JSON.stringify(product || {}));
}

function getSchedules() {
  return load("dcosta-admin-product-schedules", []);
}

function saveSchedules(schedules) {
  save("dcosta-admin-product-schedules", schedules);
}

function formatLocalDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-ES");
}

async function processScheduledProductPublishes() {
  const schedules = getSchedules();
  if (!schedules.length) return;

  const now = Date.now();
  const due = schedules.filter((item) => item.status === "pending" && Number(new Date(item.runAt).getTime()) <= now);
  if (!due.length) return;

  const products = await getProducts();
  const byKey = new Map(products.map((p) => [productKey(p), p]));

  due.forEach((job) => {
    (job.products || []).forEach((incoming) => {
      const key = productKey(incoming);
      const existing = byKey.get(key);
      const merged = {
        ...(existing || {}),
        ...incoming,
        categoryLabel: incoming.categoryLabel || existing?.categoryLabel || incoming.category || existing?.category || "",
      };
      byKey.set(key, merged);
    });
  });

  const nextProducts = Array.from(byKey.values());
  await saveProducts(nextProducts);

  const doneIds = new Set(due.map((d) => d.id));
  const nextSchedules = schedules.map((item) => (
    doneIds.has(item.id)
      ? { ...item, status: "done", processedAt: new Date().toISOString() }
      : item
  ));
  saveSchedules(nextSchedules);
  addAuditLog("PRODUCT_SCHEDULE_EXECUTED", `Ejecución de ${due.length} programación(es).`);
}

function toCsvValue(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function productsToCsv(products) {
  const rows = products.map((p) => [
    p.id || "",
    p.reference || "",
    p.name || "",
    p.category || "",
    p.categoryLabel || "",
    Number(p.price) || 0,
    p.salePrice ?? "",
    p.isFeatured ? "true" : "false",
    p.isActive === false ? "false" : "true",
    p.stock || "",
    p.color || "",
    p.material || "",
    p.fit || "",
    p.badge || "",
    p.care || "",
    (p.sizes || []).join("|"),
    formatSizeStock(normalizeSizeStock(p)).replaceAll(", ", "|"),
    p.image || "",
    p.image || "",
    formatImagesInput(p.images || []),
    p.description || "",
  ]);
  return [PRODUCT_CSV_HEADERS.join(","), ...rows.map((row) => row.map(toCsvValue).join(","))].join("\n");
}

function productImportTemplateCsv() {
  return `${PRODUCT_CSV_HEADERS.join(",")}\n`;
}

function parseCsvLine(line) {
  const out = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && inQuotes && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function csvToProducts(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line, idx) => {
    const cols = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
    const category = row.category || "women";
    const labels = { women: "Mujer", men: "Hombre", wallets: "Carteras", bags: "Bolsos" };
    return {
      id: row.id || `imp-${Date.now()}-${idx}`,
      reference: row.reference || "",
      name: row.name || `Producto ${idx + 1}`,
      category,
      categoryLabel: row.categoryLabel || labels[category] || category,
      price: Math.max(0, Number(row.price) || 0),
      salePrice: row.salePrice ? Math.max(0, Number(row.salePrice) || 0) : null,
      isFeatured: parseBooleanInput(row.isFeatured, false),
      isActive: parseBooleanInput(row.isActive, true),
      stock: row.stock || "Disponible",
      color: row.color || "",
      material: row.material || "",
      fit: row.fit || "",
      badge: row.badge || "",
      care: row.care || "",
      sizes: String(row.sizes || "").split("|").map((x) => x.trim()).filter(Boolean),
      sizeStock: parseSizeStockInput(String(row.sizeStock || "").replaceAll("|", ",")),
      image: row.image_url || row.image || "",
      images: parseImagesInput(row.images || ""),
      description: row.description || "",
    };
  });
}

async function renderProductos() {
  const products = await getProducts();
  const permissions = getPermissions();
  const route = load("dcosta-admin-products-filter", { q: "", category: "all", sort: "name-asc", page: 1, pageSize: 8 });
  const labels = { women: "Mujer", men: "Hombre", wallets: "Carteras", bags: "Bolsos" };
  const filtered = products
    .filter((p) => {
      const query = route.q.trim().toLowerCase();
      const hay = `${p.name || ""} ${p.categoryLabel || p.category || ""} ${p.color || ""}`.toLowerCase();
      const byQ = !query || hay.includes(query);
      const byCat = route.category === "all" || (p.category || "") === route.category;
      return byQ && byCat;
    })
    .sort((a, b) => {
      if (route.sort === "price-asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (route.sort === "price-desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
      return String(a.name || "").localeCompare(String(b.name || ""), "es");
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / route.pageSize));
  const currentPage = Math.min(Math.max(1, route.page), totalPages);
  const start = (currentPage - 1) * route.pageSize;
  const paged = filtered.slice(start, start + route.pageSize);
  const selectedInFiltered = filtered.filter((p) => selectedProducts.has(productKey(p))).length;
  const allPageSelected = paged.length > 0 && paged.every((p) => selectedProducts.has(productKey(p)));
  const schedules = getSchedules();
  const pendingSchedules = schedules.filter((s) => s.status === "pending");

  routeTitle.textContent = "Productos";
  view.innerHTML = `
    <article class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;">
        <h2>Gestion de productos <span class="muted-inline">(${filtered.length}/${products.length})</span></h2>
        <div class="table-actions">
          <button id="btn-export-products" class="btn btn-soft">Exportar CSV</button>
          <button id="btn-template-products" class="btn btn-soft">Plantilla CSV</button>
          <label class="btn btn-soft" for="import-products">Importar CSV</label>
          <input id="import-products" class="file-input" type="file" accept=".csv,text/csv">
          <button id="btn-new-product" class="btn">Nuevo producto</button>
        </div>
      </div>
      <div class="toolbar">
        <input id="product-search" placeholder="Buscar por nombre, categoria o color" value="${escapeHtml(route.q)}">
        <select id="product-category">
          <option value="all" ${route.category === "all" ? "selected" : ""}>Todas las categorias</option>
          ${Object.entries(labels).map(([value, label]) => `<option value="${value}" ${route.category === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <select id="product-sort">
          <option value="name-asc" ${route.sort === "name-asc" ? "selected" : ""}>Nombre A-Z</option>
          <option value="price-asc" ${route.sort === "price-asc" ? "selected" : ""}>Precio asc.</option>
          <option value="price-desc" ${route.sort === "price-desc" ? "selected" : ""}>Precio desc.</option>
        </select>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 10px;">
        <p class="muted">Seleccionados en filtro actual: ${selectedInFiltered}</p>
        <button id="btn-reset-filters" class="btn btn-soft">Limpiar filtros</button>
      </div>
      <div id="product-form-shell"></div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>
                <div style="display:grid;grid-template-columns:18px 1fr;gap:8px;align-items:center;">
                  <input type="checkbox" id="select-all-page" ${allPageSelected ? "checked" : ""}>
                  <span>Producto</span>
                </div>
              </th>
              <th>Ref</th><th>Categoria</th><th>Precio</th><th>Uds</th><th>Tallas</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${paged.length ? paged.map((p) => `
              <tr>
                <td>
                  <div style="display:grid;grid-template-columns:18px 1fr;gap:8px;align-items:center;">
                    <input type="checkbox" data-select-product="${escapeHtml(productKey(p))}" ${selectedProducts.has(productKey(p)) ? "checked" : ""}>
                    <input class="inline-input" data-inline-name="${escapeHtml(productKey(p))}" value="${escapeHtml(p.name || "")}">
                  </div>
                </td>
                <td><input class="inline-input" data-inline-ref="${escapeHtml(productKey(p))}" value="${escapeHtml(productRef(p))}"></td>
                <td>
                  <select class="inline-select" data-inline-category="${escapeHtml(productKey(p))}">
                    ${Object.entries(labels).map(([value, label]) => `<option value="${value}" ${(p.category || "") === value ? "selected" : ""}>${label}</option>`).join("")}
                  </select>
                </td>
                <td><input class="inline-input" data-inline-price="${escapeHtml(productKey(p))}" type="number" min="0" step="0.01" value="${Number(p.price) || 0}"></td>
                <td>${totalUnits(p)}</td>
                <td class="muted">${escapeHtml(formatSizeStock(normalizeSizeStock(p)) || "-")}</td>
                <td><input class="inline-input" data-inline-stock="${escapeHtml(productKey(p))}" value="${escapeHtml(p.stock || "Disponible")}"></td>
                <td>
                  <div class="table-actions">
                    <button class="btn" data-inline-save="${escapeHtml(productKey(p))}">Guardar</button>
                    <button class="btn btn-soft" data-edit="${escapeHtml(productKey(p))}">Editar</button>
                    <button class="btn btn-soft" data-copy="${escapeHtml(productKey(p))}">Duplicar</button>
                    <button class="btn btn-danger" data-delete="${escapeHtml(productKey(p))}">Eliminar</button>
                  </div>
                </td>
              </tr>
            `).join("") : `<tr><td colspan="8" class="muted">No hay resultados con este filtro.</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="bulkbar">
        <p class="muted">Seleccionados: ${selectedProducts.size}</p>
        <div class="bulk-actions">
          <select id="bulk-status" class="inline-select" style="width:190px;">
            <option value="">Cambiar estado por lote</option>
            <option value="Disponible">Disponible</option>
            <option value="Pocas unidades">Pocas unidades</option>
            <option value="Agotado">Agotado</option>
          </select>
          <button id="bulk-apply-status" class="btn btn-soft" ${selectedProducts.size ? "" : "disabled"}>Aplicar estado</button>
          <select id="bulk-category" class="inline-select" style="width:180px;">
            <option value="">Cambiar categoria</option>
            ${Object.entries(labels).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
          </select>
          <button id="bulk-apply-category" class="btn btn-soft" ${selectedProducts.size ? "" : "disabled"}>Aplicar categoria</button>
          <input id="bulk-price" class="inline-input" style="width:110px;" type="number" step="0.1" placeholder="% precio" ${permissions.canBulkPrice ? "" : "disabled"}>
          <button id="bulk-apply-price" class="btn btn-soft" ${(selectedProducts.size && permissions.canBulkPrice) ? "" : "disabled"}>Ajustar %</button>
          <button id="bulk-delete" class="btn btn-danger" ${(selectedProducts.size && permissions.canDelete) ? "" : "disabled"}>Eliminar seleccionados</button>
          <button id="bulk-clear" class="btn btn-soft" ${selectedProducts.size ? "" : "disabled"}>Limpiar seleccion</button>
        </div>
      </div>
      <div class="bulkbar">
        <p class="muted">Programación de publicación</p>
        <div class="bulk-actions">
          <input id="schedule-datetime" class="inline-input" type="datetime-local" style="width:220px;">
          <button id="schedule-selected" class="btn btn-soft" ${selectedProducts.size ? "" : "disabled"}>Programar seleccionados</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Estado</th><th>Fecha/hora</th><th>Items</th><th>Referencias</th><th>Acciones</th></tr></thead>
          <tbody>
            ${pendingSchedules.length
              ? pendingSchedules.map((job) => `
                <tr>
                  <td>Pendiente</td>
                  <td>${formatLocalDateTime(job.runAt)}</td>
                  <td>${(job.products || []).length}</td>
                  <td>${escapeHtml((job.products || []).map((p) => productRef(p) || productKey(p)).join(", "))}</td>
                  <td><button class="btn btn-soft" data-cancel-schedule="${job.id}">Cancelar</button></td>
                </tr>
              `).join("")
              : `<tr><td colspan="5" class="muted">No hay publicaciones programadas.</td></tr>`}
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <p class="muted">Pagina ${currentPage} de ${totalPages}</p>
        <div class="pagination-controls">
          <button class="btn btn-soft" id="prev-page" ${currentPage <= 1 ? "disabled" : ""}>Anterior</button>
          <select id="page-size" class="inline-select" style="width:90px;">
            <option value="8" ${route.pageSize === 8 ? "selected" : ""}>8</option>
            <option value="12" ${route.pageSize === 12 ? "selected" : ""}>12</option>
            <option value="20" ${route.pageSize === 20 ? "selected" : ""}>20</option>
          </select>
          <button class="btn btn-soft" id="next-page" ${currentPage >= totalPages ? "disabled" : ""}>Siguiente</button>
        </div>
      </div>
    </article>
  `;

  const persistFilters = (overrides = {}) => {
    save("dcosta-admin-products-filter", {
      q: document.querySelector("#product-search")?.value || "",
      category: document.querySelector("#product-category")?.value || "all",
      sort: document.querySelector("#product-sort")?.value || "name-asc",
      page: currentPage,
      pageSize: Number(document.querySelector("#page-size")?.value || route.pageSize || 8),
      ...overrides,
    });
  };

  document.querySelector("#product-search").addEventListener("input", () => {
    persistFilters({ page: 1 });
    renderProductos();
  });
  document.querySelector("#product-category").addEventListener("change", () => {
    persistFilters({ page: 1 });
    renderProductos();
  });
  document.querySelector("#product-sort").addEventListener("change", () => {
    persistFilters({ page: 1 });
    renderProductos();
  });
  document.querySelector("#prev-page")?.addEventListener("click", () => {
    persistFilters({ page: Math.max(1, currentPage - 1) });
    renderProductos();
  });
  document.querySelector("#next-page")?.addEventListener("click", () => {
    persistFilters({ page: Math.min(totalPages, currentPage + 1) });
    renderProductos();
  });
  document.querySelector("#page-size")?.addEventListener("change", (event) => {
    persistFilters({ page: 1, pageSize: Number(event.target.value || 8) });
    renderProductos();
  });

  document.querySelector("#btn-new-product").addEventListener("click", () => {
    showProductForm(null, products);
  });
  document.querySelector("#btn-reset-filters")?.addEventListener("click", () => {
    save("dcosta-admin-products-filter", { q: "", category: "all", sort: "name-asc", page: 1, pageSize: route.pageSize || 8 });
    renderProductos();
  });
  document.querySelector("#btn-export-products")?.addEventListener("click", () => {
    const csv = productsToCsv(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "productos-admin.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("CSV exportado");
  });
  document.querySelector("#btn-template-products")?.addEventListener("click", () => {
    const blob = new Blob([productImportTemplateCsv()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dcosta-productos-plantilla.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Plantilla CSV preparada");
  });
  document.querySelector("#import-products")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = csvToProducts(text);
    if (!imported.length) {
      showToast("CSV sin datos validos");
      return;
    }
    await saveProducts(imported);
    selectedProducts.clear();
    showToast("CSV importado");
    renderProductos();
  });

  view.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = products.find((p) => productKey(p) === btn.dataset.edit);
      showProductForm(selected, products);
    });
  });

  view.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const selected = products.find((p) => productKey(p) === btn.dataset.copy);
      if (!selected) return;
      const copy = {
        ...selected,
        id: `prod-${Date.now()}`,
        name: `${selected.name || "Producto"} copia`,
      };
      await saveProducts([copy, ...products]);
      addAuditLog("PRODUCT_DUPLICATE", `${selected.name || "Producto"} duplicado [${productRef(copy)}]`);
      showToast("Producto duplicado");
      renderProductos();
    });
  });

  view.querySelectorAll("[data-inline-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.inlineSave;
      const current = products.find((p) => productKey(p) === key);
      if (!current) return;
      const name = view.querySelector(`[data-inline-name="${CSS.escape(key)}"]`)?.value?.trim() || "";
      const reference = view.querySelector(`[data-inline-ref="${CSS.escape(key)}"]`)?.value?.trim() || "";
      const category = view.querySelector(`[data-inline-category="${CSS.escape(key)}"]`)?.value || current.category || "women";
      const price = Number(view.querySelector(`[data-inline-price="${CSS.escape(key)}"]`)?.value || 0);
      const stock = view.querySelector(`[data-inline-stock="${CSS.escape(key)}"]`)?.value?.trim() || "Disponible";
      if (!name) {
        showToast("Nombre obligatorio");
        return;
      }
      if (price < 0) {
        showToast("Precio invalido");
        return;
      }
      const labels2 = { women: "Mujer", men: "Hombre", wallets: "Carteras", bags: "Bolsos" };
      const updated = { ...current, reference, name, category, categoryLabel: labels2[category] || category, price, stock };
      const next = products.map((p) => (productKey(p) === key ? updated : p));
      await saveProducts(next);
      addAuditLog("PRODUCT_INLINE_UPDATE", `Actualizado: ${updated.name} [${productRef(updated)}]`);
      showToast("Producto guardado");
      renderProductos();
    });
  });

  view.querySelectorAll("[data-select-product]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const key = cb.dataset.selectProduct;
      if (!key) return;
      if (cb.checked) selectedProducts.add(key);
      else selectedProducts.delete(key);
      renderProductos();
    });
  });
  document.querySelector("#select-all-page")?.addEventListener("change", (event) => {
    if (event.target.checked) {
      paged.forEach((p) => selectedProducts.add(productKey(p)));
    } else {
      paged.forEach((p) => selectedProducts.delete(productKey(p)));
    }
    renderProductos();
  });

  document.querySelector("#bulk-clear")?.addEventListener("click", () => {
    selectedProducts.clear();
    renderProductos();
  });

  document.querySelector("#bulk-apply-status")?.addEventListener("click", async () => {
    const nextStatus = document.querySelector("#bulk-status")?.value || "";
    if (!nextStatus) {
      showToast("Selecciona un estado");
      return;
    }
    const next = products.map((p) => (
      selectedProducts.has(productKey(p))
        ? { ...p, stock: nextStatus }
        : p
    ));
    await saveProducts(next);
    addAuditLog("PRODUCT_BULK_STATUS", `Estado "${nextStatus}" aplicado a ${selectedProducts.size} productos [${refsFromSelection(products, selectedProducts)}]`);
    showToast("Estado aplicado a seleccionados");
    selectedProducts.clear();
    renderProductos();
  });
  document.querySelector("#bulk-apply-category")?.addEventListener("click", async () => {
    const category = document.querySelector("#bulk-category")?.value || "";
    if (!category) {
      showToast("Selecciona una categoria");
      return;
    }
    const labels2 = { women: "Mujer", men: "Hombre", wallets: "Carteras", bags: "Bolsos" };
    const next = products.map((p) => (
      selectedProducts.has(productKey(p))
        ? { ...p, category, categoryLabel: labels2[category] || category }
        : p
    ));
    await saveProducts(next);
    addAuditLog("PRODUCT_BULK_CATEGORY", `Categoria "${category}" aplicada a ${selectedProducts.size} productos [${refsFromSelection(products, selectedProducts)}]`);
    showToast("Categoria aplicada");
    selectedProducts.clear();
    renderProductos();
  });
  document.querySelector("#bulk-apply-price")?.addEventListener("click", async () => {
    const adjustment = Number(document.querySelector("#bulk-price")?.value || 0);
    if (!permissions.canBulkPrice) {
      showToast("Sin permisos para ajustar precios");
      return;
    }
    if (!Number.isFinite(adjustment) || adjustment === 0) {
      showToast("Indica un porcentaje valido");
      return;
    }
    const factor = 1 + adjustment / 100;
    const next = products.map((p) => (
      selectedProducts.has(productKey(p))
        ? { ...p, price: Math.max(0, Number((Number(p.price || 0) * factor).toFixed(2))) }
        : p
    ));
    await saveProducts(next);
    addAuditLog("PRODUCT_BULK_PRICE", `Ajuste ${adjustment}% sobre ${selectedProducts.size} productos [${refsFromSelection(products, selectedProducts)}]`);
    showToast("Precio ajustado por lote");
    selectedProducts.clear();
    renderProductos();
  });

  document.querySelector("#bulk-delete")?.addEventListener("click", async () => {
    if (!selectedProducts.size) return;
    if (!permissions.canDelete) {
      showToast("Sin permisos para eliminar");
      return;
    }
    if (!window.confirm(`Eliminar ${selectedProducts.size} productos seleccionados?`)) return;
    const refs = refsFromSelection(products, selectedProducts);
    const deletedProducts = products
      .filter((p) => selectedProducts.has(productKey(p)))
      .map(cloneProductForAudit);
    const next = products.filter((p) => !selectedProducts.has(productKey(p)));
    await saveProducts(next);
    addAuditLog("PRODUCT_BULK_DELETE", `Eliminados ${selectedProducts.size} productos [${refs}]`, { products: deletedProducts });
    showToast("Productos eliminados");
    selectedProducts.clear();
    renderProductos();
  });

  document.querySelector("#schedule-selected")?.addEventListener("click", async () => {
    const raw = String(document.querySelector("#schedule-datetime")?.value || "");
    const runAt = raw ? new Date(raw).toISOString() : "";
    if (!runAt || Number.isNaN(new Date(runAt).getTime())) {
      showToast("Selecciona fecha y hora válida");
      return;
    }
    if (new Date(runAt).getTime() <= Date.now()) {
      showToast("La fecha debe ser futura");
      return;
    }
    const selectedItems = products.filter((p) => selectedProducts.has(productKey(p)));
    if (!selectedItems.length) {
      showToast("No hay productos seleccionados");
      return;
    }
    const job = {
      id: `sch-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      runAt,
      products: selectedItems.map((p) => ({ ...p })),
    };
    saveSchedules([job, ...getSchedules()]);
    addAuditLog("PRODUCT_SCHEDULE_CREATE", `Programados ${(job.products || []).length} producto(s) para ${runAt}`);
    showToast("Publicación programada");
    selectedProducts.clear();
    renderProductos();
  });

  view.querySelectorAll("[data-cancel-schedule]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.cancelSchedule;
      const next = getSchedules().map((job) => (job.id === id ? { ...job, status: "cancelled", cancelledAt: new Date().toISOString() } : job));
      saveSchedules(next);
      addAuditLog("PRODUCT_SCHEDULE_CANCEL", `Programación cancelada: ${id}`);
      showToast("Programación cancelada");
      renderProductos();
    });
  });

  view.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const selected = products.find((p) => productKey(p) === btn.dataset.delete);
      if (!selected) return;
      if (!permissions.canDelete) {
        showToast("Sin permisos para eliminar");
        return;
      }
      if (!window.confirm(`Eliminar "${selected.name}"?`)) return;
      const next = products.filter((p) => productKey(p) !== productKey(selected));
      await saveProducts(next);
      addAuditLog("PRODUCT_DELETE", `Eliminado: ${selected.name} [${productRef(selected)}]`, { products: [cloneProductForAudit(selected)] });
      showToast("Producto eliminado");
      renderProductos();
    });
  });
}

function showProductForm(product, products) {
  const shell = document.querySelector("#product-form-shell");
  if (!shell) return;
  const isEdit = Boolean(product);
  const draft = product || {
    id: `prod-${Date.now()}`,
    reference: "",
    name: "",
    category: "women",
    categoryLabel: "Mujer",
    price: 0,
    salePrice: null,
    isFeatured: false,
    isActive: true,
    color: "",
    material: "",
    fit: "",
    badge: "",
    care: "",
    sizes: ["S", "M", "L"],
    stock: "Disponible",
    image: "",
    images: [],
    description: "",
  };
  const draftSizeStock = normalizeSizeStock(draft);

  shell.innerHTML = `
    <form id="product-form" class="form-grid" style="margin-bottom:14px;">
      <div class="field"><label>Referencia</label><input name="reference" value="${escapeHtml(productRef(draft))}"></div>
      <div class="field"><label>Nombre</label><input name="name" required value="${escapeHtml(draft.name)}"></div>
      <div class="field">
        <label>Categoria</label>
        <select name="category">
          <option value="women" ${draft.category === "women" ? "selected" : ""}>Mujer</option>
          <option value="men" ${draft.category === "men" ? "selected" : ""}>Hombre</option>
          <option value="wallets" ${draft.category === "wallets" ? "selected" : ""}>Carteras</option>
          <option value="bags" ${draft.category === "bags" ? "selected" : ""}>Bolsos</option>
        </select>
      </div>
      <div class="field"><label>Precio</label><input name="price" type="number" min="0" step="0.01" value="${Number(draft.price) || 0}"></div>
      <div class="field"><label>Precio oferta</label><input name="salePrice" type="number" min="0" step="0.01" value="${draft.salePrice ?? ""}"></div>
      <div class="field"><label>Estado</label><input name="stock" value="${escapeHtml(draft.stock || "Disponible")}"></div>
      <div class="field"><label>Color</label><input name="color" value="${escapeHtml(draft.color || "")}"></div>
      <div class="field"><label>Material</label><input name="material" value="${escapeHtml(draft.material || "")}"></div>
      <div class="field"><label>Ajuste/formato</label><input name="fit" value="${escapeHtml(draft.fit || "")}"></div>
      <div class="field"><label>Etiqueta</label><input name="badge" value="${escapeHtml(draft.badge || "")}"></div>
      <div class="field"><label>Visible</label><select name="isActive"><option value="true" ${draft.isActive === false ? "" : "selected"}>Si</option><option value="false" ${draft.isActive === false ? "selected" : ""}>No</option></select></div>
      <div class="field"><label>Destacado</label><select name="isFeatured"><option value="false" ${draft.isFeatured ? "" : "selected"}>No</option><option value="true" ${draft.isFeatured ? "selected" : ""}>Si</option></select></div>
      <div class="field full"><label>Tallas y cantidad (ej: S:5, M:3, L:0)</label><input name="sizeStock" value="${escapeHtml(formatSizeStock(draftSizeStock))}"></div>
      <div class="field full"><label>Imagen principal (URL)</label><input name="image" value="${escapeHtml(draft.image || "")}"></div>
      <div class="field full"><label>Imagenes extra (URL separadas por |)</label><input name="images" value="${escapeHtml(formatImagesInput(draft.images || []))}"></div>
      <div class="field full"><label>Subir imagenes a Cloudinary</label><input name="imageFiles" type="file" accept="image/jpeg,image/png,image/webp" multiple></div>
      <div class="field full"><label>Descripcion</label><textarea name="description">${escapeHtml(draft.description || "")}</textarea></div>
      <div class="field full"><label>Cuidados</label><textarea name="care">${escapeHtml(draft.care || "")}</textarea></div>
      ${!isEdit ? `
      <div class="field">
        <label>Publicacion</label>
        <select name="publishMode" id="publish-mode">
          <option value="immediate">Inmediata</option>
          <option value="scheduled">Programada</option>
        </select>
      </div>
      <div class="field">
        <label>Fecha y hora</label>
        <input name="publishAt" id="publish-at" type="datetime-local" disabled>
      </div>
      ` : ""}
      <div style="display:flex;gap:8px;justify-content:flex-end;grid-column:1/-1;">
        <button type="button" id="cancel-product-form" class="btn btn-soft">Cancelar</button>
        <button class="btn" type="submit">${isEdit ? "Guardar cambios" : "Crear producto"}</button>
      </div>
    </form>
  `;

  shell.querySelector("#cancel-product-form").addEventListener("click", () => {
    shell.innerHTML = "";
  });

  if (!isEdit) {
    const publishMode = shell.querySelector("#publish-mode");
    const publishAt = shell.querySelector("#publish-at");
    publishMode?.addEventListener("change", () => {
      const scheduled = publishMode.value === "scheduled";
      publishAt.disabled = !scheduled;
      if (!scheduled) publishAt.value = "";
    });
  }

  shell.querySelector("#product-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const category = String(data.get("category") || "women");
    const sizeStock = parseSizeStockInput(String(data.get("sizeStock") || ""));
    const labels = { women: "Mujer", men: "Hombre", wallets: "Carteras", bags: "Bolsos" };
    const manualImage = String(data.get("image") || "").trim();
    const manualImages = parseImagesInput(data.get("images") || "");
    const fileInput = event.currentTarget.querySelector('[name="imageFiles"]');
    let uploadedUrls = [];
    let uploadFailed = false;

    if (fileInput?.files?.length) {
      try {
        showToast("Subiendo imagenes a Cloudinary...");
        uploadedUrls = await uploadProductImagesFromInput(fileInput.files);
      } catch (error) {
        const status = getApiErrorStatus(error);
        if (status === 401 || status === 403) {
          showToast(status === 401 ? "Sesion API caducada. Vuelve a entrar en admin." : "Sin permisos para subir imagenes.");
          throw error;
        }
        uploadFailed = true;
        showToast(status === 503 ? "Cloudinary no esta configurado en Render." : "Cloudinary no disponible. Se mantienen las URLs manuales.");
        console.warn("[DCOSTA_ADMIN] Cloudinary upload fallback:", error?.message || error);
      }
    }

    const primaryImage = uploadedUrls[0] || manualImage;
    const extraImages = uploadedUrls.length
      ? [...uploadedUrls.slice(1), ...manualImages]
      : manualImages;

    const updated = {
      ...draft,
      reference: String(data.get("reference") || "").trim(),
      name: String(data.get("name") || "").trim(),
      category,
      categoryLabel: labels[category] || category,
      price: Number(data.get("price") || 0),
      salePrice: String(data.get("salePrice") || "").trim() ? Number(data.get("salePrice") || 0) : null,
      isFeatured: parseBooleanInput(data.get("isFeatured"), false),
      isActive: parseBooleanInput(data.get("isActive"), true),
      stock: String(data.get("stock") || "").trim(),
      color: String(data.get("color") || "").trim(),
      material: String(data.get("material") || "").trim(),
      fit: String(data.get("fit") || "").trim(),
      badge: String(data.get("badge") || "").trim(),
      care: String(data.get("care") || "").trim(),
      sizeStock,
      sizes: Object.keys(sizeStock),
      image: primaryImage,
      images: extraImages,
      description: String(data.get("description") || "").trim(),
    };
    if (uploadFailed && !primaryImage) {
      showToast("No se guardo: sube imagen cuando Cloudinary este configurado o pega una URL.");
      return;
    }
    if (!primaryImage) {
      showToast("Anade una imagen o URL antes de guardar el producto.");
      return;
    }
    if (!updated.name) {
      showToast("El nombre es obligatorio");
      return;
    }
    if (updated.price < 0) {
      showToast("El precio no puede ser negativo");
      return;
    }
    if (updated.salePrice !== null && updated.salePrice > updated.price) {
      showToast("La oferta no puede superar el precio base");
      return;
    }

    const next = isEdit
      ? products.map((p) => (productKey(p) === productKey(draft) ? updated : p))
      : [updated, ...products];

    if (!isEdit) {
      const publishMode = String(data.get("publishMode") || "immediate");
      if (publishMode === "scheduled") {
        const publishAtRaw = String(data.get("publishAt") || "");
        if (!publishAtRaw) {
          showToast("Indica fecha y hora para publicación programada");
          return;
        }
        const runAtDate = new Date(publishAtRaw);
        if (Number.isNaN(runAtDate.getTime()) || runAtDate.getTime() <= Date.now()) {
          showToast("Fecha/hora programada no válida o en el pasado");
          return;
        }
        const job = {
          id: `sch-${Date.now()}`,
          status: "pending",
          createdAt: new Date().toISOString(),
          runAt: runAtDate.toISOString(),
          products: [{ ...updated }],
        };
        saveSchedules([job, ...getSchedules()]);
        addAuditLog("PRODUCT_CREATE_SCHEDULED", `${updated.name} [${productRef(updated)}] para ${job.runAt}`);
        showToast("Artículo programado");
        renderProductos();
        return;
      }
    }

    await saveProducts(next);
    addAuditLog(isEdit ? "PRODUCT_UPDATE" : "PRODUCT_CREATE", `${updated.name} [${productRef(updated)}]`);
    showToast(isEdit ? "Producto actualizado" : "Producto creado");
    renderProductos();
  });
}

function renderChart(canvasId, points) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  const w = rect.width;
  const h = rect.height;
  const pad = { top: 20, right: 12, bottom: 34, left: 36 };
  const max = Math.max(...points.map((p) => p.amount), 1);
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = pad.left + (chartW / Math.max(points.length - 1, 1)) * i;
    const y = pad.top + chartH - (p.amount / max) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = "#2563eb";
  points.forEach((p, i) => {
    const x = pad.left + (chartW / Math.max(points.length - 1, 1)) * i;
    const y = pad.top + chartH - (p.amount / max) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#64748b";
  ctx.font = "12px Inter, Segoe UI, Arial, sans-serif";
  points.forEach((p, i) => {
    const x = pad.left + (chartW / Math.max(points.length - 1, 1)) * i;
    ctx.fillText(p.label, x - 10, h - 10);
  });
}

async function renderInicio() {
  const orders = await getOrders();
  const users = getUsers().filter((u) => u.active);
  const currentUser = getSessionUser();
  const permissions = getPermissions();
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const productsCount = await getProductsCount();
  const pendingCount = orders.filter((o) => o.status === "Pendiente").length;
  const customersCount = new Set(orders.map((o) => o.customer)).size;
  const salesData = getSalesData();
  const kpiCards = [
    permissions.canViewBilling
      ? `<article class="card"><p class="kpi-label">Ventas totales</p><p class="kpi-value">${money.format(totalRevenue)}</p></article>`
      : "",
    permissions.canEditOrders
      ? `<article class="card"><p class="kpi-label">Pedidos pendientes</p><p class="kpi-value">${pendingCount}</p></article>`
      : "",
    `<article class="card"><p class="kpi-label">Clientes activos</p><p class="kpi-value">${customersCount}</p></article>`,
    permissions.canEditProducts
      ? `<article class="card"><p class="kpi-label">Productos</p><p class="kpi-value">${productsCount}</p></article>`
      : "",
  ].filter(Boolean).join("");

  routeTitle.textContent = "Inicio";
  view.innerHTML = `
    <section class="kpi-grid">
      ${kpiCards || '<article class="card"><p class="kpi-label">Panel</p><p class="kpi-value">Sin modulos asignados</p></article>'}
    </section>
    <section class="two-col">
      ${permissions.canViewBilling ? `
      <article class="card">
        <h2>Ventas por ${getSalesMode() === "meses" ? "mes" : "dia"}</h2>
        <div class="chart-wrap"><canvas id="sales-chart"></canvas></div>
      </article>` : ""}
      ${permissions.canEditOrders ? `
      <article class="card">
        <h2>Resumen estados</h2>
        <div class="list">
          ${STATUS.map((status) => `<div class="list-row"><span>${status}</span><strong>${orders.filter((o) => o.status === status).length}</strong></div>`).join("")}
        </div>
      </article>` : ""}
    </section>
    <article class="card">
      <h2>Acceso por usuario</h2>
      <form id="switch-user-form" class="form-grid" style="margin:0 0 12px;">
        <div class="field">
          <label for="switch-user-id">Usuario</label>
          <select id="switch-user-id" name="userId">
            ${users.map((u) => `<option value="${u.id}" ${currentUser?.id === u.id ? "selected" : ""}>${escapeHtml(u.name)} (${u.role})</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="switch-user-password">Contraseña</label>
          <input id="switch-user-password" name="password" type="password" autocomplete="current-password" placeholder="Contraseña de acceso">
        </div>
      </form>
      <div class="table-actions" style="margin-bottom:12px;">
        <button id="switch-user-btn" class="btn btn-soft">Entrar con este usuario</button>
      </div>
      <p class="muted" style="margin-bottom:12px;">Sesion activa: ${escapeHtml(currentUser?.name || "-")} (${escapeHtml(currentUser?.role || "-")}).</p>
    </article>
    ${permissions.canEditOrders ? `<article class="card">
      <h2>Ultimos pedidos</h2>
      ${renderOrdersTable(orders.slice(0, 5))}
    </article>` : ""}
  `;
  if (permissions.canViewBilling) {
    renderChart("sales-chart", salesData);
  }
  document.querySelector("#switch-user-btn")?.addEventListener("click", async () => {
    const userId = String(document.querySelector("#switch-user-id")?.value || "");
    const password = String(document.querySelector("#switch-user-password")?.value || "");
    const target = getUserById(userId);
    if (!target) {
      showToast("Usuario no encontrado");
      return;
    }
    const apiResult = await authenticateAdmin(target, password, "SESSION_LOGIN");
    if (apiResult.ok) {
      showToast(apiResult.mode === "fallback" ? `Sesion iniciada (modo emergencia): ${apiResult.user.name}` : `Sesion iniciada: ${apiResult.user.name}`);
      render();
      return;
    }
    if (apiResult.reason === "locked") {
      showToast(`Usuario bloqueado. Intenta en ${minutesLeft(target)} min`);
      return;
    }
    if (apiResult.reason === "api-unavailable") {
      showToast("API no disponible. Revisa el backend antes de acceder al admin.");
      return;
    }
    showToast("Credenciales invalidas");
    return;
    if (isUserLocked(target)) {
      showToast(`Usuario bloqueado. Intenta en ${minutesLeft(target)} min`);
      return;
    }
    if (!await verifyUserPassword(target, password)) {
      recordFailedLogin(target.id);
      addAuditLog("LOGIN_FAILED", `Intento fallido: ${target.name}`);
      showToast("Contraseña incorrecta");
      return;
    }
    recordSuccessfulLogin(target.id);
    beginSessionForUser(target);
    addAuditLog("SESSION_LOGIN", `Inicio de sesion: ${target.name}`);
    showToast(`Sesion iniciada: ${target.name}`);
    render();
  });
}

async function renderPedidos() {
  const orders = await getOrders();
  const users = getUsers().filter((u) => u.active);
  const filter = load("dcosta-admin-orders-filter", { q: "", status: "all", assignedTo: "all" });
  const filtered = orders.filter((o) => {
    const q = String(filter.q || "").trim().toLowerCase();
    const hay = `${o.id} ${o.customer || ""} ${o.status || ""} ${o.email || ""}`.toLowerCase();
    const byQ = !q || hay.includes(q);
    const byStatus = filter.status === "all" || normalizeOrderStatus(o.status) === filter.status;
    const byAssigned = filter.assignedTo === "all" || (o.assignedTo || "") === filter.assignedTo;
    return byQ && byStatus && byAssigned;
  });
  routeTitle.textContent = "Pedidos";
  view.innerHTML = `
    <article class="card">
      <h2>Gestión de pedidos</h2>
      <div class="toolbar">
        <input id="orders-q" placeholder="Buscar pedido, cliente o email" value="${escapeHtml(filter.q || "")}">
        <select id="orders-status">
          <option value="all" ${filter.status === "all" ? "selected" : ""}>Todos los estados</option>
          ${ORDER_STATUSES.map((s) => `<option value="${s}" ${filter.status === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
        <select id="orders-assigned">
          <option value="all" ${filter.assignedTo === "all" ? "selected" : ""}>Todos los responsables</option>
          ${users.map((u) => `<option value="${u.id}" ${filter.assignedTo === u.id ? "selected" : ""}>${escapeHtml(u.name)}</option>`).join("")}
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Responsable</th><th>Notas internas</th><th>Acción</th></tr></thead>
          <tbody>
            ${filtered.length ? filtered.map((o) => `
              <tr>
                <td>${escapeHtml(o.id)}</td>
                <td>${escapeHtml(o.customer || "-")}</td>
                <td>${formatLocalDateTime(o.createdAt || o.date)}</td>
                <td>${money.format(Number(o.total || 0))}</td>
                <td>
                  <select data-order-status="${escapeHtml(o.id)}" class="inline-select order-status">
                    ${ORDER_STATUSES.map((s) => `<option value="${s}" ${normalizeOrderStatus(o.status) === s ? "selected" : ""}>${s}</option>`).join("")}
                  </select>
                </td>
                <td>
                  <select data-order-assigned="${escapeHtml(o.id)}" class="inline-select">
                    <option value="">Sin asignar</option>
                    ${users.map((u) => `<option value="${u.id}" ${o.assignedTo === u.id ? "selected" : ""}>${escapeHtml(u.name)}</option>`).join("")}
                  </select>
                </td>
                <td><input class="inline-input order-notes" data-order-notes="${escapeHtml(o.id)}" value="${escapeHtml(o.notes || "")}" placeholder="Seguimiento, incidencia, observación..."></td>
                <td><button class="btn btn-soft" data-order-save="${escapeHtml(o.id)}">Guardar</button></td>
              </tr>
              <tr class="order-detail-row">
                <td colspan="8">${renderOrderDetail(o, users)}</td>
              </tr>
            `).join("") : `<tr><td colspan="8" class="muted">No hay pedidos con ese filtro.</td></tr>`}
          </tbody>
        </table>
      </div>
    </article>
  `;

  const persist = () => {
    save("dcosta-admin-orders-filter", {
      q: document.querySelector("#orders-q")?.value || "",
      status: document.querySelector("#orders-status")?.value || "all",
      assignedTo: document.querySelector("#orders-assigned")?.value || "all",
    });
  };
  document.querySelector("#orders-q")?.addEventListener("input", () => { persist(); render(); });
  document.querySelector("#orders-status")?.addEventListener("change", () => { persist(); render(); });
  document.querySelector("#orders-assigned")?.addEventListener("change", () => { persist(); render(); });

  view.querySelectorAll("[data-order-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.orderSave;
      const currentOrders = await getOrders();
      const next = currentOrders.map((o) => {
        if (o.id !== id) return o;
        const status = String(view.querySelector(`[data-order-status="${CSS.escape(id)}"]`)?.value || "Pendiente");
        const assignedTo = String(view.querySelector(`[data-order-assigned="${CSS.escape(id)}"]`)?.value || "");
        const notes = String(view.querySelector(`[data-order-notes="${CSS.escape(id)}"]`)?.value || "");
        const normalized = normalizeOrderStatus(status);
        const history = [...(o.statusHistory || [])];
        if (normalizeOrderStatus(o.status) !== normalized) {
          history.unshift({ at: new Date().toISOString(), from: normalizeOrderStatus(o.status), to: normalized, actor: getSessionUser()?.name || "Sistema" });
        }
        return { ...o, status: normalized, assignedTo, notes, statusHistory: history };
      });
      await saveOrders(next);
      addAuditLog("ORDER_UPDATE", `Pedido ${id} actualizado`);
      showToast("Pedido actualizado");
      render();
    });
  });
}

async function renderVentas() {
  const mode = getSalesMode();
  const orders = await getOrders();
  const grouped = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt || o.date || new Date().toISOString());
    let key = "";
    if (mode === "dias") key = d.toISOString().slice(0, 10);
    else if (mode === "meses") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    else key = String(d.getFullYear());
    grouped[key] = (grouped[key] || 0) + Number(o.total || 0);
  });
  const keys = Object.keys(grouped).sort();
  const data = keys.length
    ? keys.map((k) => ({ label: k, amount: grouped[k] }))
    : getSalesData();
  const total = data.reduce((sum, p) => sum + p.amount, 0);
  routeTitle.textContent = "Ventas";
  view.innerHTML = `
    <section class="kpi-grid">
      <article class="card"><p class="kpi-label">Periodo</p><p class="kpi-value">${mode === "meses" ? "Meses" : "Dias"}</p></article>
      <article class="card"><p class="kpi-label">Ventas acumuladas</p><p class="kpi-value">${money.format(total)}</p></article>
      <article class="card"><p class="kpi-label">Pico</p><p class="kpi-value">${money.format(Math.max(...data.map((x) => x.amount)))}</p></article>
      <article class="card"><p class="kpi-label">Media</p><p class="kpi-value">${money.format(total / data.length)}</p></article>
    </section>
    <article class="card">
      <h2>Grafica de ventas</h2>
      <div class="field" style="max-width:220px;margin-bottom:14px;">
        <label for="sales-mode">Vista</label>
        <select id="sales-mode">
          <option value="dias" ${mode === "dias" ? "selected" : ""}>Por dias</option>
          <option value="meses" ${mode === "meses" ? "selected" : ""}>Por meses</option>
          <option value="anios" ${mode === "anios" ? "selected" : ""}>Por años</option>
        </select>
      </div>
      <div class="chart-wrap"><canvas id="sales-chart"></canvas></div>
    </article>
  `;
  document.querySelector("#sales-mode").addEventListener("change", (event) => {
    save("dcosta-admin-sales-mode", event.target.value);
    render();
  });
  renderChart("sales-chart", data);
}

async function renderClientes() {
  const orders = await getOrders();
  const profile = load("dcosta-client-profile", {});
  const account = load("dcosta-client-account", null);
  const session = load("dcosta-client-session", null);
  const knownEmail = account?.email || profile.email || session?.email || "";
  const knownPhone = profile.phone || account?.phone || "";
  const knownDni = profile.dni || account?.dni || "";
  const customers = Object.values(
    orders.reduce((acc, order) => {
      if (!acc[order.customer]) {
        acc[order.customer] = {
          name: order.customer,
          orders: 0,
          spent: 0,
          email: order.email || knownEmail || "",
          phone: order.phone || knownPhone || "",
          dni: order.dni || knownDni || "",
        };
      }
      acc[order.customer].orders += 1;
      acc[order.customer].spent += order.total;
      if (!acc[order.customer].email && order.email) acc[order.customer].email = order.email;
      if (!acc[order.customer].phone && order.phone) acc[order.customer].phone = order.phone;
      if (!acc[order.customer].dni && order.dni) acc[order.customer].dni = order.dni;
      return acc;
    }, {}),
  );

  if (!customers.length && (knownEmail || knownPhone || knownDni)) {
    customers.push({
      name: profile.name || account?.name || "Cliente local",
      orders: 0,
      spent: 0,
      email: knownEmail,
      phone: knownPhone,
      dni: knownDni,
    });
  }

  routeTitle.textContent = "Clientes";
  view.innerHTML = `
    <article class="card">
      <h2>Clientes y actividad</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Cliente</th><th>Teléfono</th><th>Email</th><th>DNI</th><th>Pedidos</th><th>Gasto total</th></tr></thead>
          <tbody>${customers.map((c) => `<tr><td>${c.name}</td><td>${c.phone || "No disponible"}</td><td>${c.email || "No disponible"}</td><td>${c.dni || "No disponible"}</td><td>${c.orders}</td><td>${money.format(c.spent)}</td></tr>`).join("")}</tbody>
        </table>
      </div>
    </article>
  `;
}

async function renderFacturacion() {
  const orders = await getOrders();
  const config = getInvoiceConfig();
  const formatter = new Intl.NumberFormat("es-ES", { style: "currency", currency: config.currency || "EUR" });
  const period = load("dcosta-admin-billing-period", "mes");
  const now = new Date();
  const orderDate = (o) => new Date(o.createdAt || o.date || now.toISOString());
  const inPeriod = (o) => {
    const d = orderDate(o);
    if (period === "dia") {
      return d.toDateString() === now.toDateString();
    }
    if (period === "semana") {
      const start = new Date(now);
      const day = (now.getDay() + 6) % 7;
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return d >= start && d < end;
    }
    if (period === "mes") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    return d.getFullYear() === now.getFullYear();
  };
  const scopedOrders = orders.filter(inPeriod);
  const ingresos = scopedOrders.reduce((sum, o) => sum + o.total, 0);
  const impuestos = ingresos * config.taxRate;
  const neto = ingresos - impuestos;

  routeTitle.textContent = "Facturacion";
  view.innerHTML = `
    <section class="kpi-grid">
      <article class="card"><p class="kpi-label">Ingresos</p><p class="kpi-value">${formatter.format(ingresos)}</p></article>
      <article class="card"><p class="kpi-label">Impuestos estimados</p><p class="kpi-value">${formatter.format(impuestos)}</p></article>
      <article class="card"><p class="kpi-label">Total neto</p><p class="kpi-value">${formatter.format(neto)}</p></article>
      <article class="card"><p class="kpi-label">Pedidos del periodo</p><p class="kpi-value">${scopedOrders.length}</p></article>
    </section>
    <article class="card">
      <h2>Parametros de facturacion</h2>
      <form id="invoice-form" class="form-grid">
        <div class="field">
          <label for="billing-period">Periodo</label>
          <select id="billing-period">
            <option value="dia" ${period === "dia" ? "selected" : ""}>Días</option>
            <option value="semana" ${period === "semana" ? "selected" : ""}>Semanas</option>
            <option value="mes" ${period === "mes" ? "selected" : ""}>Meses</option>
            <option value="anio" ${period === "anio" ? "selected" : ""}>Años</option>
          </select>
        </div>
        <div class="field">
          <label for="tax-rate">Impuesto estimado (%)</label>
          <input id="tax-rate" type="number" min="0" max="100" step="0.1" value="${(config.taxRate * 100).toFixed(1)}">
        </div>
        <div class="field">
          <label for="currency">Moneda</label>
          <select id="currency">
            <option value="EUR" ${(config.currency || "EUR") === "EUR" ? "selected" : ""}>EUR</option>
            <option value="USD" ${config.currency === "USD" ? "selected" : ""}>USD</option>
            <option value="GBP" ${config.currency === "GBP" ? "selected" : ""}>GBP</option>
          </select>
        </div>
      </form>
    </article>
  `;
  document.querySelector("#tax-rate").addEventListener("change", (event) => {
    const next = Number(event.target.value);
    (async () => {
      if (!await requireManagerReauth("Cambiar IVA")) {
        render();
        return;
      }
      if (Number.isFinite(next) && next >= 0) {
        save("dcosta-admin-invoice", { taxRate: next / 100 });
        addAuditLog("INVOICE_TAX_UPDATE", `IVA actualizado a ${next}%`);
        render();
      }
    })();
  });
  document.querySelector("#currency").addEventListener("change", (event) => {
    (async () => {
      if (!await requireManagerReauth("Cambiar moneda")) {
        render();
        return;
      }
      save("dcosta-admin-invoice", { ...config, currency: event.target.value });
      addAuditLog("INVOICE_CURRENCY_UPDATE", `Moneda: ${event.target.value}`);
      render();
    })();
  });
  document.querySelector("#billing-period").addEventListener("change", (event) => {
    save("dcosta-admin-billing-period", event.target.value);
    render();
  });
}

async function renderInventario() {
  const products = await (window.DCOSTA_STORE_API?.getProducts?.() || Promise.resolve([]));
  routeTitle.textContent = "Inventario";
  view.innerHTML = `
    <article class="card">
      <h2>Stock simulado</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Ref</th><th>Producto</th><th>Categoria</th><th>Precio</th><th>Uds</th><th>Tallas</th><th>Estado</th></tr></thead>
          <tbody>
            ${products.slice(0, 20).map((p) => `
              <tr>
                <td>${productRef(p) || "-"}</td>
                <td>${p.name || "-"}</td>
                <td>${p.categoryLabel || p.category || "-"}</td>
                <td>${money.format(Number(p.price) || 0)}</td>
                <td>${totalUnits(p)}</td>
                <td>${formatSizeStock(normalizeSizeStock(p)) || "-"}</td>
                <td>${p.stock || "Disponible"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <p class="muted" style="margin-top:10px;">Conectado a la capa de datos local/API para migracion posterior.</p>
    </article>
  `;
}

function renderConfiguracion() {
  const permissions = getPermissions();
  if (!permissions.canConfig) {
    routeTitle.textContent = "Configuracion";
    view.innerHTML = `<article class="card"><h2>Sin permisos</h2><p class="muted">Tu rol actual no permite editar configuracion.</p></article>`;
    return;
  }
  const config = load("dcosta-admin-config", {
    businessName: "DCOSTA GS STUDIO",
    legalName: "DCOSTA GS STUDIO S.L.",
    taxId: "B00000000",
    managerName: "Gerencia General",
    email: "gerencia@dcostagsstudio.com",
    phone: "+34 623 46 86 79",
    timezone: "Europe/Madrid",
    currency: "EUR",
    taxRate: "21",
    orderPrefix: "PED",
    paymentMethods: "Tarjeta, Bizum, Transferencia",
    shippingMethods: "Recogida en tienda, Envio estandar",
    returnPolicyDays: "14",
    notes: "Configuracion simulada preparada para API real.",
  });
  routeTitle.textContent = "Configuracion";
  view.innerHTML = `
    <article class="card">
      <h2>Configuracion general</h2>
      <form id="config-form" class="form-grid">
        <div class="field">
          <label for="business-name">Nombre comercial</label>
          <input id="business-name" name="businessName" value="${config.businessName}">
        </div>
        <div class="field">
          <label for="legal-name">Razon social</label>
          <input id="legal-name" name="legalName" value="${config.legalName}">
        </div>
        <div class="field">
          <label for="tax-id">CIF/NIF</label>
          <input id="tax-id" name="taxId" value="${config.taxId}">
        </div>
        <div class="field">
          <label for="manager-name">Responsable</label>
          <input id="manager-name" name="managerName" value="${config.managerName}">
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" value="${config.email}">
        </div>
        <div class="field">
          <label for="phone">Telefono</label>
          <input id="phone" name="phone" value="${config.phone}">
        </div>
        <div class="field">
          <label for="timezone">Zona horaria</label>
          <input id="timezone" name="timezone" value="${config.timezone}">
        </div>
        <div class="field">
          <label for="config-currency">Moneda base</label>
          <select id="config-currency" name="currency">
            <option value="EUR" ${config.currency === "EUR" ? "selected" : ""}>EUR</option>
            <option value="USD" ${config.currency === "USD" ? "selected" : ""}>USD</option>
            <option value="GBP" ${config.currency === "GBP" ? "selected" : ""}>GBP</option>
          </select>
        </div>
        <div class="field">
          <label for="tax-rate-config">IVA (%)</label>
          <input id="tax-rate-config" name="taxRate" type="number" min="0" max="100" step="0.1" value="${config.taxRate}">
        </div>
        <div class="field">
          <label for="order-prefix">Prefijo pedidos</label>
          <input id="order-prefix" name="orderPrefix" value="${config.orderPrefix}">
        </div>
        <div class="field full">
          <label for="payment-methods">Metodos de pago</label>
          <input id="payment-methods" name="paymentMethods" value="${config.paymentMethods}">
        </div>
        <div class="field full">
          <label for="shipping-methods">Metodos de envio</label>
          <input id="shipping-methods" name="shippingMethods" value="${config.shippingMethods}">
        </div>
        <div class="field">
          <label for="return-policy-days">Devoluciones (dias)</label>
          <input id="return-policy-days" name="returnPolicyDays" type="number" min="0" step="1" value="${config.returnPolicyDays}">
        </div>
        <div class="field">
          <label for="inactivity-minutes">Bloqueo por inactividad (min)</label>
          <input id="inactivity-minutes" name="inactivityMinutes" type="number" min="1" step="1" value="${Number(getSessionSettings().inactivityMinutes || 15)}">
        </div>
        <div class="field full">
          <label for="notes">Notas</label>
          <textarea id="notes" name="notes">${config.notes}</textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;grid-column:1/-1;">
          <button class="btn" type="submit">Guardar configuracion</button>
        </div>
      </form>
    </article>
  `;
  document.querySelector("#config-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!await requireManagerReauth("Guardar configuracion")) return;
    const data = new FormData(event.currentTarget);
    save("dcosta-admin-config", {
      businessName: String(data.get("businessName") || ""),
      legalName: String(data.get("legalName") || ""),
      taxId: String(data.get("taxId") || ""),
      managerName: String(data.get("managerName") || ""),
      email: String(data.get("email") || ""),
      phone: String(data.get("phone") || ""),
      timezone: String(data.get("timezone") || ""),
      currency: String(data.get("currency") || "EUR"),
      taxRate: String(data.get("taxRate") || "21"),
      orderPrefix: String(data.get("orderPrefix") || "PED"),
      paymentMethods: String(data.get("paymentMethods") || ""),
      shippingMethods: String(data.get("shippingMethods") || ""),
      returnPolicyDays: String(data.get("returnPolicyDays") || "14"),
      notes: String(data.get("notes") || ""),
    });
    save("dcosta-admin-invoice", {
      taxRate: Math.max(0, Number(data.get("taxRate") || 21)) / 100,
      currency: String(data.get("currency") || "EUR"),
    });
    save(SESSION_SETTINGS_KEY, {
      inactivityMinutes: Math.max(1, Number(data.get("inactivityMinutes") || 15)),
    });
    addAuditLog("CONFIG_UPDATE", "Configuracion general actualizada");
    showToast("Configuracion guardada");
  });
}

function getDeletedProductAuditItems(logs) {
  return logs.flatMap((log) => {
    if (!["PRODUCT_DELETE", "PRODUCT_BULK_DELETE"].includes(log.action)) return [];
    const products = Array.isArray(log.products) ? log.products : [];
    return products
      .filter((product) => product && productKey(product))
      .map((product) => ({
        logId: log.id,
        deletedAt: log.at,
        actorName: log.actorName,
        product,
      }));
  });
}

async function renderAuditoria() {
  const logs = load("dcosta-admin-audit-log", []);
  const permissions = getPermissions();
  const products = await getProducts();
  const existingKeys = new Set(products.map((product) => productKey(product)));
  const deletedItems = getDeletedProductAuditItems(logs);
  routeTitle.textContent = "Auditoria";
  view.innerHTML = `
    <article class="card">
      <h2>Productos eliminados recuperables</h2>
      <p class="muted" style="margin-bottom:12px;">Cuando elimines productos desde admin, apareceran aqui para poder anadirlos otra vez al catalogo.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Fecha baja</th><th>Producto</th><th>Ref</th><th>Categoria</th><th>Estado</th><th>Accion</th></tr></thead>
          <tbody>
            ${deletedItems.length ? deletedItems.map((item, index) => {
              const exists = existingKeys.has(productKey(item.product));
              return `
              <tr>
                <td>${new Date(item.deletedAt).toLocaleString("es-ES")}</td>
                <td>${escapeHtml(item.product.name || "-")}</td>
                <td>${escapeHtml(productRef(item.product) || productKey(item.product))}</td>
                <td>${escapeHtml(item.product.categoryLabel || item.product.category || "-")}</td>
                <td><span class="status-chip">${exists ? "Ya esta en catalogo" : "Eliminado"}</span></td>
                <td><button class="btn btn-soft" data-restore-product="${index}" ${(exists || !permissions.canEditProducts) ? "disabled" : ""}>Anadir al catalogo</button></td>
              </tr>
              `;
            }).join("") : '<tr><td colspan="6" class="muted">No hay productos eliminados recuperables.</td></tr>'}
          </tbody>
        </table>
      </div>
    </article>
    <article class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">
        <h2>Historial de cambios</h2>
        <button id="clear-audit" class="btn btn-soft">Limpiar historial</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Accion</th><th>Detalle</th></tr></thead>
          <tbody>
            ${logs.length ? logs.map((l) => `
              <tr>
                <td>${new Date(l.at).toLocaleString("es-ES")}</td>
                <td>${escapeHtml(l.actorName)}</td>
                <td>${escapeHtml(l.actorRole)}</td>
                <td>${escapeHtml(l.action)}</td>
                <td>${escapeHtml(l.detail || "-")}</td>
              </tr>
            `).join("") : '<tr><td colspan="5" class="muted">Sin eventos todavia.</td></tr>'}
          </tbody>
        </table>
      </div>
    </article>
  `;
  document.querySelector("#clear-audit")?.addEventListener("click", () => {
    if (!window.confirm("Eliminar historial de auditoria?")) return;
    save("dcosta-admin-audit-log", []);
    showToast("Historial limpio");
    renderAuditoria();
  });
  view.querySelectorAll("[data-restore-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      const item = deletedItems[Number(button.dataset.restoreProduct)];
      if (!item?.product) return;

      const currentProducts = await getProducts();
      const exists = currentProducts.some((product) => productKey(product) === productKey(item.product));
      if (exists) {
        showToast("El producto ya esta en catalogo");
        renderAuditoria();
        return;
      }

      const restored = cloneProductForAudit(item.product);
      await saveProducts([restored, ...currentProducts]);
      addAuditLog("PRODUCT_RESTORE_FROM_AUDIT", `Restaurado desde auditoria: ${restored.name || productKey(restored)} [${productRef(restored)}]`, {
        sourceLogId: item.logId,
        products: [cloneProductForAudit(restored)],
      });
      showToast("Producto anadido al catalogo");
      renderAuditoria();
    });
  });
}

async function renderUsuarios() {
  const permissions = getPermissions();
  const users = getUsers();
  const current = getSessionUser();
  const currentRank = getUserRank(current);
  const goals = getUserGoals();
  const orders = await getOrders();
  const userPerfMap = orders.reduce((acc, order) => {
    const key = order.assignedTo || "";
    if (!key) return acc;
    if (!acc[key]) acc[key] = { sales: 0, orders: 0 };
    acc[key].sales += Number(order.total || 0);
    acc[key].orders += 1;
    return acc;
  }, {});
  routeTitle.textContent = "Usuarios";
  view.innerHTML = `
    <article class="card">
      <h2>Sesion y roles</h2>
      <div class="form-grid" style="margin-bottom:12px;">
        <div class="field">
          <label for="session-user">Usuario activo</label>
          <select id="session-user">
            ${users.filter((u) => u.active).map((u) => `<option value="${u.id}" ${current?.id === u.id ? "selected" : ""}>${escapeHtml(u.name)} (${u.role})</option>`).join("")}
          </select>
        </div>
      </div>
      <p class="muted">Usuario actual: ${escapeHtml(current?.name || "-")} (${escapeHtml(current?.role || "empleado")}).</p>
      <p class="muted">Estructura: Director > Gerencia > Empleado.</p>
    </article>
    <article class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">
        <h2>Gestion de usuarios</h2>
        <button id="new-user" class="btn" ${permissions.canManageUsers ? "" : "disabled"}>Nuevo usuario</button>
      </div>
      <div id="user-form-shell"></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Activo</th><th>Gestión</th></tr></thead>
          <tbody>
            ${users.map((u) => `
              <tr>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td>${escapeHtml(u.role)}</td>
                <td>${u.active ? "Si" : "No"}</td>
                <td>
                  <details class="user-menu">
                    <summary class="btn btn-soft">Gestionar</summary>
                    <div class="user-menu-panel">
                      <div class="user-menu-section">
                        <h3>Permisos</h3>
                        <div class="table-actions">
                          <label><input type="checkbox" data-perm="${u.id}:canEditProducts" ${(u.permissions?.canEditProducts ?? true) ? "checked" : ""} ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}> Productos</label>
                          <label><input type="checkbox" data-perm="${u.id}:canDelete" ${u.permissions?.canDelete ? "checked" : ""} ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}> Eliminar</label>
                          <label><input type="checkbox" data-perm="${u.id}:canBulkPrice" ${u.permissions?.canBulkPrice ? "checked" : ""} ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}> Precio lote</label>
                          <label><input type="checkbox" data-perm="${u.id}:canEditOrders" ${u.permissions?.canEditOrders ? "checked" : ""} ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}> Pedidos</label>
                          <label><input type="checkbox" data-perm="${u.id}:canViewBilling" ${(u.permissions?.canViewBilling ?? true) ? "checked" : ""} ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}> Facturación</label>
                          <label><input type="checkbox" data-perm="${u.id}:canConfig" ${u.permissions?.canConfig ? "checked" : ""} ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}> Configuración</label>
                          <label><input type="checkbox" data-perm="${u.id}:canManageUsers" ${u.permissions?.canManageUsers ? "checked" : ""} ${(permissions.canManageUsers && canManageTargetUser(current, u) && u.id !== current?.id) ? "" : "disabled"}> Usuarios</label>
                        </div>
                      </div>
                      <div class="user-menu-section">
                        <h3>Objetivos</h3>
                        <div class="form-grid">
                          <div class="field">
                            <label>Objetivo mensual (€)</label>
                            <input type="number" min="0" step="1" data-goal-sales="${u.id}" value="${Number(goals[u.id]?.monthlySales || 0)}">
                          </div>
                          <div class="field">
                            <label>Pedidos objetivo</label>
                            <input type="number" min="0" step="1" data-goal-orders="${u.id}" value="${Number(goals[u.id]?.monthlyOrders || 0)}">
                          </div>
                        </div>
                        <button class="btn btn-soft" data-save-goals="${u.id}" ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}>Guardar objetivos</button>
                      </div>
                      <div class="user-menu-section">
                        <h3>Rendimiento (simulado)</h3>
                        <p class="muted">Ventas asignadas: ${money.format(Number(userPerfMap[u.id]?.sales || 0))}</p>
                        <p class="muted">Pedidos asignados: ${Number(userPerfMap[u.id]?.orders || 0)}</p>
                        <p class="muted">Objetivo ventas: ${money.format(Number(goals[u.id]?.monthlySales || 0))}</p>
                        <p class="muted">Objetivo pedidos: ${Number(goals[u.id]?.monthlyOrders || 0)}</p>
                        <p class="muted">Cumplimiento ventas: ${Number(goals[u.id]?.monthlySales || 0) > 0 ? `${Math.min(100, Math.round((Number(userPerfMap[u.id]?.sales || 0) / Number(goals[u.id]?.monthlySales || 1)) * 100))}%` : "Sin objetivo"}</p>
                      </div>
                      <div class="user-menu-section">
                        <h3>Acciones</h3>
                        <div class="table-actions">
                          <input class="inline-input" data-password-user="${u.id}" type="password" placeholder="Nueva contraseña" ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}>
                          <button class="btn btn-soft" data-save-password="${u.id}" ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}>Cambiar contraseña</button>
                          <button class="btn btn-soft" data-toggle-user="${u.id}" ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}>${u.active ? "Desactivar" : "Activar"}</button>
                          <button class="btn btn-soft" data-reset-lock="${u.id}" ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}>Reset seguridad</button>
                          <button class="btn btn-soft" data-force-logout="${u.id}" ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}>Forzar cierre sesión</button>
                          <button class="btn btn-danger" data-delete-user="${u.id}" ${(permissions.canManageUsers && canManageTargetUser(current, u)) ? "" : "disabled"}>Eliminar</button>
                        </div>
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;

  document.querySelector("#session-user")?.addEventListener("change", (event) => {
    save("dcosta-admin-session-user-id", event.target.value);
    addAuditLog("SESSION_USER_SWITCH", `Sesion cambiada a ${event.target.value}`);
    renderUsuarios();
  });

  document.querySelector("#new-user")?.addEventListener("click", () => {
    const shell = document.querySelector("#user-form-shell");
    shell.innerHTML = `
      <form id="user-form" class="form-grid" style="margin-bottom:12px;">
        <div class="field"><label>Nombre</label><input name="name" required></div>
        <div class="field"><label>Email</label><input name="email" type="email" required></div>
        <div class="field"><label>Rol</label><select name="role">${currentRank >= ROLE_RANK.director ? '<option value="empleado">empleado</option><option value="gerencia">gerencia</option><option value="director">director</option>' : '<option value="empleado">empleado</option>'}</select></div>
        <div class="field"><label>Contraseña</label><input name="password" type="password" required></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;grid-column:1/-1;">
          <button type="button" id="cancel-user-form" class="btn btn-soft">Cancelar</button>
          <button class="btn" type="submit">Crear usuario</button>
        </div>
      </form>
    `;
    shell.querySelector("#cancel-user-form").addEventListener("click", () => { shell.innerHTML = ""; });
    shell.querySelector("#user-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!await requireManagerReauth("Crear usuario")) return;
      const data = new FormData(e.currentTarget);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const role = String(data.get("role") || "empleado");
      const password = String(data.get("password") || "");
      if (!name || !email) {
        showToast("Nombre y email obligatorios");
        return;
      }
      const policyError = validatePasswordPolicy(password);
      if (policyError) {
        showToast(policyError);
        return;
      }
      const nextPermissions =
        role === "director"
          ? { ...DIRECTOR_PERMISSIONS }
          : role === "gerencia"
            ? { ...GERENCIA_PERMISSIONS }
            : { ...DEFAULT_PERMISSIONS, canEditProducts: true };
      const hashed = await hashPassword(password);
      const next = [{
        id: `u-${Date.now()}`,
        name,
        email,
        role,
        password: hashed,
        active: true,
        failedAttempts: 0,
        lockedUntil: 0,
        authVersion: 1,
        permissions: nextPermissions,
      }, ...users];
      save("dcosta-admin-users", next);
      addAuditLog("USER_CREATE", `${name} (${role})`);
      showToast("Usuario creado");
      renderUsuarios();
    });
  });

  view.querySelectorAll("[data-save-password]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.savePassword;
      const password = String(view.querySelector(`[data-password-user="${CSS.escape(id)}"]`)?.value || "");
      if (password.length < 8) {
        showToast("La contraseña debe tener al menos 8 caracteres");
        return;
      }
      const hashed = await hashPassword(password);
      const next = users.map((u) => (
        u.id === id
          ? {
            ...u,
            password: hashed,
            authVersion: Number(u.authVersion || 1) + 1,
            failedAttempts: 0,
            lockedUntil: 0,
          }
          : u
      ));
      save("dcosta-admin-users", next);
      addAuditLog("USER_PASSWORD_UPDATE", `Contraseña actualizada para ${id}`);
      showToast("Contraseña actualizada");
      renderUsuarios();
    });
  });

  view.querySelectorAll("[data-perm]").forEach((input) => {
    input.addEventListener("change", () => {
      const [userId, permKey] = String(input.dataset.perm || "").split(":");
      if (!userId || !permKey) return;
      const target = users.find((u) => u.id === userId);
      if (!target || !permissions.canManageUsers || !canManageTargetUser(current, target)) return;
      if (target.id === current?.id && permKey === "canManageUsers" && !input.checked) {
        showToast("No puedes quitarte este permiso");
        input.checked = true;
        return;
      }
      const next = users.map((u) => (
        u.id === userId
          ? {
            ...u,
            permissions: {
              ...DEFAULT_PERMISSIONS,
              ...(u.permissions || {}),
              [permKey]: input.checked,
            },
          }
          : u
      ));
      save("dcosta-admin-users", next);
      addAuditLog("USER_PERMISSION_UPDATE", `${userId} ${permKey}=${input.checked}`);
      showToast("Permiso actualizado");
      renderUsuarios();
    });
  });

  view.querySelectorAll("[data-toggle-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleUser;
      const next = users.map((u) => (u.id === id ? { ...u, active: !u.active } : u));
      save("dcosta-admin-users", next);
      addAuditLog("USER_TOGGLE", `Usuario ${id}`);
      showToast("Estado de usuario actualizado");
      renderUsuarios();
    });
  });

  view.querySelectorAll("[data-delete-user]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deleteUser;
      const target = users.find((u) => u.id === id);
      if (!target) return;
      if (!window.confirm(`Eliminar usuario ${target.name}?`)) return;
      const next = users.filter((u) => u.id !== id);
      save("dcosta-admin-users", next);
      addAuditLog("USER_DELETE", `${target.name}`);
      showToast("Usuario eliminado");
      renderUsuarios();
    });
  });

  view.querySelectorAll("[data-save-goals]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.saveGoals;
      const target = getUsers().find((u) => u.id === id);
      if (!target || !canManageTargetUser(current, target)) return;
      if (!await requireManagerReauth("Guardar objetivos de usuario")) return;
      const monthlySales = Math.max(0, Number(view.querySelector(`[data-goal-sales="${CSS.escape(id)}"]`)?.value || 0));
      const monthlyOrders = Math.max(0, Number(view.querySelector(`[data-goal-orders="${CSS.escape(id)}"]`)?.value || 0));
      const nextGoals = { ...getUserGoals(), [id]: { monthlySales, monthlyOrders } };
      saveUserGoals(nextGoals);
      addAuditLog("USER_GOALS_UPDATE", `${id} ventas=${monthlySales} pedidos=${monthlyOrders}`);
      showToast("Objetivos guardados");
      renderUsuarios();
    });
  });

  view.querySelectorAll("[data-reset-lock]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.resetLock;
      const target = getUsers().find((u) => u.id === id);
      if (!target || !canManageTargetUser(current, target)) return;
      if (!await requireManagerReauth("Reset de seguridad de usuario")) return;
      const next = getUsers().map((u) => (u.id === id ? { ...u, failedAttempts: 0, lockedUntil: 0 } : u));
      save("dcosta-admin-users", next);
      addAuditLog("USER_SECURITY_RESET", `${id}`);
      showToast("Seguridad reiniciada");
      renderUsuarios();
    });
  });

  view.querySelectorAll("[data-force-logout]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.forceLogout;
      const target = getUsers().find((u) => u.id === id);
      if (!target || !canManageTargetUser(current, target)) return;
      if (!await requireManagerReauth("Forzar cierre de sesión")) return;
      const next = getUsers().map((u) => (u.id === id ? { ...u, authVersion: Number(u.authVersion || 1) + 1 } : u));
      save("dcosta-admin-users", next);
      addAuditLog("USER_FORCE_LOGOUT", `${id}`);
      showToast("Cierre de sesión forzado");
      renderUsuarios();
    });
  });

  // Security override for sensitive user actions (manager re-auth + password policy).
  view.querySelectorAll("[data-save-password]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopImmediatePropagation();
      const id = btn.dataset.savePassword;
      const password = String(view.querySelector(`[data-password-user="${CSS.escape(id)}"]`)?.value || "");
      if (!await requireManagerReauth("Cambiar contraseña de usuario")) return;
      const policyError = validatePasswordPolicy(password);
      if (policyError) {
        showToast(policyError);
        return;
      }
      const hashed = await hashPassword(password);
      const next = getUsers().map((u) => (
        u.id === id
          ? { ...u, password: hashed, authVersion: Number(u.authVersion || 1) + 1, failedAttempts: 0, lockedUntil: 0 }
          : u
      ));
      save("dcosta-admin-users", next);
      addAuditLog("USER_PASSWORD_UPDATE", `Contraseña actualizada para ${id}`);
      showToast("Contraseña actualizada");
      renderUsuarios();
    }, true);
  });

  view.querySelectorAll("[data-perm]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      event.stopImmediatePropagation();
      if (!await requireManagerReauth("Cambiar permisos de usuario")) {
        renderUsuarios();
      }
    }, true);
  });

  view.querySelectorAll("[data-toggle-user]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopImmediatePropagation();
      if (!await requireManagerReauth("Activar/desactivar usuario")) return;
      const id = btn.dataset.toggleUser;
      const target = getUsers().find((u) => u.id === id);
      if (!canManageTargetUser(current, target)) {
        showToast("No puedes gestionar usuarios de tu mismo nivel o superior");
        return;
      }
      const next = getUsers().map((u) => (u.id === id ? { ...u, active: !u.active } : u));
      save("dcosta-admin-users", next);
      addAuditLog("USER_TOGGLE", `Usuario ${id}`);
      showToast("Estado de usuario actualizado");
      renderUsuarios();
    }, true);
  });

  view.querySelectorAll("[data-delete-user]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopImmediatePropagation();
      const id = btn.dataset.deleteUser;
      const target = getUsers().find((u) => u.id === id);
      if (!target) return;
      if (!canManageTargetUser(current, target)) {
        showToast("No puedes eliminar usuarios de tu mismo nivel o superior");
        return;
      }
      if (!await requireManagerReauth("Eliminar usuario")) return;
      if (!window.confirm(`Eliminar usuario ${target.name}?`)) return;
      const next = getUsers().filter((u) => u.id !== id);
      save("dcosta-admin-users", next);
      addAuditLog("USER_DELETE", `${target.name}`);
      showToast("Usuario eliminado");
      renderUsuarios();
    }, true);
  });
}

function renderSinPermiso(title, message) {
  routeTitle.textContent = title;
  view.innerHTML = `<article class="card"><h2>Sin permisos</h2><p class="muted">${message}</p></article>`;
}

function renderLockScreen() {
  document.body.classList.add("auth-only");
  const current = getSessionUser();
  const state = getSessionState();
  const title = state.lockedReason ? "Sesion bloqueada" : "Inicio de sesion";
  routeTitle.textContent = title;
  view.innerHTML = `
    <article class="card">
      <h2>${escapeHtml(title)}</h2>
      <p class="muted" style="margin:8px 0 12px;">${escapeHtml(state.lockedReason || "Introduce tus credenciales para continuar")}.</p>
      <form id="unlock-form" class="form-grid">
        <div class="field">
          <label for="unlock-user">Usuario</label>
          <select id="unlock-user" name="userId">
            ${getUsers().filter((u) => u.active).map((u) => `<option value="${u.id}" ${current?.id === u.id ? "selected" : ""}>${escapeHtml(u.name)} (${u.role})</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="unlock-password">Contraseña</label>
          <input id="unlock-password" name="password" type="password" autocomplete="current-password" placeholder="Contraseña">
        </div>
      </form>
      <div class="table-actions" style="margin-top:8px;">
        <button id="unlock-btn" class="btn">Desbloquear</button>
      </div>
    </article>
  `;
  document.querySelector("#unlock-btn")?.addEventListener("click", async () => {
    const userId = String(document.querySelector("#unlock-user")?.value || "");
    const password = String(document.querySelector("#unlock-password")?.value || "");
    const user = getUsers().find((u) => u.id === userId && u.active);
    if (!user) {
      showToast("Usuario no encontrado");
      return;
    }
    const unlockResult = await authenticateAdmin(user, password, "SESSION_UNLOCK");
    if (unlockResult.ok) {
      showToast(unlockResult.mode === "fallback" ? "Sesion desbloqueada (modo emergencia)" : "Sesion desbloqueada");
      render();
      return;
    }
    if (unlockResult.reason === "locked") {
      showToast(`Usuario bloqueado. Intenta en ${minutesLeft(user)} min`);
      return;
    }
    if (unlockResult.reason === "api-unavailable") {
      showToast("API no disponible. Revisa el backend antes de acceder al admin.");
      return;
    }
    addAuditLog("UNLOCK_FAILED", `Intento fallido: ${user.name}`);
    showToast("Credenciales invalidas");
    return;
    if (user && isUserLocked(user)) {
      showToast(`Usuario bloqueado. Intenta en ${minutesLeft(user)} min`);
      return;
    }
    if (!user || !await verifyUserPassword(user, password)) {
      if (user) {
        recordFailedLogin(user.id);
        addAuditLog("UNLOCK_FAILED", `Intento fallido: ${user.name}`);
      }
      showToast("Credenciales invalidas");
      return;
    }
    recordSuccessfulLogin(user.id);
    beginSessionForUser(user);
    addAuditLog("SESSION_UNLOCK", `Sesion desbloqueada por ${user.name}`);
    showToast("Sesion desbloqueada");
    render();
  });
}

async function render() {
  await ensureUsersPasswordHashes();
  await processScheduledProductPublishes();
  maybeAutoLockSession();
  const session = getSessionState();
  if (session.isAuthenticated && session.userId) {
    const currentUser = getUserById(session.userId);
    if (!currentUser || Number(session.authVersionAtLogin || 0) !== Number(currentUser.authVersion || 0)) {
      lockSession("Sesion invalidada por cambio de contraseña");
    }
  }
  const freshSession = getSessionState();
  const route = routeFromHash();
  setActiveRoute(route);
  const permissions = getPermissions();
  if (!freshSession.isAuthenticated) return renderLockScreen();
  document.body.classList.remove("auth-only");

  if (route === "pedidos") return permissions.canEditOrders ? await renderPedidos() : renderSinPermiso("Pedidos", "Tu usuario no tiene permiso para gestionar pedidos.");
  if (route === "productos") return permissions.canEditProducts ? renderProductos() : renderSinPermiso("Productos", "Tu usuario no tiene permiso para gestionar productos.");
  if (route === "ventas") return await renderVentas();
  if (route === "clientes") return await renderClientes();
  if (route === "facturacion") return permissions.canViewBilling ? await renderFacturacion() : renderSinPermiso("Facturacion", "Tu usuario no tiene permiso para ver facturacion.");
  if (route === "inventario") return renderInventario();
  if (route === "auditoria") return permissions.canManageUsers ? renderAuditoria() : renderSinPermiso("Auditoria", "Tu usuario no tiene permiso para ver auditoria.");
  if (route === "usuarios") return permissions.canManageUsers ? await renderUsuarios() : renderSinPermiso("Usuarios", "Tu usuario no tiene permiso para gestionar usuarios.");
  if (route === "configuracion") return permissions.canConfig ? renderConfiguracion() : renderSinPermiso("Configuracion", "Tu usuario no tiene permiso para editar configuracion.");
  return renderInicio();
}

window.addEventListener("hashchange", render);
window.addEventListener("resize", () => {
  if (routeFromHash() === "inicio" || routeFromHash() === "ventas") render();
});
window.addEventListener("storage", (event) => {
  if (!event.key) return;
  const watch = [
    "dcosta-catalog",
    "dcosta-orders",
    "dcosta-admin-demo-orders",
    "dcosta-admin-users",
    "dcosta-admin-user-goals",
    "dcosta-admin-settings",
    "dcosta-admin-invoice",
    "dcosta-admin-products-filter",
    "dcosta-admin-session-state",
  ];
  if (watch.includes(event.key)) {
    render();
  }
});
setInterval(() => {
  processScheduledProductPublishes().catch(() => {});
}, 15000);
["click", "keydown", "mousemove", "touchstart", "scroll"].forEach((eventName) => {
  window.addEventListener(eventName, touchSessionActivity, { passive: true });
});

document.querySelector("#logout-btn")?.addEventListener("click", () => {
  window.DCOSTA_STORE_API?.logoutAdmin?.();
  lockSession("Sesion cerrada manualmente");
  addAuditLog("SESSION_LOGOUT", "Cierre de sesion manual");
  showToast("Sesion cerrada");
  render();
});

if (!window.location.hash) window.location.hash = "#/inicio";
render();
