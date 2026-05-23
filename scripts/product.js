const formatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

async function loadCatalog() {
  return window.DCOSTA_STORE_API.getProducts();
}

function visibleProducts(products) {
  return products.filter((product) => product.isActive !== false);
}

function displayPrice(product) {
  return product.salePrice !== null && product.salePrice !== undefined ? Number(product.salePrice) : Number(product.price || 0);
}

function parseProduct() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("product");

  if (encoded) {
    try {
      return JSON.parse(decodeURIComponent(encoded));
    } catch {
      return null;
    }
  }

  try {
    const stored = sessionStorage.getItem("dcosta-selected-product");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function inferDescription(product) {
  const name = product.name.toLowerCase();

  if (name.includes("bolso") || name.includes("cartera") || name.includes("tarjetero")) {
    return "Accesorio estructurado con acabado limpio y tacto sofisticado. Diseñado para acompañar looks diarios con una presencia discreta y precisa.";
  }

  if (
    name.includes("vestido") ||
    name.includes("falda") ||
    name.includes("mono") ||
    name.includes("top") ||
    name.includes("camisa") ||
    name.includes("blazer") ||
    name.includes("abrigo") ||
    name.includes("pantalón") ||
    name.includes("pantalon")
  ) {
    return "Prenda de líneas depuradas pensada para vestir con naturalidad y equilibrio. Su silueta se adapta a un armario contemporáneo y funcional.";
  }

  return "Pieza esencial con un acabado sobrio y una construcción pensada para uso diario. Combina fácil con otras capas y mantiene una lectura limpia y actual.";
}

async function saveCartItem(product, selectedSize) {
  const sizeStock = product.sizeStock && typeof product.sizeStock === "object" ? product.sizeStock : {};
  const available = Math.max(0, Number(sizeStock[selectedSize] || 0));
  if (available <= 0) {
    return { ok: false, message: `Sin stock en talla ${selectedSize}.` };
  }
  const cart = await window.DCOSTA_STORE_API.getCart();
  const existingItem = cart.find((item) => item.name === product.name && item.size === selectedSize);

  if (existingItem) {
    if (existingItem.quantity >= available) {
      return { ok: false, message: `Stock máximo en talla ${selectedSize}: ${available}.` };
    }
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, size: selectedSize, quantity: 1 });
  }

  await window.DCOSTA_STORE_API.saveCart(cart);
  return { ok: true };
}

function openProduct(product) {
  const encoded = encodeURIComponent(JSON.stringify(product));
  window.location.href = `product.html?product=${encoded}`;
}

