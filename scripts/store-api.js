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

function buildSizeStock(product) {
  if (product?.sizeStock && typeof product.sizeStock === "object" && Object.keys(product.sizeStock).length) {
    return Object.entries(product.sizeStock).reduce((acc, [size, qty]) => {
      acc[String(size)] = Math.max(0, Number(qty || 0));
      return acc;
    }, {});
  }

  const units = String(product?.stock || "").toLowerCase().includes("pocas") ? 2 : 8;
  return (Array.isArray(product?.sizes) ? product.sizes : []).reduce((acc, size) => {
    acc[String(size)] = units;
    return acc;
  }, {});
}

function normalizeProduct(product, category = product?.category) {
  return {
    ...product,
    category,
    categoryLabel: product?.categoryLabel || DCOSTA_CATEGORY_LABELS[category] || category || "",
    sizes: Array.isArray(product?.sizes) ? product.sizes : [],
    sizeStock: buildSizeStock(product),
  };
}

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
    items.map((product) => normalizeProduct(product, category)),
  );
}

async function requestJson(path, options = {}) {
  const auth = readStorage(DCOSTA_STORAGE_KEYS.auth, null);
  const bearer = auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(`${DCOSTA_API_BASE_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...bearer,
      ...(options.headers || {}),
    },
    ...options,
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || `API request failed: ${response.status}`);
    error.statusCode = response.status;
    error.details = payload?.details || null;
    throw error;
  }

  return payload;
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
  const catalog = storedCatalog || buildCatalog();
  return catalog.map((product) => normalizeProduct(product));
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

async function saveCatalog(products, options = {}) {
  if (DCOSTA_DATA_SOURCE === "api") {
    try {
      return await requestJson("/products/bulk", {
        method: "PUT",
        body: JSON.stringify({ products }),
      });
    } catch (error) {
      logApiFallback("saveCatalog", error);
      if (options.requireApi) {
        throw error;
      }
      writeStorage(DCOSTA_STORAGE_KEYS.catalog, products);
      return products;
    }
  }

  if (options.requireApi) {
    throw new Error("API mode is required to save catalog.");
  }

  writeStorage(DCOSTA_STORAGE_KEYS.catalog, products);
  return products;
}

async function uploadProductImages(files) {
  const items = Array.from(files || []);
  if (!items.length) {
    return { urls: [], images: [] };
  }

  if (DCOSTA_DATA_SOURCE !== "api") {
    throw new Error("Cloudinary upload requires API mode.");
  }

  const formData = new FormData();
  items.forEach((file) => {
    formData.append("images", file);
  });

  return requestJson("/products/images", {
    method: "POST",
    body: formData,
  });
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

async function createOrder(order) {
  if (DCOSTA_DATA_SOURCE === "api") {
    try {
      const created = await requestJson("/orders", {
        method: "POST",
        body: JSON.stringify(order),
      });
      const orders = readStorage(DCOSTA_STORAGE_KEYS.orders, []);
      writeStorage(DCOSTA_STORAGE_KEYS.orders, [created, ...orders]);
      return created;
    } catch (error) {
      logApiFallback("createOrder", error);
    }
  }

  const orders = readStorage(DCOSTA_STORAGE_KEYS.orders, []);
  const nextOrder = {
    ...order,
    id: order.id || `DC-${Date.now().toString().slice(-6)}`,
    createdAt: order.createdAt || new Date().toISOString(),
  };
  writeStorage(DCOSTA_STORAGE_KEYS.orders, [nextOrder, ...orders]);
  return nextOrder;
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
  uploadProductImages,
  getCart,
  saveCart,
  getFavorites,
  saveFavorites,
  getOrders,
  createOrder,
  saveOrders,
  loginAdmin,
  logoutAdmin,
  getAuthSession,
  keys: DCOSTA_STORAGE_KEYS,
  categoryLabels: DCOSTA_CATEGORY_LABELS,
};
