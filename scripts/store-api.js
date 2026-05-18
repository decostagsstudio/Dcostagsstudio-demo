const DCOSTA_DATA_SOURCE = "api"; // Usa backend y cae a local si falla.
const DCOSTA_API_BASE_URL = (
  window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "4000")
)
  ? "http://localhost:4000/api"
  : "/api";

const DCOSTA_STORAGE_KEYS = {
  catalog: "dcosta-catalog",
  cart: "dcosta-cart",
  favorites: "dcosta-favorites",
  orders: "dcosta-orders",
  auth: "dcosta-auth",
  selectedProduct: "dcosta-selected-product",
  returnProduct: "dcosta-return-product-name",
};

const DCOSTA_CATEGORY_LABELS = {
  men: "Hombre",
  women: "Mujer",
  wallets: "Carteras",
  bags: "Bolsos",
};

function readStorage(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function buildCatalog(productsByCategory = window.DCOSTA_PRODUCTS_BY_CATEGORY || {}) {
  return Object.entries(productsByCategory).flatMap(([category, items]) =>
    items.map((product) => ({
      ...product,
      category,
      categoryLabel: DCOSTA_CATEGORY_LABELS[category],
    })),
  );
}

async function requestJson(path, options = {}) {
  const auth = readStorage(DCOSTA_STORAGE_KEYS.auth, null);
  const bearer = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
  const response = await fetch(`${DCOSTA_API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...bearer,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

function logApiFallback(scope, error) {
  console.warn(`[DCOSTA_STORE_API] Fallback local en ${scope}:`, error?.message || error);
}

async function loginAdmin(email, password) {
  if (DCOSTA_DATA_SOURCE !== "api") {
    const payload = { token: "local-mode-token", user: { email, role: "director" } };
    writeStorage(DCOSTA_STORAGE_KEYS.auth, payload);
    return payload;
  }

  const payload = await requestJson("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  writeStorage(DCOSTA_STORAGE_KEYS.auth, payload);
  return payload;
}

function logoutAdmin() {
  localStorage.removeItem(DCOSTA_STORAGE_KEYS.auth);
}

function getAuthSession() {
  return readStorage(DCOSTA_STORAGE_KEYS.auth, null);
}

function getLocalProducts() {
  const storedCatalog = readStorage(DCOSTA_STORAGE_KEYS.catalog, null);
  return storedCatalog || buildCatalog();
}

async function getProducts() {
  if (DCOSTA_DATA_SOURCE === "api") {
    try {
      return await requestJson("/products");
    } catch (error) {
      logApiFallback("getProducts", error);
      return getLocalProducts();
    }
  }

  return getLocalProducts();
}

async function getProductById(id) {
  if (DCOSTA_DATA_SOURCE === "api") {
    const products = await getProducts();
    return products.find((product) => product.id === id || product.name === id) || null;
  }

  const products = await getProducts();
  return products.find((product) => product.id === id || product.name === id) || null;
}

async function saveCatalog(products) {
  if (DCOSTA_DATA_SOURCE === "api") {
    try {
      return await requestJson("/products/bulk", {
        method: "PUT",
        body: JSON.stringify({ products }),
      });
    } catch (error) {
      logApiFallback("saveCatalog", error);
      writeStorage(DCOSTA_STORAGE_KEYS.catalog, products);
      return products;
    }
  }

  writeStorage(DCOSTA_STORAGE_KEYS.catalog, products);
  return products;
}

async function getCart() {
  // Temporal: carrito sigue en local hasta crear módulo backend de cart.
  return readStorage(DCOSTA_STORAGE_KEYS.cart, []);
}

async function saveCart(cart) {
  // Temporal: carrito sigue en local hasta crear módulo backend de cart.
  writeStorage(DCOSTA_STORAGE_KEYS.cart, cart);
  return cart;
}

async function getFavorites() {
  // Temporal: favoritos sigue en local hasta crear módulo backend de favorites.
  return readStorage(DCOSTA_STORAGE_KEYS.favorites, []);
}

async function saveFavorites(favorites) {
  // Temporal: favoritos sigue en local hasta crear módulo backend de favorites.
  writeStorage(DCOSTA_STORAGE_KEYS.favorites, favorites);
  return favorites;
}

async function getOrders() {
  if (DCOSTA_DATA_SOURCE === "api") {
    try {
      return await requestJson("/orders");
    } catch (error) {
      logApiFallback("getOrders", error);
      return readStorage(DCOSTA_STORAGE_KEYS.orders, []);
    }
  }

  return readStorage(DCOSTA_STORAGE_KEYS.orders, []);
}

async function saveOrders(orders) {
  if (DCOSTA_DATA_SOURCE === "api") {
    try {
      return await requestJson("/orders", {
        method: "PUT",
        body: JSON.stringify({ items: orders }),
      });
    } catch (error) {
      logApiFallback("saveOrders", error);
      writeStorage(DCOSTA_STORAGE_KEYS.orders, orders);
      return orders;
    }
  }

  writeStorage(DCOSTA_STORAGE_KEYS.orders, orders);
  return orders;
}

window.DCOSTA_STORE_API = {
  dataSource: DCOSTA_DATA_SOURCE,
  apiBaseUrl: DCOSTA_API_BASE_URL,
  buildCatalog,
  getProducts,
  getProductById,
  saveCatalog,
  getCart,
  saveCart,
  getFavorites,
  saveFavorites,
  getOrders,
  saveOrders,
  loginAdmin,
  logoutAdmin,
  getAuthSession,
  keys: DCOSTA_STORAGE_KEYS,
  categoryLabels: DCOSTA_CATEGORY_LABELS,
};