async function renderProduct(product) {
  sessionStorage.setItem("dcosta-return-product-name", product.name);
  const container = document.querySelector("#product-detail");
  const selectedSize = product.sizes?.[0] || "One size";
  const description = product.description || inferDescription(product);
  const catalog = visibleProducts(await loadCatalog());
  const currentIndex = catalog.findIndex((item) => item.name === product.name);
  const prevProduct = currentIndex > 0 ? catalog[currentIndex - 1] : catalog[catalog.length - 1];
  const nextProduct = currentIndex >= 0 && currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : catalog[0];
  const galleryImages = product.images?.length ? product.images : [product.image];
  const relatedProducts = catalog
    .filter((item) => item.name !== product.name && (item.category === product.category || item.color === product.color))
    .slice(0, 3);

  container.innerHTML = `
    <div class="product-media">
      <img id="main-product-image" src="${galleryImages[0]}" alt="${product.name}">
      <div class="product-thumbs" aria-label="Galería de imágenes">
        ${galleryImages
          .map(
            (image, index) => `
            <button class="product-thumb ${index === 0 ? "is-active" : ""}" type="button" data-image="${image}" aria-label="Ver imagen ${index + 1} de ${product.name}">
              <img src="${image}" alt="">
            </button>
          `,
          )
          .join("")}
      </div>
    </div>
    <div class="product-info">
      <div class="product-nav">
        <button class="product-nav-btn" id="prev-product" type="button" ${prevProduct ? "" : "disabled"}>Anterior</button>
        <button class="product-nav-btn" id="next-product" type="button" ${nextProduct ? "" : "disabled"}>Siguiente</button>
      </div>
      <p class="product-kicker">${product.categoryLabel || "Colección"} · ${product.badge || "Disponible"}</p>
      <h1>${product.name}</h1>
      <p class="product-price">${formatter.format(displayPrice(product))}</p>
      <p class="product-stock">${product.stock || "Disponible en tienda"}</p>
      <p class="product-description">${description}</p>
      <dl class="product-specs">
        <div><dt>Color</dt><dd>${product.color || "Neutro"}</dd></div>
        <div><dt>Material</dt><dd>${product.material || "Tejido seleccionado"}</dd></div>
        <div><dt>Ajuste</dt><dd>${product.fit || "Corte regular"}</dd></div>
      </dl>
      <div class="product-sizes">
        <h2>Tallas</h2>
        <div class="size-grid" id="size-grid"></div>
      </div>
      <div class="product-actions">
        <button class="product-add" id="add-to-cart" type="button">Añadir a la bolsa</button>
        <p class="product-message" id="product-message" role="status"></p>
      </div>
      <div class="product-detail-blocks">
        <details open>
          <summary>Guía de tallas</summary>
          <p>Selecciona tu talla habitual. Para prendas amplias u oversize, revisa el ajuste indicado antes de comprar.</p>
        </details>
        <details>
          <summary>Cuidados</summary>
          <p>${product.care || "Cuidar siguiendo la etiqueta interior de la prenda."}</p>
        </details>
        <details>
          <summary>Compra online</summary>
          <p>La ficha esta preparada para solicitud de pedido asistida. El pago online se anadira en una fase posterior.</p>
        </details>
      </div>
      <div class="related-products">
        <h2>También te puede gustar</h2>
        <div class="related-grid">
          ${relatedProducts
            .map(
              (item) => `
              <button class="related-card" type="button" data-product-name="${item.name}">
                <img src="${item.image}" alt="${item.name}">
                <span>${item.name}</span>
                <strong>${formatter.format(displayPrice(item))}</strong>
              </button>
            `,
            )
            .join("")}
        </div>
      </div>
    </div>
  `;

  const sizeGrid = container.querySelector("#size-grid");
  const addToCartButton = container.querySelector("#add-to-cart");
  const productMessage = container.querySelector("#product-message");
  const prevButton = container.querySelector("#prev-product");
  const nextButton = container.querySelector("#next-product");
  const mainImage = container.querySelector("#main-product-image");
  let activeSize = selectedSize;

  container.querySelectorAll(".product-thumb").forEach((button) => {
    button.addEventListener("click", () => {
      mainImage.src = button.dataset.image;
      container.querySelectorAll(".product-thumb").forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
    });
  });

  const sizeStock = product.sizeStock && typeof product.sizeStock === "object" ? product.sizeStock : {};
  const sizes = (product.sizes || ["One size"]);
  const firstAvailable = sizes.find((size) => Math.max(0, Number(sizeStock[size] || 0)) > 0) || sizes[0];
  activeSize = firstAvailable;

  sizes.forEach((size, index) => {
    const available = Math.max(0, Number(sizeStock[size] || 0));
    const isAvailable = available > 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "size-chip";
    button.textContent = `${size}${isAvailable ? ` (${available})` : " (0)"}`;
    button.classList.toggle("is-active", size === firstAvailable);
    button.disabled = !isAvailable;
    button.setAttribute("aria-disabled", String(!isAvailable));
    button.addEventListener("click", () => {
      if (!isAvailable) {
        return;
      }
      activeSize = size;
      sizeGrid.querySelectorAll(".size-chip").forEach((chip) => chip.classList.remove("is-active"));
      button.classList.add("is-active");
    });
    sizeGrid.appendChild(button);
  });

  if (Math.max(0, Number(sizeStock[activeSize] || 0)) <= 0) {
    addToCartButton.disabled = true;
    productMessage.textContent = "Sin stock disponible en este artículo.";
  }

  addToCartButton.addEventListener("click", async () => {
    const result = await saveCartItem(product, activeSize);
    if (!result.ok) {
      productMessage.textContent = result.message;
      return;
    }
    productMessage.textContent = `${product.name} añadido a la bolsa en talla ${activeSize}.`;
  });

  if (prevProduct) {
    prevButton.addEventListener("click", () => openProduct(prevProduct));
  }

  if (nextProduct) {
    nextButton.addEventListener("click", () => openProduct(nextProduct));
  }

  container.querySelectorAll(".related-card").forEach((button) => {
    button.addEventListener("click", () => {
      const related = catalog.find((item) => item.name === button.dataset.productName);
      if (related) {
        openProduct(related);
      }
    });
  });
}

const product = parseProduct();

if (product) {
  if (product.isActive === false) {
    document.querySelector("#product-detail").innerHTML = `
      <div class="product-info">
        <p class="product-kicker">Producto no disponible</p>
        <h1>Articulo no visible</h1>
        <p class="product-description">Vuelve a la tienda para consultar el catalogo activo.</p>
        <a class="button" href="index.html">Volver a la tienda</a>
      </div>
    `;
  } else {
    renderProduct(product);
  }
} else {
  document.querySelector("#product-detail").innerHTML = `
    <div class="product-info">
      <p class="product-kicker">Producto no disponible</p>
      <h1>No se pudo abrir la ficha</h1>
      <p class="product-description">Vuelve a la tienda y abre un artículo desde el catálogo.</p>
      <a class="button" href="index.html">Volver a la tienda</a>
    </div>
  `;
}

window.addEventListener("storage", async (event) => {
  if (event.key === "dcosta-catalog") {
    const current = parseProduct();
    if (current) {
      const catalog = visibleProducts(await loadCatalog());
      const fresh = catalog.find((p) => (p.id && current.id && p.id === current.id) || p.name === current.name);
      if (fresh) renderProduct(fresh);
    }
  }
});
