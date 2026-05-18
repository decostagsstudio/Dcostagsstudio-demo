const storeApi = window.DCOSTA_STORE_API;
const view = document.querySelector("#client-view");
const routeTitle = document.querySelector("#route-title");
const routeDescription = document.querySelector("#route-description");
const navLinks = document.querySelectorAll("[data-route]");
const routeToggle = document.querySelector("#route-toggle");
const routeMenu = document.querySelector("#route-menu");
const routeLabel = document.querySelector("#route-label");

const formatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const profileKey = "dcosta-client-profile";
const accountKey = "dcosta-client-account";
const sessionKey = "dcosta-client-session";

const routeMeta = {
  acceso: {
    title: "Acceso",
    description: "Crea una cuenta local de prueba para preparar el futuro login de clientes.",
  },
  perfil: {
    title: "Perfil",
    description: "Guarda tus datos de contacto para futuras compras online.",
  },
  pedidos: {
    title: "Mis pedidos",
    description: "Consulta tus pedidos guardados y revisa si alguno está en camino.",
  },
  favoritos: {
    title: "Favoritos",
    description: "Consulta las prendas que has marcado desde la tienda.",
  },
  bolsa: {
    title: "Bolsa",
    description: "Revisa la selección que tienes preparada antes de activar compra online.",
  },
  ayuda: {
    title: "Ayuda",
    description: "Encuentra soporte sobre pedidos, cambios, devoluciones y contacto con tienda.",
  },
};

function readProfile() {
  try {
    const value = localStorage.getItem(profileKey);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function saveProfile(profile) {
  localStorage.setItem(profileKey, JSON.stringify(profile));
}

function readAccount() {
  try {
    const value = localStorage.getItem(accountKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveAccount(account) {
  localStorage.setItem(accountKey, JSON.stringify(account));
}

function readSession() {
  try {
    const value = localStorage.getItem(sessionKey);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(sessionKey);
}

function routeFromHash() {
  return window.location.hash.replace("#/", "") || "acceso";
}

function setActiveRoute(route) {
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.route === route);
  });
  routeLabel.textContent = (routeMeta[route] || routeMeta.acceso).title;
}

function closeRouteMenu() {
  routeMenu.classList.remove("is-open");
  routeToggle.setAttribute("aria-expanded", "false");
}

function toggleRouteMenu() {
  const isOpen = routeMenu.classList.toggle("is-open");
  routeToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

async function render() {
  const route = routeFromHash();
  const meta = routeMeta[route] || routeMeta.acceso;
  setActiveRoute(route);
  closeRouteMenu();
  routeTitle.textContent = meta.title;
  routeDescription.textContent = meta.description;

  if (route === "perfil") {
    renderProfile();
  } else if (route === "pedidos") {
    await renderOrders();
  } else if (route === "favoritos") {
    await renderFavorites();
  } else if (route === "bolsa") {
    await renderBag();
  } else if (route === "ayuda") {
    renderHelp();
  } else {
    renderAccess();
  }
}

function renderAccess() {
  const profile = readProfile();
  const account = readAccount();
  const session = readSession();
  view.innerHTML = `
    <section class="client-card">
      <h2>${session?.email ? "Sesión local activa" : "Acceso de cliente"}</h2>
      <p>Esta zona todavía no tiene login real. Sirve para diseñar el área privada del cliente y preparar la futura autenticación con backend.</p>
      ${session?.email ? `<p class="session-note">Has iniciado sesión como <strong>${session.email}</strong>.</p>` : ""}
    </section>
    <section class="client-card">
      <div class="auth-switch" role="tablist" aria-label="Acceso de cliente">
        <button class="auth-tab is-active" id="login-tab" type="button" data-auth-view="login">Iniciar sesión</button>
        <button class="auth-tab" id="register-tab" type="button" data-auth-view="register">Registrarse</button>
      </div>
      <div class="auth-panels">
        <form class="client-form auth-panel is-active" id="login-form">
          <label class="form-wide">Email
            <input name="email" type="email" value="${session?.email || profile.email || ""}" required>
          </label>
          <label class="form-wide">Contraseña
            <input name="password" type="password" required>
          </label>
          <div class="form-actions">
            <button class="client-link-button" id="recover-password-button" type="button">Recuperar contraseña</button>
            ${session?.email ? '<button class="client-button secondary" id="logout-button" type="button">Cerrar sesión</button>' : ""}
            <button class="client-button" type="submit">Entrar</button>
          </div>
          <p class="message form-wide" id="login-message"></p>
        </form>
        <form class="client-form auth-panel" id="register-form">
          <label>Nombre
            <input name="name" value="${profile.name || ""}" required>
          </label>
          <label>Apellidos
            <input name="lastName" value="${profile.lastName || ""}" required>
          </label>
          <label>DNI
            <input name="dni" value="${profile.dni || ""}" required>
          </label>
          <label>Teléfono
            <input name="phone" value="${profile.phone || ""}">
          </label>
          <label class="form-wide">Email
            <input name="email" type="email" value="${profile.email || ""}" required>
          </label>
          <label>Ciudad
            <input name="city" value="${profile.city || ""}" required>
          </label>
          <label>Provincia
            <input name="province" value="${profile.province || ""}" required>
          </label>
          <label>CP
            <input name="postalCode" value="${profile.postalCode || ""}" required>
          </label>
          <label>Dirección
            <input name="address" value="${profile.address || ""}" required>
          </label>
          <label>Contraseña
            <input name="password" type="password" minlength="6" required>
          </label>
          <label>Repetir contraseña
            <input name="confirmPassword" type="password" minlength="6" required>
          </label>
          <div class="form-actions">
            <button class="client-button" type="submit">Crear cuenta local</button>
          </div>
          <p class="message form-wide" id="register-message"></p>
        </form>
      </div>
    </section>
  `;

  const authTabs = Array.from(document.querySelectorAll(".auth-tab"));
  const authPanels = Array.from(document.querySelectorAll(".auth-panel"));

  function openAuthView(viewName) {
    authTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.authView === viewName);
    });
    authPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === `${viewName}-form`);
    });
  }

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => openAuthView(tab.dataset.authView));
  });

  document.querySelector("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = data.get("email").trim();
    const password = data.get("password").trim();
    const savedAccount = readAccount();

    if (!savedAccount || savedAccount.email !== email || savedAccount.password !== password) {
      document.querySelector("#login-message").textContent = "No existe una cuenta local con esos datos.";
      return;
    }

    saveSession({ email, name: savedAccount.name });
    document.querySelector("#login-message").textContent = "Sesión iniciada en este navegador.";
    renderAccess();
  });

  document.querySelector("#recover-password-button").addEventListener("click", () => {
    const loginForm = document.querySelector("#login-form");
    const email = new FormData(loginForm).get("email").trim();
    const savedAccount = readAccount();
    const loginMessage = document.querySelector("#login-message");

    if (!email) {
      loginMessage.textContent = "Escribe tu email para recuperar la contraseña.";
      return;
    }

    if (!savedAccount || savedAccount.email !== email) {
      loginMessage.textContent = "No hay una cuenta local registrada con ese email.";
      return;
    }

    loginMessage.textContent = `Tu contraseña local es: ${savedAccount.password}`;
  });

  document.querySelector("#register-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = data.get("name").trim();
    const lastName = data.get("lastName").trim();
    const email = data.get("email").trim();
    const dni = data.get("dni").trim();
    const phone = data.get("phone").trim();
    const address = data.get("address").trim();
    const city = data.get("city").trim();
    const province = data.get("province").trim();
    const postalCode = data.get("postalCode").trim();
    const password = data.get("password").trim();
    const confirmPassword = data.get("confirmPassword").trim();

    if (password !== confirmPassword) {
      document.querySelector("#register-message").textContent = "Las contraseñas no coinciden.";
      return;
    }

    saveAccount({ name, lastName, email, dni, phone, address, city, province, postalCode, password });
    saveProfile({
      ...profile,
      name,
      lastName,
      email,
      dni,
      phone,
      address,
      city,
      province,
      postalCode,
    });
    saveSession({ name, email });
    document.querySelector("#register-message").textContent = "Cuenta local creada. La sesión está iniciada.";
    openAuthView("login");
    renderAccess();
  });

  const logoutButton = document.querySelector("#logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearSession();
      renderAccess();
    });
  }
}

