# SPEC 02 — Niños: lista `/kids` y perfil `/kids/[slug]`

**State:** Implementado
**Depends on:** SPEC 01
**Date:** 2026-08-11
**Objective:** Replicar visualmente las pantallas `ninos.dc.html` (`/kids`) y `perfil-nino.dc.html` (`/kids/[slug]`) reutilizando el scaffold de SPEC 01, con un array estático compartido `Kid[]` y navegación real lista→perfil.

## Scope

**Incluye:**
- `components/sidebar.tsx` y `components/mobile-header.tsx`: reciben prop `activeItem` (por defecto `"feed"`), de modo que la home queda intacta y `/kids` activa "Niños".
- `app/kids/data.ts` (nuevo): tipo `Kid` y array `kids` con los 8 niños de la plantilla. Mateo usa los datos exactos de `perfil-nino.dc.html`; los otros 7 llevan datos coherentes inventados (fecha de nacimiento acorde a la edad, ingreso, alergias según badge, padres con nombre/rol/estado según el contador de cada niño).
- `app/kids/page.tsx` (nuevo): lista `/kids` con header "GESTIÓN · Niños", botón "Agregar niño" (`#` muerto), búsqueda estática "Buscar niño…", divisor "SALA SOLES · 8 niños" (count derivado de `kids.length`) y grilla de tarjetas. Tarjetas: avatar (inicial + color exacto de la plantilla), nombre, "X años · Y padres vinculados" (derivado), badge (MANÍ/LACTOSA/VINCULAR) o chevron según la plantilla, y hover con elevación. Cada tarjeta linkea a `/kids/[slug]` (real).
- `app/kids/[slug]/page.tsx` (nuevo): perfil con "Volver a Niños" (real → `/kids`), avatar grande, nombre + "X años · Sala Soles", botón "Editar" (`#`), caja roja de alergias **solo si el kid tiene alergia**, tarjeta de datos (Fecha de nacimiento / Sala / Ingreso), botón "Resumen del día" (`#`), tarjeta "PADRES VINCULADOS" (padres con badge ACTIVA/PENDIENTE, y fila "Vincular otro padre" `#`; Valentina sin padres muestra solo esa fila). `notFound()` si el slug no existe; `generateStaticParams` pre-renderiza los 8 slugs.
- `app/page.tsx`: sin cambios funcionales (usa el default `activeItem="feed"`).
- Navegación: "Feed" → `/` y "Niños" → `/kids` reales; "Avisos"/"Mi cuenta"/logout siguen `#`.
- Responsive igual que SPEC 01 (sidebar ≥1024px / header hamburguesa <1024px); grilla `grid-cols-1 md:grid-cols-2`; perfil en una columna en móvil (el diseño ya usa `flex-wrap`).

**No incluye:**
- Agregar niño, editar perfil, vincular padre ni resumen del día (links `#` muertos).
- Búsqueda funcional (el input no filtra).
- Persistencia, autenticación, datos desde backend.
- Otras salas o secciones fuera de "SALA SOLES".
- Cambios al contenido del feed de SPEC 01.

## Data model

```ts
// app/kids/data.ts
export interface Parent {
  name: string;
  relation: string; // "Mamá" | "Papá"
  status: "active" | "pending";
  initials: string;
  avatarBg: string; // hex
}

export interface Kid {
  slug: string; // "mateo-fernandez"
  name: string; // "Mateo Fernández"
  initials: string; // "M"
  avatarBg: string; // hex del círculo
  avatarColor: string; // hex del texto
  age: number;
  badge?: { label: string; bg: string; color: string }; // MANÍ | LACTOSA | VINCULAR
  birthDate: string; // "12 mar 2022"
  enrollmentDate: string; // "feb 2025"
  room: string; // "Soles"
  allergies?: { title: string; note: string }; // caja roja; ausente = no se renderiza
  parents: Parent[]; // 0..2
}

export const kids: Kid[] = [ /* 8 entradas */ ];
```

Reglas de coherencia:
- Contador de la lista derivado de `parents.length`: `0` → "sin padres vinculados", `1` → "1 padre vinculado", `2` → "2 padres vinculados".
- Mateo: datos exactos de la plantilla (nacimiento 12 mar 2022, ingreso feb 2025, alergia al maní, Lucía ACTIVA + Diego PENDIENTE, badge MANÍ).
- Tomás (LACTOSA) lleva caja de alergia por lactosa; los que no tienen badge de alergia no muestran la caja roja.
- Valentina (VINCULAR) tiene `parents: []`.

## Implementation plan

