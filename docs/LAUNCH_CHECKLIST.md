# Checklist de lanzamiento sin pasarela

## Listo en codigo

- Backend Express con PostgreSQL.
- Catalogo por API con importacion CSV desde admin.
- Pedidos asistidos sin cobro online.
- Subida de imagenes a Cloudinary.
- Notificacion opcional de pedidos por webhook.
- Frontend publico, area cliente local y panel admin.
- Aviso legal, privacidad, cookies y condiciones en `legal.html`.
- Consentimiento legal obligatorio en pedido y registro local.
- Sitemap, canonical y datos estructurados apuntando al dominio publico provisional de Vercel.
- Smoke visual local en `scripts/visual-smoke.mjs`.
- Comprobacion publica con `npm run check:public`.

## Estado publico actual

- `https://dcostagsstudio-demo.vercel.app/` responde correctamente.
- `https://dcostagsstudio-demo.vercel.app/legal.html` contiene el titular fiscal real.
- Vercel sigue en modo local hasta configurar `DCOSTA_DATA_SOURCE=api` y `DCOSTA_API_BASE_URL`.
- `https://dcosta-store.onrender.com/api/health` devuelve 404, por lo que Render no esta desplegado en esa URL o el servicio usa otra URL.

## Bloqueado por datos reales

- Catalogo real completo.
- Imagenes finales de producto.
- Dominio definitivo.
- Despliegue real del backend en Render o URL definitiva equivalente.
- Variables de produccion reales en Render y Vercel.
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
9. Ejecutar `npm run check:public` hasta que no queden fallos.
