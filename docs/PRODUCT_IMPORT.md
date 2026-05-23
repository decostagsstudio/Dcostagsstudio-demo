# Importacion de productos

Usa `data/products-import-template.csv` como plantilla base. Ahora mismo solo contiene cabeceras porque todavia no hay catalogo real.

## Archivos

- `data/products-import-template.csv`: plantilla vacia para rellenar con producto real.
- `data/products-import-sample-validation.csv`: muestra de 3 productos de prueba, marcada con `VALIDACION`, para revisar formato sin tratarla como catalogo definitivo.
- `scripts/validate-product-import.mjs`: validacion local del CSV antes de importarlo desde admin.

## Validar un CSV

```bash
node scripts/validate-product-import.mjs data/products-import-sample-validation.csv
```

El validador comprueba cabeceras, categorias, precios, URLs de imagen, tallas, stock por talla, duplicados y visibilidad (`isActive`). Solo valida la sintaxis de las URLs; no descarga las imagenes.

## Flujo cuando exista catalogo real

1. Copia `data/products-import-template.csv`.
2. Rellena primero 2 o 3 productos reales.
3. Ejecuta el validador sobre ese CSV.
4. Entra en admin > Productos > Importar CSV.
5. Comprueba en admin: imagen principal, galeria, tallas, unidades por talla, precio, oferta y estado.
6. Comprueba en tienda: solo aparecen los productos con `isActive=true`.
7. Cuando el piloto este correcto, importa el catalogo completo.

## Reglas de datos

- `id` y `reference` deben ser unicos.
- Categorias admitidas: `women`, `men`, `wallets`, `bags`.
- `sizeStock` usa formato `S:3|M:5|L:2`.
- `sizes` debe contener las mismas tallas que `sizeStock`.
- `isActive=false` oculta el producto en tienda, pero sigue disponible en admin.
- `salePrice` puede quedar vacio; si existe, debe ser menor o igual que `price`.
- `image_url` se acepta como alias de `image` y tiene prioridad si ambas columnas vienen rellenas.
- `images` admite varias URLs separadas por `|`.

## Avisos importantes

- La importacion reemplaza el catalogo completo por el contenido del CSV.
- La importacion CSV no sube archivos de imagen ni guarda binarios en Express. Solo importa URLs.
- Para catalogo grande, conviene usar URLs finales de Cloudinary optimizadas en `image_url` e `images`.
- Tambien puedes subir imagenes desde admin > Productos al crear o editar producto; el backend las envia a Cloudinary y devuelve URLs `webp`.
