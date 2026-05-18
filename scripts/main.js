
const storeApi = window.DCOSTA_STORE_API;
let cart = [];
let favorites = [];
const formatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const mensContainer = document.querySelector("#mens-products");
const womensContainer = document.querySelector("#womens-products");
const walletContainer = document.querySelector("#wallet-products");
const bagContainer = document.querySelector("#bag-products");
const cartCount = document.querySelector("#cart-count");
const cartItems = document.querySelector("#cart-items");
const cartTotal = document.querySelector("#cart-total");
const checkoutForm = document.querySelector("#checkout-form");
const formMessage = document.querySelector("#form-message");
const checkout = document.querySelector("#checkout");
const cartButton = document.querySelector("#cart-button");
const closeCheckout = document.querySelector("#close-checkout");
const favoritesButton = document.querySelector("#favorites-button");
const favoritesPanel = document.querySelector("#favorites-panel");
const closeFavorites = document.querySelector("#close-favorites");
const favoritesCount = document.querySelector("#favorites-count");
const favoriteItems = document.querySelector("#favorite-items");
const searchButton = document.querySelector("#search-button");
const searchPanel = document.querySelector("#search-panel");
const closeSearch = document.querySelector("#close-search");
const searchInput = document.querySelector("#search-input");
const searchCategory = document.querySelector("#search-category");
const searchSize = document.querySelector("#search-size");
const searchColor = document.querySelector("#search-color");
const searchSort = document.querySelector("#search-sort");
const searchResults = document.querySelector("#search-results");
const searchSuggestionButtons = document.querySelectorAll(".search-suggestion");
const heroSlides = document.querySelectorAll(".hero-slide");
const discoverButton = document.querySelector("#discover-button");
const toast = document.querySelector("#toast");
const adminAccessLink = document.querySelector("#admin-access-link");
let allProducts = [];
let activeSlide = 0;
let toastTimeout;

function readJsonStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeSizeStock(product) {
  if (product?.sizeStock && typeof product.sizeStock === "object") {
    return Object.entries(product.sizeStock).reduce((acc, [size, qty]) => {
      acc[String(size)] = Math.max(0, Number(qty || 0));
      return acc;
    }, {});
  }
  const sizes = Array.isArray(product?.sizes) ? product.sizes : [];
  return sizes.reduce((acc, size) => {
    acc[String(size)] = 0;
    return acc;
  }, {});
}

function getCatalogProduct(product) {
  return allProducts.find((item) =>
    (item.id && product.id && item.id === product.id) || item.name === product.name
  ) || product;
}

function getAvailableUnits(product, size) {
  const catalogProduct = getCatalogProduct(product);
  const sizeStock = normalizeSizeStock(catalogProduct);
  return Math.max(0, Number(sizeStock[String(size)] || 0));
}

function canAccessAdminFromStore() {
  const session = readJsonStorage("dcosta-client-session", null);
  if (!session?.email) return false;
  const users = readJsonStorage("dcosta-admin-users", []);
  const user = users.find((u) => u.active && String(u.email || "").toLowerCase() === String(session.email).toLowerCase());
  if (!user) return false;
  const p = user.permissions || {};
  return Boolean(
    p.canManageUsers ||
    p.canConfig ||
    p.canEditProducts ||
    p.canEditOrders ||
    p.canViewBilling ||
    p.canDelete ||
    p.canBulkPrice
  );
}

function refreshAdminAccessLink() {
  if (!adminAccessLink) return;
  adminAccessLink.hidden = !canAccessAdminFromStore();
}

function readMarketingSettings() {
  try {
    const value = localStorage.getItem("dcosta-admin-web-alert") || localStorage.getItem("dcosta-admin-marketing");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "card";
  card.dataset.productName = product.name;
  card.tabIndex = 0;
  card.setAttribute("role", "link");
  card.setAttribute("aria-label", `Abrir ${product.name}`);
  card.innerHTML = `
    <button class="like-button" type="button" aria-label="Me gusta ${product.name}"></button>
    <div class="card-media">
      <img src="${product.image}" alt="${product.name}">
      <span class="product-badge">${product.badge || "Disponible"}</span>
    </div>
    <div class="card-content">
      <h3>${product.name}</h3>
      <p>${formatter.format(product.price)}</p>
      <div class="product-meta">
        <span>${product.color || "Neutro"}</span>
        <span>${product.stock || "Disponible"}</span>
      </div>
    </div>
  `;

  const likeButton = card.querySelector(".like-button");
  likeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(product, likeButton);
  });

  card.addEventListener("click", (event) => {
    if (event.target.closest("button")) {
      return;
    }
    openProductPage(product);
  });

  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductPage(product);
    }
  });

  return card;
}

