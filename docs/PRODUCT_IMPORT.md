# Importacion de productos reales

Usa `data/products-import-template.csv` como plantilla para preparar el catalogo real.

## Flujo recomendado

1. Rellena una copia de la plantilla.
2. Mantén `id` y `reference` unicos.
3. Usa categorias: `women`, `men`, `wallets`, `bags`.
4. Usa `sizeStock` con formato `S:3|M:5|L:2`.
5. Pon `isActive=false` para productos que aun no deban verse en tienda.
6. Entra en admin > Productos > Importar CSV.

## Notas

- La importacion reemplaza el catalogo completo por el contenido del CSV.
- `salePrice` puede quedar vacio si no hay oferta.
- `images` admite varias URLs separadas por `|`.
- `image_url` se acepta como alias de `image` y tiene prioridad si ambas columnas vienen rellenas.
- Para ecommerce grande, lo recomendado es que `image_url` e `images` ya contengan URLs de Cloudinary optimizadas.
- La importacion CSV/Excel no guarda archivos de imagen en el servidor. Solo importa URLs.
- Conviene probar primero con 2 o 3 productos reales antes de importar todo el catalogo.

## Imagenes y Cloudinary

Puedes subir imagenes desde admin > Productos al crear o editar un producto. El backend envia los archivos directamente a Cloudinary desde memoria y devuelve URLs `webp`; esas URLs son las que se guardan en Supabase/PostgreSQL.

Si Cloudinary falla o no esta configurado, el admin mantiene el fallback seguro: puedes seguir guardando URLs manuales en `image`, `image_url` o `images`, pero nunca se guardan binarios en Express.
