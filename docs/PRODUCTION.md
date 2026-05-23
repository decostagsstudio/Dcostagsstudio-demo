# Produccion

## Arquitectura prevista

- Frontend estatico servido desde la raiz del proyecto.
- Backend Node/Express escuchando en `127.0.0.1:4000`.
- PostgreSQL como base de datos persistente.
- Reverse proxy con HTTPS sirviendo la web y reenviando `/api` al backend.

En produccion, `scripts/store-api.js` usa `/api` cuando el dominio no es `localhost`, asi que frontend y API deben publicarse bajo el mismo dominio o bajo un proxy equivalente.

## Variables de entorno

1. Copia `backend/.env.production.example` a `backend/.env`.
2. Cambia estos valores antes de arrancar:
   - `CORS_ORIGIN`: dominio publico final, por ejemplo `https://dcostagsstudio.com,https://www.dcostagsstudio.com`.
   - `DATABASE_URL`: conexion PostgreSQL real.
   - `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres.
   - `TRUST_PROXY=true` si hay nginx, Caddy, Cloudflare, Railway, Render, Fly.io u otro proxy delante.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`: credenciales de Cloudinary.
   - `CLOUDINARY_FOLDER`: carpeta de destino para productos, por ejemplo `dcosta/products`.

El backend bloquea el arranque en `NODE_ENV=production` si `CORS_ORIGIN=*` o si `JWT_SECRET` es inseguro. Si faltan credenciales de Cloudinary, Supabase/PostgreSQL sigue funcionando y solo queda desactivada la subida de imagenes.

## Cloudinary

Cloudinary se usa solo para almacenar y optimizar binarios de imagen. Supabase/PostgreSQL sigue siendo la fuente principal de datos del proyecto.

En PostgreSQL se guardan solo estas URLs devueltas por Cloudinary:

- `products.image`: URL principal del producto.
- `products.images`: URLs extra del producto.

No se guardan imagenes fisicas en el servidor Express. Las subidas pasan por memoria y se envian directamente a Cloudinary.

### Datos exactos que debes copiar desde Cloudinary

En el panel de Cloudinary, entra en `Dashboard` y copia:

- `Cloud name` -> `CLOUDINARY_CLOUD_NAME`
- `API Key` -> `CLOUDINARY_API_KEY`
- `API Secret` -> `CLOUDINARY_API_SECRET`

Despues decide una carpeta logica para productos:

- `CLOUDINARY_FOLDER=dcosta/products`

No copies el `API Environment variable` completo si contiene valores que no quieres compartir. En este proyecto se usan variables separadas para que el `.env` sea claro.

Las imagenes se suben con conversion automatica a `webp`, calidad automatica y limite de ancho para mantener el catalogo optimizado.

## Primer despliegue

Desde `backend/`:

```bash
npm ci --omit=dev
npm run db:migrate
npm run db:seed-admin
npm run db:seed-catalog
npm start
```

Comprueba salud:

```bash
curl https://tu-dominio.com/api/health
```

Respuesta esperada:

```json
{"ok":true,"service":"dcosta-store-backend"}
```

## Proxy recomendado

Ejemplo nginx:

```nginx
server {
  listen 443 ssl http2;
  server_name dcostagsstudio.com www.dcostagsstudio.com;

  root /var/www/dcosta-store;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:4000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Checklist antes de abrir al publico

- HTTPS activo y redireccion HTTP a HTTPS.
- `backend/.env` no versionado.
- `CORS_ORIGIN` sin comodines.
- Migraciones ejecutadas.
- Catalogo sembrado o importado desde admin.
- Usuario director creado con `npm run db:seed-admin` y contrasena cambiada.
- Cloudinary configurado y probado desde admin > Productos.
- Backups de PostgreSQL programados.
- Proceso gestionado con systemd, PM2 o el gestor de la plataforma.