function renderProducts() {
  mensContainer.innerHTML = "";
  womensContainer.innerHTML = "";
  walletContainer.innerHTML = "";
  bagContainer.innerHTML = "";

  allProducts.filter((product) => product.category === "men").forEach((product) =>
    mensContainer.appendChild(
      createProductCard(product),
    ),
  );
  allProducts.filter((product) => product.category === "women").forEach((product) =>
    womensContainer.appendChild(
      createProductCard(product),
    ),
  );
  allProducts.filter((product) => product.category === "wallets").forEach((product) =>
    walletContainer.appendChild(
      createProductCard(product),
    ),
  );
  allProducts.filter((product) => product.category === "bags").forEach((product) =>
    bagContainer.appendChild(
      createProductCard(product),
    ),
  );

  showEmptyCategoryState(womensContainer, "No hay prendas de mujer con esos filtros.");
  showEmptyCategoryState(mensContainer, "No hay prendas de hombre con esos filtros.");
  showEmptyCategoryState(walletContainer, "No hay carteras con esos filtros.");
  showEmptyCategoryState(bagContainer, "No hay bolsos con esos filtros.");
}

function showEmptyCategoryState(container, message) {
  if (!container.children.length) {
    container.innerHTML = `<p class="empty-category">${message}</p>`;
  }
}

function scrollToReturnedProduct() {
  const targetName = sessionStorage.getItem("dcosta-return-product-name");
  if (!targetName) {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    return;
  }

  const targetCard = Array.from(document.querySelectorAll(".card")).find(
    (card) => card.dataset.productName === targetName,
  );

  sessionStorage.removeItem("dcosta-return-product-name");

  if (targetCard) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  } else {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }
}

function openProductPage(product) {
  sessionStorage.setItem("dcosta-selected-product", JSON.stringify(product));
  const encoded = encodeURIComponent(JSON.stringify(product));
  window.location.href = `product.html?product=${encoded}`;
}

async function addToCart(product) {
  const selectedSize = product.selectedSize || product.sizes?.[0] || "One size";
  const available = getAvailableUnits(product, selectedSize);
  if (available <= 0) {
    showToast(`${product.name} - talla ${selectedSize} sin stock.`);
    return;
  }
  const existingItem = cart.find((item) => item.name === product.name && item.size === selectedSize);

  if (existingItem) {
    if (existingItem.quantity >= available) {
      showToast(`Stock máximo en ${selectedSize}: ${available}.`);
      return;
    }
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, size: selectedSize, quantity: 1 });
  }

  await storeApi.saveCart(cart);
  renderCart();
  showToast(`${product.name} - talla ${selectedSize} añadido a la bolsa.`);
}

async function toggleFavorite(product, button) {
  const existingIndex = favorites.findIndex((item) => item.name === product.name);

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
    button.classList.remove("is-liked");
    showToast(`${product.name} eliminado de favoritos.`);
  } else {
    favorites.push(product);
    button.classList.add("is-liked");
    showToast(`${product.name} añadido a favoritos.`);
  }

  await storeApi.saveFavorites(favorites);
  renderFavorites();
}

function renderFavorites() {
  favoritesCount.textContent = favorites.length;

  if (!favorites.length) {
    favoriteItems.innerHTML = '<p class="empty-favorites">No tienes favoritos todavía.</p>';
    return;
  }

  favoriteItems.innerHTML = favorites
    .map(
      (item, index) => `
      <div class="favorite-item">
        <img src="${item.image}" alt="${item.name}">
        <span>${item.name}</span>
        <label class="favorite-size">
          Talla
          <select data-index="${index}" aria-label="Seleccionar talla para ${item.name}">
            ${item.sizes.map((size) => `<option value="${size}" ${size === (item.selectedSize || item.sizes[0]) ? "selected" : ""}>${size}</option>`).join("")}
          </select>
        </label>
        <button class="favorite-to-cart" type="button" data-index="${index}" aria-label="Añadir ${item.name} a la bolsa"></button>
        <button class="remove-favorite" type="button" data-index="${index}" aria-label="Eliminar ${item.name} de favoritos">Eliminar</button>
      </div>
    `,
    )
    .join("");

  favoriteItems.querySelectorAll(".remove-favorite").forEach((button) => {
    button.addEventListener("click", () => removeFavorite(Number(button.dataset.index)));
  });

  favoriteItems.querySelectorAll(".favorite-size select").forEach((select) => {
    select.addEventListener("change", async () => {
      favorites[Number(select.dataset.index)].selectedSize = select.value;
      await storeApi.saveFavorites(favorites);
    });
  });

  favoriteItems.querySelectorAll(".favorite-to-cart").forEach((button) => {
    button.addEventListener("click", () => addToCart(favorites[Number(button.dataset.index)]));
  });
}