function renderProfile() {
  const profile = readProfile();
  view.innerHTML = `
    <section class="client-card">
      <form class="client-form" id="profile-form">
        <label>Nombre completo
          <input name="name" value="${profile.name || ""}">
        </label>
        <label>Email
          <input name="email" type="email" value="${profile.email || ""}">
        </label>
        <label>Apellidos
          <input name="lastName" value="${profile.lastName || ""}">
        </label>
        <label>DNI
          <input name="dni" value="${profile.dni || ""}">
        </label>
        <label>Teléfono
          <input name="phone" value="${profile.phone || ""}">
        </label>
        <label>Ciudad
          <input name="city" value="${profile.city || ""}">
        </label>
        <label>Provincia
          <input name="province" value="${profile.province || ""}">
        </label>
        <label>CP
          <input name="postalCode" value="${profile.postalCode || ""}">
        </label>
        <label class="form-wide">Dirección
          <input name="address" value="${profile.address || ""}">
        </label>
        <label class="form-wide">Notas
          <textarea name="notes">${profile.notes || ""}</textarea>
        </label>
        <div class="form-actions">
          <button class="client-button secondary" id="clear-profile" type="button">Limpiar</button>
          <button class="client-button" type="submit">Guardar perfil</button>
        </div>
        <p class="message form-wide" id="profile-message"></p>
      </form>
    </section>
  `;

  document.querySelector("#profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveProfile({
      name: data.get("name").trim(),
      lastName: data.get("lastName").trim(),
      email: data.get("email").trim(),
      dni: data.get("dni").trim(),
      phone: data.get("phone").trim(),
      city: data.get("city").trim(),
      province: data.get("province").trim(),
      postalCode: data.get("postalCode").trim(),
      address: data.get("address").trim(),
      notes: data.get("notes").trim(),
    });
    document.querySelector("#profile-message").textContent = "Perfil guardado en este navegador.";
  });

  document.querySelector("#clear-profile").addEventListener("click", () => {
    localStorage.removeItem(profileKey);
    renderProfile();
  });
}

