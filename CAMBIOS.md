# Proyecto completo — Medibookit (zenix)

Esto es TODO el código fuente actualizado, no solo los cambios sueltos.
Descomprime encima de tu carpeta `zenix/` (pisa lo que ya tienes) y corré
`npm run dev` — no hace falta `npm install` de nuevo, tu `node_modules` no
se toca.

## Qué NO incluye este zip (a propósito)
- `node_modules/` — no cambió nada ahí, tu instalación local ya sirve.
- `.git/` — es tu historial de versiones; si lo pisara podría romperte el
  repo. No lo toques con este zip.
- `.env` — tiene tus claves. No va en ningún zip que te mande.
- `dist/`, `.astro/`, `.netlify/` — son cachés/salidas de build, se
  regeneran solas.

## El error nuevo que mandaste (ya corregido)
Ese error real era mío: `NotificationBell.tsx` usa `useSyncExternalStore` de
React, y le faltaba el tercer argumento (`getServerSnapshot`), obligatorio
para que funcione durante el render en servidor de Astro. Sin eso, React
tronaba al renderizar esa parte en el servidor — eso explica tanto el
"Missing getServerSnapshot" como el "Invalid hook call" que salían juntos,
son la misma causa. Ya está agregado.

## Sobre el otro bloque de texto rojo (el de las cookies)
Ese es distinto y ya lo habíamos resuelto: sigue apareciendo como *warning*
en la consola (texto informativo), pero ya NO tumba la página — fijate que
en tu log dice `[200] /` (la página cargó bien). Es ruido de consola, no un
error real; si te sigue incomodando visualmente puedo hacer que deje de
imprimirse, decime.

## Resumen de todo lo hecho hasta ahora
1. **Notificaciones** — tiempo real de verdad, ya no se desmontan al
   navegar (`transition:persist` + store compartido), y ahora sí funcionan
   en el render de servidor (fix de arriba).
2. **Chats** — ancho completo, textarea auto-expandible, auto-scroll
   inteligente con aviso de "nuevo mensaje", animación de entrada.
3. **Recaptcha** — se exige siempre, ya no se cuela con un token viejo al
   pedir un chat nuevo.
4. **Reservas recibidas** — muestra info completa del cliente (teléfono,
   CI/RUC, profesión, cantidad de personas) al final de cada tarjeta.
5. **Geolocalización** — se pide sola al entrar, ya no depende de tocar el
   botón.
6. **Mapa del hero** — siempre encuadra todas las propiedades, corregido el
   conflicto de estilos con Tailwind que distorsionaba el mapa.
7. **Cookies de sesión** — ya no tumban la página si Supabase refresca el
   token después de que la respuesta se envió.

## Aparte (no lo toqué, solo aviso)
`src/pages/api/test.ts` pega a la API de OpenAI en un GET sin autenticación
— probablemente un resto de pruebas, valdría borrarlo antes de producción.