async function removeFavorite(index) {
  const [removedItem] = favorites.splice(index, 1);
  document.querySelectorAll(".card").forEach((card) => {
    const name = card.querySelector("h3")?.textContent;
    if (name === removedItem.name) {
      card.querySelector(".like-button")?.classList.remove("is-liked");
    }
  });
  await storeApi.saveFavorites(favorites);
  renderFavorites();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function showPromoPopup() {
  const marketing = readMarketingSettings();

  if (!marketing?.promoPopupEnabled) {
    return;
  }

  const popup = document.createElement("section");
  popup.className = "promo-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-label", marketing.promoPopupTitle || "Promoción");
  popup.innerHTML = `
    <div class="promo-popup-box">
      <button class="promo-popup-close" type="button" aria-label="Cerrar promoción">Cerrar</button>
      <span>Promoción</span>
      <h2>${marketing.promoPopupTitle || "Promoción especial"}</h2>
      <p>${marketing.promoPopupText || "Descubre la selección destacada de esta semana."}</p>
      <a class="promo-popup-action" href="${marketing.promoPopupLink || "#mujer"}">${marketing.promoPopupButton || "Ver colección"}</a>
    </div>
  `;

  document.body.appendChild(popup);

  popup.querySelector(".promo-popup-close").addEventListener("click", () => {
    popup.remove();
  });

  popup.querySelector(".promo-popup-action").addEventListener("click", () => {
    popup.remove();
  });

  popup.addEventListener("click", (event) => {
    if (event.target === popup) {
      popup.remove();
    }
  });
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function renderSearchResults(query = "") {
  const normalizedQuery = normalizeText(query.trim());

  if (!normalizedQuery) {
    searchResults.innerHTML = '<p class="empty-search">Escribe para buscar en la colección.</p>';
    return;
  }

  const matches = allProducts.filter((product) => {
    const searchableText = `${product.name} ${product.categoryLabel}`;
    return normalizeText(searchableText).includes(normalizedQuery);
  });

  if (!matches.length) {
    searchResults.innerHTML = '<p class="empty-search">No se encontraron artículos.</p>';
    return;
  }

  searchResults.innerHTML = matches
    .map(
      (product) => `
      <button class="search-result" type="button" data-product-name="${product.name}">
        <img src="${product.image}" alt="${product.name}">
        <span>
          <strong>${product.name}</strong>
          ${product.categoryLabel} - ${formatter.format(product.price)}
        </span>
      </button>
    `,
    )
    .join("");

  searchResults.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      const targetName = button.dataset.productName;
      const targetProduct = allProducts.find((product) => product.name === targetName);

      if (targetProduct) {
        closeSearchPanel();
        openProductPage(targetProduct);
      }
    });
  });
}

function openSearchPanel() {
  searchPanel.classList.add("is-open");
  searchPanel.setAttribute("aria-hidden", "false");
  searchButton.setAttribute("aria-expanded", "true");
  searchInput.focus();
  renderSearchResultsEnhanced(searchInput.value);
}

function closeSearchPanel() {
  searchPanel.classList.remove("is-open");
  searchPanel.setAttribute("aria-hidden", "true");
  searchButton.setAttribute("aria-expanded", "false");
}

