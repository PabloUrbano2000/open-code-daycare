# SPEC 03 — Login `/login` y activación de cuenta `/activate`

**State:** Implementado
**Depends on:** SPEC 01
**Date:** 2026-08-12
**Objective:** Replicar visualmente las pantallas `login.dc.html` (`/login`) y `activar-cuenta.dc.html` (`/activate`) como maquetas estáticas standalone, sin sidebar, sin interacción y sin funcionalidad.

## Scope

**Incluye:**
- `app/globals.css`: nuevos tokens de color para la paleta de autenticación (`--color-auth-bg` `#FBF4EC`, `--color-auth-line` `#EADFD0`, `--color-auth-placeholder` `#B6A99B`, `--color-auth-warn` `#FBF1D6`, `--color-auth-warn-ink` `#8A7234`, `--color-auth-green` `#5FB97E`, `--color-auth-code` `#F2A78E`). Reutiliza `ink`, `ink-muted`, `coral-darker`, `sky`/`sky-deep` y `font-display` existentes; gradientes del panel hero y del CTA en valores arbitrarios de Tailwind (patrón ya usado en `sidebar.tsx`).
- `app/login/page.tsx` (nuevo): pantalla standalone (sin `Sidebar` ni `MobileHeader`), `min-h-screen` en dos columnas a ≥1024px (`lg:grid-cols-[1.05fr_1fr]`) sobre `bg-auth-bg`. Columna izquierda: panel hero con gradiente `linear-gradient(155deg,#F6A98E,#F2937A 45%,#EC7E62)`, círculos decorativos translúcidos, logo OpenDayCare, título "El día de cada niño, compartido con su familia.", subtítulo y footer "🌿 Guardería Sala Soles"; **oculto a <1024px** (`hidden lg:flex`). Columna derecha: formulario `max-w-[392px]` centrado con "Iniciar sesión", "Ingresá para ver el día de hoy.", segmento "INGRESO COMO" con los dos botones **Personal activo** (bg `#FBE3D8`, borde `#F2937A`, texto `#D9583C`) y Familia inactivo — estado estático fijo, sin toggle —, inputs EMAIL (value `caro@opendaycare.com`) y CONTRASEÑA (placeholder `••••••••`), "¿Olvidaste tu contraseña?" (`#`), CTA "Iniciar sesión" con gradiente `linear-gradient(180deg,#F4977E,#EE8164)` (`#`) y "¿Te invitó la guardería? **Activá tu cuenta**" (`/activate` real).
- `app/activate/page.tsx` (nuevo): pantalla standalone centrada, `min-h-screen flex items-center justify-center` sobre `bg-auth-bg`, columna `max-w-[440px]`: logo 58px con gradiente, "Bienvenida a OpenDayCare", texto de invitación, tarjeta de invitación (avatar "M" bg `#A9D9E8`/texto `#1F7A93`, "Te invitaron a seguir a / **Mateo · Sala Soles**"), inputs CÓDIGO DE INVITACIÓN (value `7K4P9`, `font-display`, letter-spacing), EMAIL (value `lucia.fernandez@gmail.com`), CREAR CONTRASEÑA (value `contraseña`, borde `#F2A78E`), label de autorización con checkbox verde estático (`bg-auth-warn` + check SVG blanco sobre `bg-auth-green`), CTA "Activar mi cuenta" gradiente (`#`) y "¿Ya tenés cuenta? **Iniciar sesión**" (`/login` real).
- Metadata de ambas páginas en español ("Iniciar sesión · OpenDayCare", "Activar cuenta · OpenDayCare").
- **Responsive:** activar-cuenta es columna centrada única (naturalmente responsivo, solo padding móvil). Login oculta el panel hero a <1024px y deja el formulario centrado.
- Inputs con `defaultValue`/`placeholder` estáticos (no controlados, sin `useState`).

**No incluye:**
- Navegación real fuera de las dos pantallas: "Iniciar sesión", "Activar mi cuenta" y "¿Olvidaste tu contraseña?" quedan en `#`.
- Toggle Personal/Familia funcional — se renderiza Personal activo con email `caro@opendaycare.com`, fijo.
- Autenticación, sesión, middleware, validación de formularios ni envíos (no hay `<form action>`).
- Persistencia ni datos desde backend.
- Cambios a la home `/`, `/kids` ni a `components/sidebar.tsx`/`mobile-header.tsx`.

## Data model

