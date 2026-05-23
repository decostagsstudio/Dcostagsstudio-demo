# Checklist de lanzamiento sin pasarela

## Listo en codigo

- Backend Express con PostgreSQL.
- Catalogo por API con importacion CSV desde admin.
- Pedidos asistidos sin cobro online.
- Subida de imagenes a Cloudinary.
- Notificacion opcional de pedidos por webhook.
- Frontend publico, area cliente local y panel admin.
- Aviso legal basico en `legal.html`.
- Smoke visual local en `scripts/visual-smoke.mjs`.

## Bloqueado por datos reales

- Catalogo real completo.
- Imagenes finales de producto.
- Dominio definitivo.
- Hosting definitivo.
- Variables de produccion reales.
- Textos legales revisados por responsable legal.

## Ultima comprobacion antes de abrir

1. Ejecutar migraciones en produccion.
2. Crear director con `SEED_DIRECTOR_PASSWORD` fuerte.
3. Importar catalogo real.
4. Probar login admin.
5. Crear una solicitud de pedido real de prueba.
6. Confirmar que el webhook de pedido avisa al negocio, si se usa.
7. Confirmar HTTPS, proxy `/api` y `CORS_ORIGIN`.
8. Verificar `robots.txt`, `sitemap.xml` y pagina legal con el dominio final.
