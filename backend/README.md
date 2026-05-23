# Backend (PostgreSQL) - DCOSTA Store

Backend modular y escalable para la tienda.

## Stack
- Node.js + Express
- PostgreSQL (`pg`)
- JWT auth
- Validación con `zod`

## Estructura
- `src/config` configuración y conexión DB
- `src/common` middlewares y utilidades compartidas
- `src/modules/auth` autenticación
- `src/modules/products` catálogo
- `src/modules/orders` pedidos
- `src/db` migraciones y seeds

## Arranque rápido
1. Copiar `.env.example` a `.env` y ajustar valores.
2. Instalar dependencias:
   - `npm install`
3. Ejecutar migraciones:
   - `npm run db:migrate`
4. Crear/actualizar usuario director:
   - `npm run db:seed-admin`
5. Cargar catálogo inicial:
   - `npm run db:seed-catalog`
6. Levantar backend:
   - `npm run dev`

## Endpoints iniciales
- `GET /api/health`
- `GET /api/ready`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products/images` (director/gerencia, subida directa a Cloudinary)
- `PUT /api/products/bulk` (director/gerencia)
- `GET /api/orders` (director/gerencia)
- `POST /api/orders`
- `PUT /api/orders` (director/gerencia)

## Nota de integración frontend
El frontend actual ya tiene capa `scripts/store-api.js` preparada para cambiar de modo `local` a `api`.

Para que Vercel use el backend real, define estas variables en Vercel antes del build:

- `DCOSTA_DATA_SOURCE=api`
- `DCOSTA_API_BASE_URL=https://TU-BACKEND.onrender.com/api`

El build genera `dist/scripts/runtime-config.js` con esos valores. Si no estan definidos, Vercel queda en modo local para que la tienda publica no rompa mientras el backend no este desplegado.

## Imagenes de producto
Supabase/PostgreSQL sigue siendo la fuente principal de datos. Cloudinary se usa solo para almacenar y optimizar imagenes.

Variables necesarias para subida:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `IMAGE_UPLOAD_MAX_MB`

El endpoint de subida usa memoria y no guarda archivos fisicos en el servidor. Solo devuelve URLs `webp` para guardar en `products.image` y `products.images`.

## Notificaciones de pedido

`POST /api/orders` puede avisar a un webhook externo sin bloquear el pedido si falla. Sirve para conectar Make, Zapier, n8n o un servicio de email transaccional.

Variables opcionales:
- `STORE_PUBLIC_URL`
- `ORDER_NOTIFICATION_WEBHOOK_URL`
- `ORDER_NOTIFICATION_WEBHOOK_SECRET`
- `ORDER_NOTIFICATION_TO_EMAIL`

En produccion, `npm run db:seed-admin` exige definir `SEED_DIRECTOR_PASSWORD` con una contrasena inicial fuerte para evitar credenciales por defecto.
