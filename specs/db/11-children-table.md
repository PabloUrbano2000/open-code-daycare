# SPEC 11 — Tabla `children` en Supabase + lista real en `/kids`

> **State:** Implementado
> **Depends on:** SPEC 07, SPEC 08, SPEC 10
> **Date:** 2026-08-13
> **Objective:** Crear la tabla `public.children` en Supabase (RLS on, policy SELECT scoped al daycare, trigger `updated_at`) con una semilla de 8 niños repartidos 3/3/2 en las salas Soles/Luna/Estrellas (reusando los nombres de `app/kids/data.ts`), y reemplazar la lista hardcodeada de `/kids` por una lectura real de la DB agrupada por sala.

## Scope

**Incluye:**
- Migración `create_children_table` aplicada con `supabase_apply_migration`: `public.children` con las 11 columnas de la referencia (`id` uuid PK default `gen_random_uuid()`; `room_id` uuid FK NOT NULL → `rooms`; `full_name` text NOT NULL; `birth_date` date NOT NULL; `enrolled_at` date NOT NULL; `medical_notes` text nullable; `allergy_tags` text[] NOT NULL default `'{}'`; `photo_consent` boolean NOT NULL default `true`; `status` `child_status` NOT NULL default `'active'`; `created_at`/`updated_at` timestamptz default `now()`), índice `children_room_id_idx` (best practice de FK), RLS on y trigger `children_set_updated_at` (BEFORE UPDATE) reutilizando `public.set_updated_at()` (creada en SPEC 08).
- Migración `add_children_daycare_select_policy`: policy RLS `SELECT` en `children` para `authenticated` con `using (room_id in (select id from public.rooms where daycare_id = (select daycare_id from public.users where id = auth.uid())))` — cada usuario ve solo los niños de los rooms de su daycare (sin IDOR, patrón de SPEC 10).
- Migración `seed_children`: 8 niños bajo Guardería Sala Soles (daycare `…-001`) repartidos 3/3/2 (Soles `…-101`: Mateo Fernández, Sofía Méndez, Benjamín Ruiz; Luna `…-102`: Valentina Soto, Tomás Díaz, Emma Castro; Estrellas `…-103`: Lucas Romero, Olivia Vega), con UUID fijos `a2b2c2d2-…-201/202/…/208`, fechas y alergias copiadas de `app/kids/data.ts`, y `on conflict (id) do nothing` (idempotente).
- Archivos locales `supabase/migrations/<version>_<name>.sql` replicando las 3 migraciones con los `<version>` de `supabase_list_migrations`.
- `app/kids/page.tsx`: reemplazar `kids` de `./data` por una lectura real de `children` vía `createClient(await cookies())` con join a `rooms`, agrupar por sala, mostrar secciones "SALA SOLES / SALA LUNA / SALA ESTRELLAS" con sus conteos, cards con iniciales, edad, badge de alergia (`peanut`→MANÍ, `lactose`→LACTOSA) y link a `/kids/<slug derivado de full_name>`.
- Verificación: estructura, RLS/policies, trigger, seed, `/kids` en la app (Playwright), regresión visual y advisors.

**No incluye:**
- Reemplazar `app/kids/[slug]/page.tsx` ni `components/new-post-dialog.tsx` por datos reales — siguen con `data.ts` hardcodeado (la semilla reusa los mismos nombres para que los links `/kids/<slug>` sigan resolviendo).
- `parent_children` ni el conteo "X padres vinculados" — se muestra "sin padres vinculados" (0 padres, `parent_children` es otro spec).
- Persistencia desde el diálogo "Agregar niño" (SPEC 10) — sigue sin insertar en `children`.
- Políticas RLS INSERT/UPDATE/DELETE.
- El buscador "Buscar niño…" funcional.
- CRUD de children desde la UI.

## Data model

```sql
-- create_children_table
create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms (id),
  full_name     text not null,
  birth_date    date not null,
  enrolled_at   date not null,
  medical_notes text,
  allergy_tags  text[] not null default '{}',
  photo_consent boolean not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index children_room_id_idx on public.children (room_id);

alter table public.children enable row level security;

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();
```

```sql
-- add_children_daycare_select_policy
create policy "children_daycare_select"
  on public.children
  for select
  to authenticated
  using (
    room_id in (
      select id from public.rooms
      where daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );
```

