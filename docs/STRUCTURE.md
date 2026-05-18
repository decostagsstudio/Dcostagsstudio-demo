# Estructura del proyecto

Esta web sigue funcionando como sitio estático, pero queda preparada para migrar a backend.

```text
/
  index.html              Página principal de la tienda
  product.html            Ficha de producto
  /admin                  Administración local por rutas hash
  /backend                API modular (Express + PostgreSQL)
  /assets                 Carpeta reservada para imágenes y recursos propios
  /data/catalog.js        Catálogo local/falso de productos
  /scripts/store-api.js   Capa de datos local/API
  /scripts/main.js        Interacción de la tienda
  /scripts/product.js     Interacción de ficha de producto
  /styles/main.css        Estilos públicos de tienda y producto
```

## Capa de datos

El archivo clave es `scripts/store-api.js`.

Ahí está esta configuración:

```js
const DCOSTA_DATA_SOURCE = "local";
```

Mientras esté en `"local"`, la tienda usa productos falsos/locales desde `data/catalog.js` y `localStorage`.

Cuando exista backend, se podrá cambiar a:

```js
const DCOSTA_DATA_SOURCE = "api";
```

Entonces las funciones usarán rutas como:

```text
/api/products
/api/cart
/api/favorites
```

## Funciones preparadas

- `getProducts()`
- `getProductById()`
- `saveCatalog()`
- `getCart()`
- `saveCart()`
- `getFavorites()`
- `saveFavorites()`

Estas funciones ya son asíncronas para que puedan trabajar tanto con datos locales como con servidor real.
