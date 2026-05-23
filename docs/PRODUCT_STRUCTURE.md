# Estructura final de producto

Esta es la estructura estable para cargar producto real.

## Campos base

| Campo | Uso | Obligatorio |
| --- | --- | --- |
| `id` | Identificador interno unico | Si |
| `reference` | Referencia/SKU visible para gestion | Recomendado |
| `name` | Nombre comercial | Si |
| `category` | `women`, `men`, `wallets`, `bags` | Si |
| `categoryLabel` | Etiqueta visible de categoria | Recomendado |
| `price` | Precio base | Si |
| `salePrice` | Precio oferta, vacio si no hay oferta | No |
| `isFeatured` | `true` si es destacado | No |
| `isActive` | `true` si se muestra en tienda | Si |
| `stock` | Texto de disponibilidad | Si |
| `color` | Color principal | Recomendado |
| `material` | Material principal | Recomendado |
| `fit` | Corte, ajuste o formato | Recomendado |
| `badge` | Etiqueta corta: Nuevo, Oferta, etc. | No |
| `care` | Cuidados del producto | No |
| `sizes` | Tallas separadas por `|` | Si |
| `sizeStock` | Stock por talla, formato `S:5|M:3` | Si |
| `image` | URL imagen principal | Si |
| `image_url` | Alias de `image` para importacion CSV; tiene prioridad si ambas vienen rellenas | No |
| `images` | URLs extra separadas por `|` | No |
| `description` | Descripcion comercial | Recomendado |

## Reglas

- `salePrice` debe estar vacio o ser menor/igual que `price`.
- `isActive=false` oculta el producto en tienda, pero sigue disponible en admin.
- `sizeStock` es la fuente real de unidades por talla.
- `stock` es un texto comercial, no sustituye al stock por talla.
- Las imagenes pueden ser URLs externas al principio; mas adelante se podra migrar a subida propia.