async function renderFavorites() {
  const favorites = await storeApi.getFavorites();

  if (!favorites.length) {
    view.innerHTML = '<p class="empty-state">Todavía no tienes favoritos. Marca prendas desde la tienda para verlas aquí.</p>';
    return;
  }

  view.innerHTML = `
    <div class="item-list">
      ${favorites.map((item) => renderItem(item)).join("")}
    </div>
  `;
}

async function renderBag() {
  const cart = await storeApi.getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!cart.length) {
    view.innerHTML = '<p class="empty-state">Tu bolsa está vacía. Añade productos desde la tienda para revisar tu selección aquí.</p>';
    return;
  }

  view.innerHTML = `
    <div class="summary-grid">
      <article class="summary-card"><span>Artículos</span><strong>${totalItems}</strong></article>
      <article class="summary-card"><span>Líneas</span><strong>${cart.length}</strong></article>
      <article class="summary-card"><span>Total</span><strong>${formatter.format(total)}</strong></article>
    </div>
    <div class="item-list">
      ${cart
        .map((item) =>
          renderItem({
            ...item,
            subtitle: `Talla ${item.size} · Cantidad ${item.quantity}`,
            displayPrice: formatter.format(item.price * item.quantity),
          }),
        )
        .join("")}
    </div>
  `;
}

async function renderOrders() {
  const orders = await storeApi.getOrders();
  const activeOrders = orders.filter((order) => order.status === "En camino").length;

  if (!orders.length) {
    view.innerHTML = `
      <section class="client-card">
        <h2>Mis pedidos</h2>
        <p>Todavía no hay pedidos guardados. Cuando se guarde una selección desde la bolsa, aparecerá aquí con su estado.</p>
      </section>
    `;
    return;
  }

  view.innerHTML = `
    <div class="summary-grid">
      <article class="summary-card"><span>Pedidos</span><strong>${orders.length}</strong></article>
      <article class="summary-card"><span>En camino</span><strong>${activeOrders}</strong></article>
      <article class="summary-card"><span>Último</span><strong>${formatOrderDate(orders[0].createdAt)}</strong></article>
    </div>
    <div class="order-list">
      ${orders.map(renderOrder).join("")}
    </div>
  `;
}

function renderOrder(order) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const statusClass = order.status === "En camino" ? " is-shipping" : "";

  return `
    <article class="order-card">
      <div class="order-card-header">
        <div>
          <span>Pedido ${order.id}</span>
          <h2>${formatOrderDate(order.createdAt)}</h2>
        </div>
        <strong class="order-status${statusClass}">${order.status}</strong>
      </div>
      <p>${order.statusDetail || "Pedido guardado en el área de cliente."}</p>
      <div class="order-items">
        ${order.items.map((item) => `
          <span>${item.name} · Talla ${item.size} · x${item.quantity}</span>
        `).join("")}
      </div>
      <div class="order-total">
        <span>${itemCount} artículo${itemCount === 1 ? "" : "s"}</span>
        <strong>${formatter.format(order.total)}</strong>
      </div>
    </article>
  `;
}

function formatOrderDate(value) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function renderHelp() {
  view.innerHTML = `
    <section class="client-card">
      <h2>Ayuda</h2>
      <p>Estamos preparando la compra online completa. Mientras tanto, puedes revisar tus datos, favoritos, bolsa y pedidos guardados desde esta área.</p>
    </section>
    <div class="help-grid">
      <article class="help-card">
        <span>Pedidos</span>
        <h2>Estado de pedidos</h2>
        <p>Los pedidos guardados aparecen en Mis pedidos. Cuando haya envío real, aquí se mostrará si está en camino.</p>
      </article>
      <article class="help-card">
        <span>Cambios</span>
        <h2>Cambios y devoluciones</h2>
        <p>Consulta con tienda para confirmar disponibilidad, tallas y plazos antes de tramitar cualquier cambio.</p>
      </article>
      <article class="help-card">
        <span>Contacto</span>
        <h2>Atención al cliente</h2>
        <p>Escríbenos a decostags04630@gmail.com o llama al +34 623 46 86 79.</p>
      </article>
    </div>
  `;
}

function renderItem(item) {
  return `
    <article class="client-item">
      <img src="${item.image}" alt="${item.name}">
      <h2>${item.name}</h2>
      <p>${item.subtitle || item.categoryLabel || "Producto guardado"}</p>
      <p>${item.displayPrice || formatter.format(item.price)}</p>
    </article>
  `;
}

window.addEventListener("hashchange", render);

routeToggle.addEventListener("click", () => {
  toggleRouteMenu();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".client-route-picker")) {
    closeRouteMenu();
  }
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    closeRouteMenu();
  });
});

if (!window.location.hash) {
  window.location.hash = "#/acceso";
} else {
  render();
}
