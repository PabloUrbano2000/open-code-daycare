## Why

Hoy la app es un único panel orientado al staff: un padre que inicia sesión aterriza en el mismo feed que la maestra (con botón de publicar, gestión de niños y acceso de lectura a todos los posts/fotos del daycare). La RLS de `posts`/`children`/`post_children`/`post_photos`/storage es daycare-wide, así que un padre podría ver contenido de otros niños. El mockup ya define un panel de familia separado (`familia-feed`, `familia-cuenta`), pero no está implementado ni existe ningún usuario padre.

## What Changes

- **Rutas separadas por rol**: el panel staff se mueve a `/staff` (`/staff`, `/staff/kids`, `/staff/kids/[slug]`); se crea `/family` para el panel de familia. `/` pasa a resolver por rol (staff→`/staff`, parent→`/family`, anón→`/login`). **BREAKING**: `/`, `/kids` y `/kids/[slug]` dejan de existir como tales.
- **RLS por rol en Supabase**: policies SELECT por rol en `posts`, `post_children`, `post_photos`, `children` y el bucket `post-photos` (staff ve todo su daycare; el padre solo posts de sus hijos + anuncios de su sala). Nueva policy `parent_children_parent_select`.
- **Seed del padre**: usuario `lucia.fernandez@gmail.com` (Lucía Fernández), madre de Mateo y Sofía, con sus vínculos en `parent_children`.
- **Feed de familia** (`/family`): saludo dinámico, chips de selector de hijo (Mateo · Sofía · Todos), cards de post con autor ("Maestra … · Sala …") y sin acciones de edición ni botón de publicar.
- **Middleware/proxy por rol**: `/staff*` exige sesión + staff; `/family` exige sesión + parent; redirects cruzados.
- **Navegación de familia**: solo "Feed" y "Mi cuenta" (placeholder). "Mi cuenta" del panel familia queda fuera de este cambio.

## Capabilities

### New Capabilities
- `data-access/rls-by-role`: RLS de lectura por rol en las tablas del feed y el bucket de fotos, helpers de rol y seed del padre.
- `navigation/staff-family-routes`: separación de rutas `/staff` vs `/family`, redirects por rol en middleware y post-login, navegación (sidebar/mobile header) por rol.
- `family/feed`: pantalla `/family` con chips de selector de hijo y feed de posts de los hijos + anuncios de la sala.

### Modified Capabilities
<!-- No hay capabilities previas en openspec/specs/ (directorio vacío): todo es nuevo. -->

## Impact

- **DB (Supabase)**: migraciones nuevas (`add_role_helper_functions`, `add_role_based_select_policies`, `tighten_post_photos_storage_select`, `seed_family_parent`) + réplica en `supabase/migrations/`. No se tocan migraciones ya aplicadas ni el doc `07-DB-schema`.
- **Rutas App Router**: `app/page.tsx`, `app/kids/page.tsx`, `app/kids/[slug]/page.tsx` se mueven a `app/staff/*`; nueva `app/family/page.tsx`. `proxy.ts`/`utils/supabase/middleware.ts` con guards por rol.
- **Código**: `components/sidebar.tsx`, `components/mobile-header.tsx`, `app/login/actions.ts`, `utils/feed.ts` (+ nuevo `utils/family-feed.ts` o similar).
- **Datos**: seed de 1 usuario padre + 2 vínculos en `parent_children` (credenciales de dev documentadas).
- **Dependencias**: ninguna nueva.