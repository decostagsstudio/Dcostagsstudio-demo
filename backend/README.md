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
5. Levantar backend:
   - `npm run dev`

## Endpoints iniciales
- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/products`
- `PUT /api/products/bulk` (director/gerencia)
- `GET /api/orders`
- `PUT /api/orders` (director/gerencia)

## Nota de integración frontend
El frontend actual ya tiene capa `scripts/store-api.js` preparada para cambiar de modo `local` a `api`.
