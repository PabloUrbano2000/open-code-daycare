## Context

Ver proposal.md — Why. Estado actual: app de un solo panel staff; RLS de lectura daycare-wide; sin usuarios padre; rutas `/`, `/kids`, `/kids/[slug]`. El mockup define `familia-feed` y `familia-cuenta`. Los specs de este change definen el comportamiento requerido (ver `specs/`).

## Goals / Non-Goals

**Goals:**
- Separar físicamente el panel staff (`/staff*`) del panel familia (`/family`) con guardas por rol en el middleware.
- Que la RLS sea la fuente de verdad de la separación de datos entre niños (sin fugas entre padres).
- Feed de familia funcional con selector de hijo, basado en los mockups.
- Sembrar un padre de prueba reproducible (Lucía, madre de Mateo y Sofía).

**Non-Goals:**
- "Mi cuenta" del panel familia (placeholders `#`, fuera de alcance; los mockups `familia-cuenta` quedan para un change futuro).
- "Avisos" del staff (sigue `href="#"`).
- Editar/borrar posts, comentarios, reacciones.
- Extender el flujo de invitación para vincular varios hijos (el seed usa insert directo).

## Decisions

- **Rutas `/staff` + `/family` con `/` resolviendo por rol** (decisión del usuario). Alternativa descartada: mismo `/` con render condicional por rol (mezclaba ambos paneles y URLs).
- **RLS por rol como fuente de verdad** (recomendación aceptada). Alternativa descartada: filtrar solo en el query de la app — un cliente (o una query futura) podría pedir todo y la fuga entre niños quedaría en la RLS.
- **Rol autoritativo en la tabla `users`; el middleware consulta la DB**, no `claims.user_metadata`. El checklist de seguridad de Supabase prohíbe usar `user_metadata` del JWT para decisiones de autorización (es editable por el usuario). Costo: un query ligero `users.role` por request en `proxy.ts`.
- **Seed por insert directo** en `auth.users` + `auth.identities` + filas en `parent_children` (patrón `seed_staff_user`). La invitación descartada porque solo vincula 1 hijo por activación y crea un usuario nuevo por `/activate`.
- **`post_photos` (tabla y bucket) delegan su visibilidad a `posts`** vía `exists (select 1 from posts p where p.id = …)` — una sola definición de visibilidad (DRY). SPEC 13 ya chocó con recursión infinita (42P17) al duplicar lógica; este diseño no introduce ciclos (posts nunca referencia post_photos/storage).
- **Helpers `is_staff()`/`is_parent()` `SECURITY INVOKER`** reutilizando `users_self_select`; sin `SECURITY DEFINER`.
- **Chips del selector de hijo en cliente** (`useState`/`searchParams` no compartible). La RLS ya acota los posts; el chip solo filtra visualmente el conjunto ya visible.
- **Feed de familia en un builder propio** (`getFamilyFeed()` o variante) en lugar de ramificar `getFeed()` — el contrato de la card difiere (autor vs "publicado por vos", sin Editar) y el staff no debe tocar su ruta.
- **Policies de INSERT (staff) intactas** — el change solo reemplaza las SELECT de lectura.

## Risks / Trade-offs

- [Recursión infinita (42P17) al encadenar RLS] → Diseño sin ciclos: la visibilidad vive solo en `posts`; verificación con consultas reales por claims en la implementación.
- [Middleware con query a `users` agrega latencia por request] → Query mínima y solo en rutas protegidas; aceptable vs. usar claims inseguros.
- [Mover `/kids` → `/staff/kids` rompe links existentes] → Se actualizan `sidebar`, `mobile-header` y la página de kids; regresión cubierta por el spec de navegación.
- [Seed en `auth.users` depende del trigger `handle_new_user`] → Patrón ya probado en `seed_staff_user`; `on conflict do nothing`.
- [Storage: subquery a `post_photos`/`posts` por objeto] → Pocos objetos por daycare; firma por id.

## Migration Plan

1. Aplicar migraciones en orden: `add_role_helper_functions` → `add_role_based_select_policies` → `tighten_post_photos_storage_select` → `seed_family_parent`; replicar cada una en `supabase/migrations/<version>_*.sql`.
2. Verificar RLS con consultas readonly por claims (staff vs padre) antes de tocar la UI.
3. Refactor de rutas a `/staff*` + creación de `/family`, luego guardas en `proxy.ts`.
4. Rollback: reversa de migraciones no es estándar en este repo (no se reescriben migraciones aplicadas); el riesgo se mitiga verificando antes de aplicar. La UI se revierte con git.

## Open Questions

Ninguna que cambie specs/approach. El estado "Mi cuenta" de familia y "Avisos" son placeholders acordados para otro change.