function renderSearchResultsEnhanced(query = "") {
  const normalizedQuery = normalizeText(query.trim());
  const selectedCategory = searchCategory.value;
  const selectedSize = searchSize.value;
  const selectedColor = searchColor.value;
  const selectedSort = searchSort.value;
  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedSize !== "all" ||
    selectedColor !== "all" ||
    selectedSort !== "relevance";

  if (!normalizedQuery && !hasActiveFilters) {
    searchResults.innerHTML = '<p class="empty-search">Escribe o usa los filtros para buscar en la colección.</p>';
    return;
  }

  let matches = allProducts.filter((product) => {
    const searchableText = `${product.name} ${product.categoryLabel} ${product.color} ${product.material} ${product.sizes.join(" ")}`;
    const matchesQuery = !normalizedQuery || normalizeText(searchableText).includes(normalizedQuery);
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSize = selectedSize === "all" || product.sizes.includes(selectedSize);
    const matchesColor = selectedColor === "all" || product.color === selectedColor;
    return matchesQuery && matchesCategory && matchesSize && matchesColor;
  });

  if (!matches.length) {
    searchResults.innerHTML = '<p class="empty-search">No se encontraron artículos.</p>';
    return;
  }

  if (selectedSort === "price-asc") {
    matches = matches.slice().sort((a, b) => a.price - b.price);
  } else if (selectedSort === "price-desc") {
    matches = matches.slice().sort((a, b) => b.price - a.price);
  } else if (normalizedQuery) {
    matches = matches.slice().sort((a, b) => {
      const aName = normalizeText(a.name);
      const bName = normalizeText(b.name);
      const aScore = aName === normalizedQuery ? 0 : aName.startsWith(normalizedQuery) ? 1 : 2;
      const bScore = bName === normalizedQuery ? 0 : bName.startsWith(normalizedQuery) ? 1 : 2;
      return aScore - bScore || aName.localeCompare(bName);
    });
  }

  searchResults.innerHTML = matches
    .map(
      (product) => `
      <button class="search-result" type="button" data-product-name="${product.name}">
        <img src="${product.image}" alt="${product.name}">
        <span>
          <strong>${product.name}</strong>
          ${product.categoryLabel} - ${product.color} - ${formatter.format(product.price)}
        </span>
      </button>
    `,
    )
    .join("");

  searchResults.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      const targetName = button.dataset.productName;
      const targetProduct = allProducts.find((product) => product.name === targetName);

      if (targetProduct) {
        closeSearchPanel();
        openProductPage(targetProduct);
      }
    });
  });
}

function renderCart() {
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = itemCount;
  cartTotal.textContent = formatter.format(total);

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-cart">Tu bolsa está vacía.</p>';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item, index) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <span class="cart-item-info">
          ${item.name} x${item.quantity}
          <small>Talla: ${item.size}</small>
        </span>
        <strong>${formatter.format(item.price * item.quantity)}</strong>
        <div class="quantity-controls" aria-label="Cantidad de ${item.name}">
          <button class="quantity-decrease" type="button" data-index="${index}" aria-label="Restar ${item.name}">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-increase" type="button" data-index="${index}" aria-label="Sumar ${item.name}">+</button>
        </div>
        <button class="remove-item" type="button" data-index="${index}" aria-label="Eliminar ${item.name}">Eliminar</button>
      </div>
    `,
    )
    .join("");

  cartItems.querySelectorAll(".remove-item").forEach((button) => {
    button.addEventListener("click", () => removeFromCart(Number(button.dataset.index)));
  });

  cartItems.querySelectorAll(".quantity-decrease").forEach((button) => {
    button.addEventListener("click", () => updateCartQuantity(Number(button.dataset.index), -1));
  });

  cartItems.querySelectorAll(".quantity-increase").forEach((button) => {
    button.addEventListener("click", () => updateCartQuantity(Number(button.dataset.index), 1));
  });
}

async function removeFromCart(index) {
  cart.splice(index, 1);
  await storeApi.saveCart(cart);
  renderCart();
}

async function updateCartQuantity(index, change) {
  if (change > 0) {
    const item = cart[index];
    const available = getAvailableUnits(item, item.size);
    if (item.quantity >= available) {
      showToast(`Stock máximo para ${item.name} (${item.size}): ${available}.`);
      return;
    }
  }
  cart[index].quantity += change;
  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }
  await storeApi.saveCart(cart);
  renderCart();
}

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!cart.length) {
    formMessage.textContent = "Añade al menos un producto a la bolsa para guardar la selección.";
    return;
  }

  if (!checkoutForm.checkValidity()) {
    formMessage.textContent = "Revisa los datos introducidos.";
    checkoutForm.reportValidity();
    return;
  }

  const unavailable = cart.find((item) => getAvailableUnits(item, item.size) <= 0);
  if (unavailable) {
    formMessage.textContent = `${unavailable.name} talla ${unavailable.size} no tiene stock disponible.`;
    return;
  }

  const exceeded = cart.find((item) => item.quantity > getAvailableUnits(item, item.size));
  if (exceeded) {
    formMessage.textContent = `${exceeded.name} talla ${exceeded.size} supera el stock disponible.`;
    return;
  }

  const orders = await storeApi.getOrders();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order = {
    id: `DC-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: "En preparación",
    statusDetail: "Selección guardada. Pendiente de activar compra online.",
    items: cart.map((item) => ({ ...item })),
    total,
  };

  await storeApi.saveOrders([order, ...orders]);
  formMessage.textContent = "Selección guardada en Mis pedidos. La compra online se activará cuando esté conectada la pasarela de pago.";
  checkoutForm.reset();
});