1. **`components/sidebar.tsx` + `components/mobile-header.tsx`** — añadir prop `activeItem: "feed" | "kids" | "avisos" | "cuenta"` con default `"feed"`; marcar activo según la prop; "Feed" → `/` y "Niños" → `/kids` (el resto `#`). Estado funcional: home sigue igual (default).
2. **`app/kids/data.ts`** — tipo `Kid`/`Parent` y array `kids` (8 entradas con las reglas de coherencia del data model).
3. **`app/kids/page.tsx`** — metadata "Niños · OpenDayCare"; layout `MobileHeader + Sidebar` con `activeItem="kids"`; header, búsqueda estática, divisor y grilla de tarjetas linkeando a `/kids/[slug]`.
4. **`app/kids/[slug]/page.tsx`** — `await params` (convención de rutas dinámicas de Next 16, verificar contra `node_modules/next/dist/docs/`); lookup en `kids`; `notFound()` si no existe; `generateStaticParams` con los 8 slugs; `generateMetadata` con el nombre del kid; render del perfil según el diseño.
5. **Verificación** — `npx tsc --noEmit`, `npm run lint`, y Playwright: `/kids` en desktop ≥1024px contra `references/screenshots/ninos.png` y en móvil ~390px (grilla 1 col + menú hamburguesa con "Niños" activo); `/kids/mateo-fernandez` estructural contra `perfil-nino.dc.html`; `/kids/inexistente` → 404; regresión visual de `/`.

## Acceptance criteria

- [x] `/kids` es visualmente idéntico a `ninos.dc.html` en desktop ≥1024px (paleta, tipografías, layout, espaciado).
- [x] Las 8 tarjetas usan el color de avatar, inicial, nombre, "X años · Y padres vinculados" y badge (MANÍ/LACTOSA/VINCULAR) o chevron exactos de la plantilla.
- [x] La grilla es `grid-cols-1` en móvil y 2 columnas desde `md`; las tarjetas tienen hover (borde + elevación).
- [x] El input "Buscar niño…" se renderiza estático y no filtra.
- [x] "Niños" aparece activo en el sidebar (≥1024px) y en el menú hamburguesa (<1024px), con la prop `activeItem`.
- [x] Las tarjetas linkean a `/kids/[slug]` reales; `/kids` carga con count "8 niños" derivado de `kids.length`.
- [x] `/kids/mateo-fernandez` reproduce `perfil-nino.dc.html` con sus datos exactos (12 mar 2022, feb 2025, alergia al maní, Lucía ACTIVA, Diego PENDIENTE).
- [x] Los 8 perfiles muestran datos coherentes con la lista: edad↔fecha de nacimiento, badge↔caja de alergias (solo si aplica), contador de padres↔lista PADRES VINCULADOS (Valentina solo "Vincular otro padre").
- [x] "Volver a Niños" navega a `/kids`; "Editar", "Resumen del día" y "Vincular otro padre" son `#`.
- [x] `/kids/slug-inexistente` renderiza la 404 (`notFound()`).
- [x] La home `/` no cambia visualmente (regresión) y sigue marcando "Feed" activo.
- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.

## Decisions taken and discarded

**Adoptadas:**
- Una sola spec para lista y perfil — comparten `Kid[]` y la lista necesita el destino real de sus tarjetas.
- `activeItem` como prop en sidebar/mobile-header — la home queda intacta por el default; sin duplicar componentes.
- `Kid[]` con perfil completo para los 8 — datos coherentes inventados para los 7 que el diseño no define; Mateo replica la plantilla exacta.
- Navegación real solo para rutas existentes: Feed → `/`, Niños → `/kids`, tarjetas → `/kids/[slug]`, "Volver a Niños" → `/kids`; todo lo demás queda `#`.
- `notFound()` para slugs inexistentes.
- `app/kids/data.ts` colocado junto a la ruta (vs `lib/`) — solo `/kids` lo consume hoy.
- `generateStaticParams` pre-renderiza los 8 perfiles (SSG estático como el resto del app).

**Descartadas:**
- Búsqueda funcional — pertenece a un spec con estado.
- Todos los links muertos (`#`) como en SPEC 01 — la integración lista↔perfil es el valor de esta spec.
- Réplica idéntica de Mateo en todos los slugs — rompe la coherencia del linking.
- Persistencia o backend — sigue siendo réplica estática.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| No existe `references/screenshots/perfil-nino.png` → el perfil solo se valida estructural contra el HTML, no pixel a pixel | Aceptado; criterios estructurales y de datos para `[slug]`; la lista sí se compara contra `ninos.png`. |
| Datos inventados para 7 niños pueden no coincidir con un futuro backend | Son mocks estáticos; el data model aísla los cambios a `app/kids/data.ts`. |
| API de rutas dinámicas distinta en Next 16 (params como Promise, generateStaticParams) | Verificar contra `node_modules/next/dist/docs/` antes de escribir `[slug]/page.tsx`. |
| Grilla 2-col en `md` (768px) puede quedar estrecha | Breakpoint en `md` igual que la plantilla desktop; se revisa en el screenshot de 1024px. |

## What is **not** in this spec

- Agregar niño, editar perfil, vincular padre, resumen del día (cada uno va en su propio spec).
- Búsqueda, persistencia y autenticación.
- Otras salas.

Cada uno de esos, si llega, va en su propio spec.
