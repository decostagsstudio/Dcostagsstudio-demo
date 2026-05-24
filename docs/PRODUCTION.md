# Produccion

## Eleccion de despliegue

Arquitectura elegida para el primer despliegue real:

- Frontend provisional: Vercel.
- Backend/API: Render Web Service en region `frankfurt`.
- Base de datos: Supabase PostgreSQL en region UE.
- Dominio final y DNS: Cloudflare con dominio canonico `dcostagsstudio.com`.
- Imagenes: Cloudinary para binarios de producto; PostgreSQL guarda solo URLs.

Esta opcion evita mantener un VPS, nginx, PM2 y certificados manuales. El proyecto incluye `render.yaml` para desplegar el backend y ejecutar migraciones antes de publicar cada build.

## Dominio

Dominio provisional publico de Vercel:

```text
https://dcostagsstudio-demo.vercel.app
```

La URL con formato `dcostagsstudio-demo-cve78f5xi-dcostagsstudio.vercel.app` es una URL de deployment/preview y puede seguir protegida por Vercel Authentication aunque el alias publico funcione.

Dominio canonico final:

```text
https://dcostagsstudio.com
```

Alias final:

```text
https://www.dcostagsstudio.com
```

Mientras se use el dominio provisional, `STORE_PUBLIC_URL` apunta a Vercel y `CORS_ORIGIN` acepta la URL provisional, el dominio canonico y `www`.

Si al abrir Vercel aparece `Authentication Required`, no es un fallo del frontend: es Deployment Protection. Para demo publica, desactivalo en Vercel > Project Settings > Deployment Protection o usa un bypass token temporal.

Cuando se compre/conecte el dominio final, cambia `STORE_PUBLIC_URL` a `https://dcostagsstudio.com` y añade el dominio custom en el hosting que vaya a servir la web publica.
Hasta entonces, `sitemap.xml`, `robots.txt` y los canonical apuntan al dominio provisional publico de Vercel para que la indexacion no apunte a un dominio sin conectar.

## Vercel

El despliegue de Vercel usa:

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: raiz del repositorio

El script de build copia HTML, CSS, JS, `data`, `admin` y `cliente` a `dist`. Esto evita que Vercel publique solo `index.html`.

El archivo `vercel.json` deja rutas directas para:

- `/admin` -> `/admin/index.html`
- `/cliente` -> `/cliente/index.html`

Vercel puede servir la web estatica. La API real sigue en Render/Supabase; si se quiere que admin guarde contra backend desde Vercel, hay que configurar un rewrite de `/api/*` hacia la URL publica del backend cuando Render este desplegado.

Alternativa recomendada para este repositorio: definir variables de entorno en Vercel y dejar que el build genere `dist/scripts/runtime-config.js`:

```text
DCOSTA_DATA_SOURCE=api
DCOSTA_API_BASE_URL=https://dcostagsstudio-demo.onrender.com/api
```

Sin esas variables, la web publica sigue en modo local para que el catalogo no dependa de un backend sin desplegar.

Despues de cambiar esas variables en Vercel, haz redeploy y comprueba:

```bash
npm run check:public
```

El aviso "Vercel todavia en modo local" debe desaparecer cuando `dist/scripts/runtime-config.js` incluya `dataSource: "api"` y `apiBaseUrl`.

## Supabase PostgreSQL

1. Crea un proyecto Supabase en region UE.
2. Abre Project Settings > Database.
3. Copia la connection string URI.
4. Para Render, usa preferentemente el Transaction Pooler.
5. Asegurate de que la URL termina con `?sslmode=require`.
6. Guarda esa URL en `DATABASE_URL`.

El backend ya activa SSL cuando detecta Supabase o `sslmode=require`.

## Variables de entorno

Archivo local preparado:

```text
backend/.env.production
```

Este archivo no debe versionarse. Contiene valores reales de dominio provisional y placeholders `CHANGE_ME` para secretos:

- `DATABASE_URL`: URI de Supabase.
- `JWT_SECRET`: secreto aleatorio de al menos 32 caracteres.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: credenciales de Cloudinary.
- `SEED_DIRECTOR_PASSWORD`: contrasena inicial fuerte para crear el usuario director.
- `ORDER_NOTIFICATION_WEBHOOK_URL`: opcional si se conectan avisos de pedidos.

Genera `JWT_SECRET` con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

En Render, pega estas variables en Environment. El `render.yaml` deja los secretos como `sync: false` para que Render los pida o los mantenga fuera del repositorio.

## Primer despliegue en Render

1. Sube el repositorio a GitHub/GitLab/Bitbucket.
2. En Render, crea Blueprint desde `render.yaml`.
3. Rellena los secretos marcados con `sync: false`.
4. Verifica que el servicio usa:
   - Build command: `cd backend && npm ci --omit=dev`
   - Pre-deploy command: `cd backend && npm run db:migrate`
   - Start command: `cd backend && npm start`
   - Health check path: `/api/health`
5. Lanza el primer deploy.
6. Cuando Render de la URL temporal, comprueba:

```bash
curl https://dcostagsstudio-demo.onrender.com/api/health
curl https://dcostagsstudio-demo.onrender.com/api/ready
```

Respuesta esperada:

```json
{"ok":true,"service":"dcosta-store-backend"}
```

## Seed inicial

Despues de que las migraciones hayan corrido correctamente, ejecuta una vez en Render Shell:

```bash
cd backend && npm run db:seed-admin
```

Si aun quieres cargar el catalogo demo inicial:

```bash
cd backend && npm run db:seed-catalog
```

Para catalogo real, usa admin > Productos > Importar CSV siguiendo `docs/PRODUCT_IMPORT.md`.

## Pruebas antes de abrir

- La URL de Vercel no muestra `Authentication Required`.
- Home carga desde la URL provisional.
- Admin carga desde `/admin`.
- `/api/health` responde 200 en Render.
- Login director funciona cuando Vercel tenga `/api` proxyeado o cuando se use la URL Render que sirve frontend + API.
- `GET /api/products` devuelve JSON.
- Subida de imagen en admin devuelve URLs Cloudinary `webp`.
- Importacion CSV de 2 o 3 productos reales funciona.
- Producto con `isActive=false` no aparece en tienda.
- Pedido de prueba entra en admin.

## Checklist operativo

- Activar backups en Supabase; en produccion real, usar plan con backups diarios.
- Mantener `CORS_ORIGIN` sin comodines.
- No versionar `.env`, `.env.production` ni secretos.
- Cambiar la contrasena del director tras el primer acceso.
- Revisar logs de Render despues de cada deploy.
- Probar restauracion/export de base de datos antes de campanas o carga masiva.