searchButton.addEventListener("click", openSearchPanel);

closeSearch.addEventListener("click", closeSearchPanel);

searchInput.addEventListener("input", () => {
  renderSearchResultsEnhanced(searchInput.value);
});

searchCategory.addEventListener("change", () => {
  renderSearchResultsEnhanced(searchInput.value);
});

searchSize.addEventListener("change", () => {
  renderSearchResultsEnhanced(searchInput.value);
});

searchColor.addEventListener("change", () => {
  renderSearchResultsEnhanced(searchInput.value);
});

searchSort.addEventListener("change", () => {
  renderSearchResultsEnhanced(searchInput.value);
});

searchSuggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query || "";
    renderSearchResultsEnhanced(searchInput.value);
    searchInput.focus();
  });
});

searchPanel.addEventListener("click", (event) => {
  if (event.target === searchPanel) {
    closeSearchPanel();
  }
});

cartButton.addEventListener("click", () => {
  checkout.classList.add("is-open");
  checkout.setAttribute("aria-hidden", "false");
  cartButton.setAttribute("aria-expanded", "true");
});

closeCheckout.addEventListener("click", () => {
  checkout.classList.remove("is-open");
  checkout.setAttribute("aria-hidden", "true");
  cartButton.setAttribute("aria-expanded", "false");
});

checkout.addEventListener("click", (event) => {
  if (event.target === checkout) {
    checkout.classList.remove("is-open");
    checkout.setAttribute("aria-hidden", "true");
    cartButton.setAttribute("aria-expanded", "false");
  }
});

favoritesButton.addEventListener("click", () => {
  favoritesPanel.classList.add("is-open");
  favoritesPanel.setAttribute("aria-hidden", "false");
  favoritesButton.setAttribute("aria-expanded", "true");
});

closeFavorites.addEventListener("click", () => {
  favoritesPanel.classList.remove("is-open");
  favoritesPanel.setAttribute("aria-hidden", "true");
  favoritesButton.setAttribute("aria-expanded", "false");
});

favoritesPanel.addEventListener("click", (event) => {
  if (event.target === favoritesPanel) {
    favoritesPanel.classList.remove("is-open");
    favoritesPanel.setAttribute("aria-hidden", "true");
    favoritesButton.setAttribute("aria-expanded", "false");
  }
});

discoverButton.addEventListener("click", () => {
  document.querySelector("#mujer").scrollIntoView({ behavior: "smooth" });
});

if (window.location.hash) {
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

setInterval(() => {
  heroSlides[activeSlide].classList.remove("is-active");
  activeSlide = (activeSlide + 1) % heroSlides.length;
  heroSlides[activeSlide].classList.add("is-active");
}, 4500);

async function initStorefront() {
  allProducts = await storeApi.getProducts();
  await storeApi.saveCatalog(allProducts);
  cart = await storeApi.getCart();
  favorites = await storeApi.getFavorites();
  renderProducts();
  renderCart();
  renderFavorites();
  showPromoPopup();
}

window.addEventListener("storage", async (event) => {
  if (!event.key) return;
  if (["dcosta-client-session", "dcosta-admin-users"].includes(event.key)) {
    refreshAdminAccessLink();
  }
  const watched = ["dcosta-catalog", "dcosta-cart", "dcosta-favorites", "dcosta-orders"];
  if (!watched.includes(event.key)) return;
  allProducts = await storeApi.getProducts();
  cart = await storeApi.getCart();
  favorites = await storeApi.getFavorites();
  renderProducts();
  renderCart();
  renderFavorites();
});

initStorefront().then(() => {
  window.addEventListener("load", scrollToReturnedProduct);
  if (document.readyState === "complete") {
    scrollToReturnedProduct();
  }
  refreshAdminAccessLink();
});