```sql
-- seed_children
insert into public.children (id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status) values
  ('a2b2c2d2-0000-0000-0000-000000000201', 'a2b2c2d2-0000-0000-0000-000000000101', 'Mateo Fernández',  '2022-03-12', '2025-02-01', 'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.', '{peanut}',  true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000202', 'a2b2c2d2-0000-0000-0000-000000000101', 'Sofía Méndez',    '2024-11-04', '2025-03-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000203', 'a2b2c2d2-0000-0000-0000-000000000101', 'Benjamín Ruiz',   '2023-07-18', '2024-09-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000204', 'a2b2c2d2-0000-0000-0000-000000000102', 'Valentina Soto',  '2024-02-22', '2024-08-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000205', 'a2b2c2d2-0000-0000-0000-000000000102', 'Tomás Díaz',      '2022-09-09', '2024-03-01', 'Intolerancia a la lactosa. Evitar lácteos en desayuno y merienda.', '{lactose}', true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000206', 'a2b2c2d2-0000-0000-0000-000000000102', 'Emma Castro',     '2024-06-30', '2025-01-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000207', 'a2b2c2d2-0000-0000-0000-000000000103', 'Lucas Romero',    '2023-01-05', '2024-05-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000208', 'a2b2c2d2-0000-0000-0000-000000000103', 'Olivia Vega',     '2023-12-14', '2024-03-01', null, '{}',              true, 'active')
on conflict (id) do nothing;
```

```ts
// app/kids/page.tsx (cambios) — esqueleto conceptual
// children con join a rooms, agrupado por sala:
const { data: children } = await supabase
  .from("children")
  .select("id, full_name, birth_date, allergy_tags, rooms(name)")
  .order("rooms(name)")
  .order("full_name");
// slug derivado de full_name (lowercase, sin acentos, espacios → "-").
// badge: allergy_tags incluye "peanut" → MANÍ; "lactose" → LACTOSA.
```

Convenciones:
- `gen_random_uuid()` core en Postgres 15+; UUID fijos propios de children (`…-201`–`…-208`) que no chocan con daycares (`…-001`–`…-004`), staff (`…-011`) ni rooms (`…-101`–`…-103`), con `on conflict (id) do nothing` → idempotente.
- `allergy_tags` en inglés (`peanut`, `lactose`); la UI traduce a MANÍ/LACTOSA (patrón de la referencia).
- La semilla reusa los nombres/fechas/alergias de `app/kids/data.ts` para que `/kids/[slug]` (que sigue hardcodeado) resuelva con los mismos slugs; no se toca `data.ts`.
- La policy `children_daycare_select` permite a la app (que respeta RLS) leer los niños del daycare del usuario logueado; `/kids` está protegida por SPEC 09.
- Se reutiliza `public.set_updated_at()` (SPEC 08) para el trigger de `updated_at`.

## Implementation plan

1. **Aplicar migración** `create_children_table` con `supabase_apply_migration` (CREATE TABLE + índice + RLS on + trigger). Estado funcional: la tabla existe en `public` con RLS on.
2. **Aplicar migración** `add_children_daycare_select_policy` con `supabase_apply_migration`. Estado funcional: `authenticated` puede leer los niños de su daycare.
3. **Aplicar migración** `seed_children` con `supabase_apply_migration`. Estado funcional: `children` tiene 8 filas repartidas 3/3/2.
4. **Replicar en archivos locales** — crear `supabase/migrations/<version>_create_children_table.sql`, `<version>_add_children_daycare_select_policy.sql` y `<version>_seed_children.sql` con el mismo SQL/version que el remoto (versiones de `supabase_list_migrations`).
5. **UI — `app/kids/page.tsx`** — reemplazar `kids` de `./data` por la lectura real de `children` (join a `rooms`, order por sala y nombre), agrupar por sala y renderizar secciones por sala con conteos; cards con iniciales, edad, badge de alergia y link a `/kids/<slug>` derivado de `full_name`. Mantener `KidCard` en el mismo archivo o extraer un helper. Estado funcional: `/kids` muestra los 8 niños agrupados por sala.
6. **Verificación** — `supabase_list_migrations`, `supabase_list_tables` (verbose), `relrowsecurity`/`pg_policies`, distribución del seed vía SQL, re-ejecución idempotente, `npx tsc --noEmit`, `npm run lint`, `supabase_get_advisors(security)`, y Playwright (login + `/kids` con las 3 secciones + regresión de `/kids/[slug]` y new-post-dialog).

## Acceptance criteria

