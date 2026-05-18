# Plan de backend a medida

## Stack recomendado

- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Autenticación: sesión HTTP o JWT con refresh token
- Subida de imágenes: almacenamiento local al principio, S3 compatible más adelante
- Pagos futuros: Redsys o Stripe

## Rutas iniciales de API

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id

GET    /api/settings
PUT    /api/settings
```

## Rutas futuras para venta online

```text
POST   /api/orders
GET    /api/admin/orders
GET    /api/admin/orders/:id
POST   /api/payments/create-session
POST   /api/payments/webhook
```

## Tablas iniciales

```text
admin_users
categories
products
product_images
product_variants
settings
```

## Tablas futuras para ecommerce

```text
customers
orders
order_items
payments
shipping_addresses
inventory_movements
```

## Migración desde la web actual

El archivo `scripts/store-api.js` es el punto de sustitución.

Ahora, con `DCOSTA_DATA_SOURCE = "local"`:

```js
await getProducts() -> localStorage / data/catalog.js
```

Después, con `DCOSTA_DATA_SOURCE = "api"`:

```js
await getProducts() -> fetch("/api/products")
```

La interfaz pública y el admin deberían cambiar lo menos posible si mantenemos esa capa.
