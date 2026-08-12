# SPEC 01 — Home: réplica visual del feed

**State:** Implementado
**Depends on:** — (ninguna)
**Date:** 2026-08-11
**Objective:** Replicar la pantalla `references/pantallas/feed.dc.html` como home `/` del proyecto, con estilo visualmente idéntico a la plantilla en escritorio y responsive en móvil, sin autenticación ni funcionalidad.

## Scope

**Incluye:**
- `app/page.tsx` como home `/` que renderiza la réplica del feed.
- `components/sidebar.tsx` (nuevo, compartido): logo OpenDayCare · Sala Soles, botón "Nueva publicación", nav (Feed activo / Niños / Avisos / Mi cuenta), perfil de Caro Giménez con logout.
- Layout y tema: fuentes Fredoka + Nunito vía `next/font/google`, `lang="es"`, metadata en español, tokens de color y estilos base (fondos `#F6ECDF`/`#FFFDF9`, bordes `#ECE0D0`, texto `#3F362E`, scrollbar) en `app/globals.css`.
- Feed estático: header ("GUARDERÍA · SALA SOLES", "Buenas, Caro", "12 niños · martes 17 jun"), tarjeta compositora "Compartí un momento…", divisor "PUBLICADO HOY" y los 3 posts (logro, actividad con foto, anuncio) con el copy, badges, contadores y acciones exactos de la plantilla.
- Iconos con `lucide-react` (importados, sin SVG inline) replicando los de la plantilla.
- **Responsive:** sidebar de escritorio a ≥1024px; por debajo, header superior fijo con botón hamburguesa que abre/cierra el panel de navegación (4 ítems, Feed activo). El layout del feed (columna `max-w`) se adapta fluidamente con padding reducido en móvil.
- Todo el estilo con Tailwind v4 (clases utilitarias + tokens en `@theme inline`).

**No incluye:**
- Autenticación, login/logout lógico ni sesión.
- Navegación real: todos los links (nav, "Editar", placeholder de foto, logout) apuntan a `#` (muertos).
- Interacción en posts: likes, comentarios, contadores y "Editar" son estáticos, sin estado. La única interacción permitida es abrir/cerrar el menú hamburguesa.
- Modelo de datos ni persistencia.
- Crear/editar publicaciones.
- Tablas/tablets con layout intermedio: solo dos estados (sidebar ≥1024px / hamburguesa <1024px).

## Data model

No se introducen estructuras de datos nuevas. El contenido es JSX estático; solo hay un `useState` local para el toggle del menú hamburguesa.

## Implementation plan

1. **`app/layout.tsx`** — quitar Geist; importar `Fredoka` (400;500;600;700) y `Nunito` (400;500;600;700;800) con `next/font/google`; `lang="es"`; metadata en español (title "OpenDayCare").
2. **`app/globals.css`** — tokens en `@theme inline` con la paleta de la plantilla; base: `font-family: Nunito`, fondo `#F6ECDF`, texto `#3F362E`, `box-sizing`; scrollbar estilo plantilla; eliminar el bloque de dark-mode del boilerplate.
3. **`components/sidebar.tsx`** — sidebar de escritorio (presentacional, `hidden lg:flex`, ancho 248px) con links `href="#"`.
4. **`components/mobile-header.tsx`** (nuevo) — header fijo `lg:hidden` con botón hamburguesa (toggle con `useState`), logo y botón "Nueva publicación"; panel desplegable con los 4 ítems de nav.
5. **`app/page.tsx`** — layout `min-h-screen flex bg-[#F6ECDF]`: `<MobileHeader />` (solo móvil) + `<Sidebar />` (solo desktop) + `<main>` scrollable de columna `max-w-[760px] px` responsivo: header, tarjeta compositora, divisor y los 3 posts estáticos.
6. **Verificación** — `npx tsc --noEmit`, `npm run lint`, y comparación visual con Playwright en dos viewports: desktop ≥1024px contra `references/screenshots/feed.png`, y móvil (~390px) validando header + menú hamburguesa.

## Acceptance criteria

- [x] `/` renderiza el feed idéntico a `feed.dc.html` (tipografías, paleta, layout, espaciado) en viewport desktop ≥1024px.
- [x] Fredoka y Nunito se cargan vía `next/font`; no hay `<link>` a Google Fonts.
- [x] El sidebar de escritorio sale de `components/sidebar.tsx` con logo, botón "Nueva publicación", 4 ítems de nav (Feed activo) y perfil + logout de Caro; es visible solo a ≥1024px.
- [x] A <1024px el sidebar no se muestra; aparece el header móvil con hamburguesa que abre/cierra el panel con los 4 ítems (Feed activo) y el feed se adapta con padding móvil.
- [x] Todos los links (nav, logout, "Editar", placeholder de foto, tarjeta compositora) son `href="#"` y no navegan.
- [x] Los 3 posts se renderizan con el copy español exacto, badges (LOGRO/ACTIVIDAD/ANUNCIO), contadores (3/1, 5/2, 8/0) y acciones del footer.
- [x] La única interacción es el toggle del menú hamburguesa (`useState` local); los contadores/botones de posts no responden.
- [x] `lang="es"`, metadata en español, title "OpenDayCare".
- [x] Sin autenticación: sin página de login, sin middleware, sin sesión ni localStorage.
- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.

## Decisions taken and discarded

**Adoptadas:**
- Réplica estática exacta en vez de array de datos — el objetivo es fidelidad visual; la funcionalidad llega en specs futuros.
- Sidebar como componente compartido — los specs de Niños/Avisos/Mi cuenta lo reutilizarán.
- Links muertos `href="#"` — las otras pantallas quedan fuera de alcance.
- `next/font/google` en vez de `<link>` externo — self-hosted y optimizado por Next.
- **Responsive obligatorio**: la plantilla es solo desktop, pero la home debe verse bien en móvil. Patrón elegido por el usuario: hamburguesa.
- **Breakpoint único a 1024px** — sidebar ≥1024px, modo móvil <1024px; sin estado intermedio de tablet.
- Header móvil con botón "Nueva publicación" siempre visible; el perfil de Caro se oculta en móvil.
- Clases de Tailwind v4 (con tokens) en vez de estilos inline crudos.
- Iconos con `lucide-react` en vez de SVG inline copiados — decisión del usuario durante la implementación (Step 3).

**Descartadas:**
- Array `Post[]` — complejidad innecesaria ahora.
- Rutas placeholder vacías — fuera de alcance.
- Likes/comentarios interactivos — pertenecen a un spec funcional.
- Barra de navegación inferior (bottom nav) y FAB — el usuario prefirió hamburguesa.

## Identified risks

- La plantilla no define layout móvil: el header/menú hamburguesa es una propuesta sin referencia visual (se valida solo en criterios estructurales).
- Diferencias de render de fuentes entre `next/font` y el CDN de Google (menor).
- Deriva visual al traducir estilos inline a Tailwind — mitigado con comparación pixel a `feed.png`.
- Tailwind v4 requiere valores arbitrarios para muchos hex — se tokeniza la paleta en `@theme` para mantener clases legibles.