- [x] `supabase_list_migrations` incluye `create_children_table`, `add_children_daycare_select_policy` y `seed_children`.
- [x] `supabase_list_tables(public, verbose)` muestra `children` con PK `id`, FK `room_id → rooms(id)` NOT NULL, índice `children_room_id_idx` y las 11 columnas de la referencia.
- [x] `relrowsecurity` de `children` es `true`.
- [x] `pg_policies` tiene exactamente 1 policy SELECT en `children` para `authenticated` con `using (room_id in (select id from public.rooms where daycare_id = (select daycare_id from public.users where id = auth.uid())))`.
- [x] Existe el trigger `children_set_updated_at` que usa `public.set_updated_at()`.
- [x] `children` tiene exactamente 8 filas, todas con `status='active'` y `photo_consent=true`; la distribución por sala es Soles 3, Luna 3, Estrellas 2.
- [x] Mateo Fernández tiene `allergy_tags` `{peanut}` y Tomás Díaz `{lactose}`; el resto `{}`.
- [x] Re-ejecutar `seed_children` con los mismos UUIDs no duplica filas (`on conflict (id) do nothing`).
- [x] Con la sesión de `pablo@google.com` (staff, daycare Sala Soles), `/kids` muestra las secciones SALA SOLES (3), SALA LUNA (3) y SALA ESTRELLAS (2), cada card con iniciales, edad, badge de alergia cuando aplica y link a `/kids/<slug>`.
- [x] Los links de los cards de `/kids` resuelven a `/kids/[slug]` sin 404 (los slugs generados coinciden con los de `data.ts`).
- [x] Existen los 3 archivos en `supabase/migrations/` con el mismo SQL/version que el remoto; no hay `config.toml`.
- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [x] `supabase_get_advisors(security)` no reporta a `children` sin RLS ni hallazgos nuevos.
- [x] No se tocó `app/kids/data.ts`, `app/kids/[slug]/page.tsx`, `components/new-post-dialog.tsx`, el doc `07-DB-schema` ni migraciones ya aplicadas.

## Decisions taken and discarded

**Adoptadas:**
- Tabla `children` con las 11 columnas de la referencia, incluido `updated_at` (la tabla 4 del diccionario la incluye), con trigger reutilizando `public.set_updated_at()` de SPEC 08.
- RLS on con 1 policy SELECT scoped al daycare (vía `room_id` → `rooms.daycare_id`) — patrón idéntico a `rooms_daycare_select` de SPEC 10; la app lee los niños vía RLS.
- Seed de 8 niños reusando los nombres/fechas/alergias de `app/kids/data.ts`, repartidos 3/3/2 — el usuario lo pidió explícito para que `/kids/[slug]` (hardcodeado) siga resolviendo; los otros niños de otras guarderías no se siembran.
- `/kids` lee de la DB pero `[slug]` y `new-post-dialog` siguen hardcodeados — decisión del usuario ("solo la lista /kids").
- "0 padres vinculados" — `parent_children` no existe; se muestra `parentsLabel(0)`.
- Badge de alergia derivado de `allergy_tags` (`peanut`→MANÍ, `lactose`→LACTOSA); el badge "VINCULAR" de Valentina desaparece (depende de `parent_children`).
- UUID fijos `…-201`–`…-208` + `on conflict (id) do nothing` — idempotente (patrón SPEC 07/08/10).
- Índice `children_room_id_idx` — best practice de FK.

**Descartadas:**
- Reemplazar `/kids/[slug]` y `new-post-dialog` por datos reales — merece un spec cuando exista `parent_children` y el ruteo por id.
- Sembrar `parent_children` — se sale del alcance "agregar children".
- Rutear por `[id]` — el usuario eligió generar slug desde `full_name`.
- 0 policies en `children` — incompatible con leer niños desde la app (default deny).
- Policy `using (true)` — más simple pero sin scoping por daycare.
- CRUD de children desde la UI / persistencia del diálogo "Agregar niño" — otro spec.
- Buscador funcional en `/kids` — la UI ya tiene el input visual; filtrar se deja para después.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| Los slugs generados desde `full_name` no coinciden con los de `data.ts` → links a `[slug]` en 404 | Helper de slugify que reproduce `mateo-fernandez`, `sofia-mendez`, etc. (lowercase, sin acentos, espacios → "-"); se verifica en Playwright navegando a un perfil. |
| La app no ve los niños por default deny o policy mal scoped | Policy `children_daycare_select` en la misma tanda; se verifica con la sesión de `pablo@google.com`. |
| El select de `/kids` no trae el join `rooms(name)` correctamente | Se verifica con `tsc` y Playwright (las 3 secciones muestran nombres de sala). |
| La semilla duplica filas al re-aplicarse | UUID fijos + `on conflict (id) do nothing`. |
| Quitar `kids` de `./data` rompe `[slug]`/new-post-dialog | No se toca `data.ts`; `app/kids/page.tsx` deja de importarlo pero los otros dos archivos lo siguen usando. |

## What is **not** in this spec

- `/kids/[slug]` y `new-post-dialog` con datos reales (siguen hardcodeados).
- `parent_children` y el conteo de padres vinculados.
- Persistencia de niños desde el diálogo "Agregar niño" (SPEC 10).
- Políticas RLS INSERT/UPDATE/DELETE.
- Buscador funcional ni CRUD de children desde la UI.

Cada uno de esos, si llega, va en su propio spec.