No se introducen estructuras de datos nuevas. Ambas pantallas son JSX estático (inputs no controlados con `defaultValue`); el único cambio al sistema es el set de tokens de color en `app/globals.css`.

## Implementation plan

1. **`app/globals.css`** — añadir los 7 tokens `auth-*` al bloque `@theme inline`.
2. **`app/login/page.tsx`** — metadata + layout standalone: grid `lg:grid-cols-[1.05fr_1fr]`, panel hero `hidden lg:flex`, formulario estático según el diseño (Personal activo, values exactos de la plantilla, links `#` y "Activá tu cuenta" → `/activate`).
3. **`app/activate/page.tsx`** — metadata + columna centrada estática: tarjeta de invitación, 3 inputs con values de la plantilla, consentimiento con check, CTA `#` y "Iniciar sesión" → `/login`.
4. **Verificación** — `npx tsc --noEmit`, `npm run lint`, y Playwright: `/login` desktop ≥1024px (2 columnas + panel hero) y móvil ~390px (solo formulario); `/activate` desktop y móvil (columna centrada); regresión de `/`.

## Acceptance criteria

- [x] `/login` es visualmente idéntico a `login.dc.html` en desktop ≥1024px (grid 2 col, panel hero gradiente, formulario, paleta y tipografías).
- [x] A <1024px el panel hero no se muestra y el formulario queda centrado sobre `bg-auth-bg`.
- [x] En `/login` el botón "Personal" aparece activo (bg/borde/texto del estado seleccionado) y "Familia" inactivo; ninguno responde al click (sin `useState`).
- [x] Inputs de `/login`: EMAIL con value `caro@opendaycare.com` y CONTRASEÑA con placeholder `••••••••`.
- [x] "Activá tu cuenta" navega a `/activate`; "Iniciar sesión" y "¿Olvidaste tu contraseña?" son `#`.
- [x] `/activate` replica `activar-cuenta.dc.html` (logo, tarjeta "Mateo · Sala Soles", inputs CÓDIGO `7K4P9` / EMAIL `lucia.fernandez@gmail.com` / CONTRASEÑA `contraseña`, label de consentimiento con check verde).
- [x] "Iniciar sesión" en `/activate` navega a `/login`; "Activar mi cuenta" es `#`.
- [x] `/login` y `/activate` no muestran sidebar ni mobile-header (standalone).
- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [x] La home `/` no cambia visualmente (regresión).

## Decisions taken and discarded

**Adoptadas:**
- Rutas en inglés `/login` y `/activate` — decisión explícita del usuario ("siempre inglés"); el copy de UI sigue en español según los mockups.
- Toggle estático (Personal activo) — el usuario eligió maqueta sin interacción; no hay `useState`.
- Enlaces cruzados reales (login ↔ activate) — patrón de SPEC 02: navegación real solo entre rutas existentes; CTAs primarios muertos.
- Panel hero oculto a <1024px — patrón del sidebar (≥1024px desktop); el formulario se centra en móvil.
- Tokens nuevos `auth-*` en `globals.css` — paleta distinta al resto de la app (`#FBF4EC`/`#EADFD0` vs `#F6ECDF`/`#ECE0D0`); se tokeniza para clases legibles, como las specs previas.
- Dos páginas standalone sin layout compartido — son pantallas pre-login; crear un layout compartido ahora sería prematuro.

**Descartadas:**
- Toggle funcional Personal/Familia — pertenece a un spec con estado (autenticación).
- Rutas en español (`/activar-cuenta`) — el usuario pidió nombres en inglés.
- `<form>` con submit/validación — maqueta estática.
- Layout compartido de auth — solo hay dos pantallas.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| No existen `references/screenshots/login.png` ni `activar-cuenta.png` → validación solo estructural contra los `.dc.html` | Aceptado; criterios estructurales y de datos (values, colores, layout) contra cada plantilla. |
| Los inputs de la plantilla muestran `value` literales (p. ej. contraseña "contraseña") que en una app real serían datos sensibles | Son mockups sin backend ni envío; los values replican la plantilla tal cual. |
| Móvil del login sin referencia visual (la plantilla es solo desktop) | Se valida con criterio estructural: panel oculto, formulario centrado, mismo patrón del sidebar. |

## What is **not** in this spec

- Toggle Personal/Familia funcional, "¿Olvidaste tu contraseña?", submit de login ni activación real.
- Autenticación, sesión y rutas protegidas.
- Pantalla "familia-feed" ni ruta `/` con rol padre.
- Layout compartido de auth.

Cada uno de esos, si llega, va en su propio spec.
