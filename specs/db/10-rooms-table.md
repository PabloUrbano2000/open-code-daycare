# SPEC 10 — Tabla `rooms` en Supabase + selector dinámico de sala

> **State:** Implementado
> **Depends on:** SPEC 07, SPEC 08
> **Date:** 2026-08-13
> **Objective:** Crear la tabla `public.rooms` en Supabase con 3 rooms bajo Guardería Sala Soles (Soles, Luna, Estrellas) y su policy RLS SELECT scoped al daycare del usuario, y reemplazar el `ROOMS = ["Soles"]` hardcodeado del selector de sala del diálogo "Agregar niño" por la lista real leída de la DB.

## Scope

**Incluye:**
- Migración `create_rooms_table` aplicada con `supabase_apply_migration`: `public.rooms` (`id` uuid PK default `gen_random_uuid()`; `daycare_id` uuid FK NOT NULL → `daycares`; `name` text NOT NULL; `created_at` timestamptz default `now()`), índice `rooms_daycare_id_idx` (best practice de FK) y RLS on.
- Migración `add_rooms_daycare_select_policy`: policy RLS `SELECT` en `rooms` para `authenticated` con `using (daycare_id = (select daycare_id from public.users where id = auth.uid()))` — cada usuario ve solo los rooms de su daycare (sin IDOR).
- Migración `seed_rooms`: 3 rooms bajo Guardería Sala Soles (id `a2b2c2d2-…-000000000001`): "Soles" (el existente), "Luna" y "Estrellas", con UUID fijos `a2b2c2d2-…-101/102/103` y `on conflict (id) do nothing` (idempotente).
- Archivos locales `supabase/migrations/<version>_<name>.sql` replicando las 3 migraciones con los `<version>` de `supabase_list_migrations`.
- `components/add-kid-dialog.tsx`: quitar `export const ROOMS = ["Soles"]`; `AddKidDialog` acepta prop `rooms: string[]` y mapea esas opciones en el `<select>` de "Sala".
- `app/kids/page.tsx` (server component): leer los rooms desde `rooms` vía `createClient(await cookies())` (respetando RLS) y pasarlos a `<AddKidDialog rooms={rooms} />`.
- Verificación: estructura, RLS/policies, seed, selector en la app (Playwright) y regresión visual del resto.

**No incluye:**
- Reemplazar los demás labels estáticos "Sala Soles" (sidebar, mobile-header, `/home`, `/kids`, `kids/[slug]`, new-post-dialog) — diseño de un solo room; va en un spec futuro.
- Persistencia de niños en `children` ni la relación `children.room_id` → `rooms`.
- CRUD de rooms desde la UI (crear/editar/eliminar).
- Policies RLS de otros recursos.
- Cambios en `daycares` ni en el doc de referencia `07-DB-schema`.

## Data model

```sql
-- create_rooms_table
create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name       text not null,
  created_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);

alter table public.rooms enable row level security;
```

```sql
-- add_rooms_daycare_select_policy
create policy "rooms_daycare_select"
  on public.rooms
  for select
  to authenticated
  using (daycare_id = (select daycare_id from public.users where id = auth.uid()));
```

```sql
-- seed_rooms
insert into public.rooms (id, daycare_id, name) values
  ('a2b2c2d2-0000-0000-0000-000000000101', 'a2b2c2d2-0000-0000-0000-000000000001', 'Soles'),
  ('a2b2c2d2-0000-0000-0000-000000000102', 'a2b2c2d2-0000-0000-0000-000000000001', 'Luna'),
  ('a2b2c2d2-0000-0000-0000-000000000103', 'a2b2c2d2-0000-0000-0000-000000000001', 'Estrellas')
on conflict (id) do nothing;
```

```ts
// components/add-kid-dialog.tsx (cambios)
export function AddKidDialog({ rooms }: { rooms: string[] }) {
  // ...
  {rooms.map((room) => (
    <option key={room} value={room}>{room}</option>
  ))}
}
```

```tsx
// app/kids/page.tsx (cambios)
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function KidsPage() {
  const supabase = createClient(await cookies());
  const { data: rooms } = await supabase
    .from("rooms")
    .select("name")
    .order("name");
  // ...
  <AddKidDialog rooms={(rooms ?? []).map((r) => r.name)} />
}
```

Convenciones:
- `gen_random_uuid()` es core en Postgres 15+ (sin pgcrypto).
- UUID fijos propios de los rooms (`…-101/102/103`) que no chocan con daycares (`…-001`–`…-004`) ni staff (`…-011`), con `on conflict (id) do nothing` → idempotente.
- Se persiste en inglés (tabla/columna); el nombre del room se muestra tal cual en la UI ("Soles", "Luna", "Estrellas").
- La policy `rooms_daycare_select` permite a la app (que respeta RLS) leer los rooms del daycare del usuario logueado; `/kids` está protegida por SPEC 09, así que siempre hay sesión.
- La UI no inserta rooms: solo los lee para el `<select>` del diálogo.

## Implementation plan

1. **Aplicar migración** `create_rooms_table` con `supabase_apply_migration` (CREATE TABLE + índice + RLS on). Estado funcional: la tabla existe en `public`.
2. **Aplicar migración** `add_rooms_daycare_select_policy` con `supabase_apply_migration`. Estado funcional: `authenticated` puede leer los rooms de su daycare.
3. **Aplicar migración** `seed_rooms` con `supabase_apply_migration`. Estado funcional: `rooms` tiene 3 filas bajo Guardería Sala Soles.
4. **Replicar en archivos locales** — crear `supabase/migrations/<version>_create_rooms_table.sql`, `<version>_add_rooms_daycare_select_policy.sql` y `<version>_seed_rooms.sql` con el mismo SQL/version que el remoto (versiones de `supabase_list_migrations`).
5. **UI — `components/add-kid-dialog.tsx`** — quitar `export const ROOMS`, hacer que `AddKidDialog` reciba `rooms: string[]` y mapear las opciones del `<select>`.
6. **UI — `app/kids/page.tsx`** — leer los rooms con `createClient(await cookies())` (`select name, order name`) y pasarlos a `<AddKidDialog rooms={...} />`. Estado funcional: el select muestra los 3 rooms.
7. **Verificación** — `supabase_list_migrations`, `supabase_list_tables` (verbose), `relrowsecurity`/`pg_policies`, `npx tsc --noEmit`, `npm run lint`, `supabase_get_advisors(security)`, y Playwright (login + abrir "Agregar niño" y ver los 3 rooms en el select + regresión del resto).

## Acceptance criteria

- [x] `supabase_list_migrations` incluye `create_rooms_table`, `add_rooms_daycare_select_policy` y `seed_rooms`.
- [x] `supabase_list_tables(public, verbose)` muestra `rooms` con PK `id`, FK `daycare_id → daycares(id)` NOT NULL, índice `rooms_daycare_id_idx` y columnas `id`, `daycare_id`, `name`, `created_at`.
- [x] `relrowsecurity` de `rooms` es `true`.
- [x] `pg_policies` tiene exactamente 1 policy SELECT en `rooms` para `authenticated` con `using (daycare_id = (select daycare_id from public.users where id = auth.uid()))`.
- [x] `rooms` tiene exactamente 3 filas, todas con `daycare_id` = Guardería Sala Soles, y `select name from rooms order by name` devuelve `Estrellas`, `Luna`, `Soles`.
- [x] Re-ejecutar `seed_rooms` con los mismos UUIDs no duplica filas (`on conflict (id) do nothing`).
- [x] Con la sesión de `pablo@google.com` (staff, daycare Sala Soles), el select "Sala" del diálogo "Agregar niño" en `/kids` muestra Soles, Luna y Estrellas.
- [x] Los labels estáticos "Sala Soles" del resto de la app no cambian (regresión visual).
- [x] Existen los 3 archivos en `supabase/migrations/` con el mismo SQL/version que el remoto; no hay `config.toml`.
- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [x] `supabase_get_advisors(security)` no reporta a `rooms` sin RLS ni hallazgos nuevos.
- [x] No se tocó el doc `07-DB-schema` ni las migraciones ya aplicadas.

## Decisions taken and discarded

**Adoptadas:**
- Tabla `rooms` con columnas exactas de la referencia (`id`, `daycare_id`, `name`, `created_at`) — sin `updated_at` (la tabla 3 del diccionario la omite).
- RLS on con **1 policy SELECT** scoped al daycare del usuario — a diferencia de `daycares` (0 policies), `rooms` SÍ se lee desde la app vía RLS, por lo que necesita la policy para no quedar bloqueada por default deny.
- Policy scoped `daycare_id = (select daycare_id from users where id = auth.uid())` — cada usuario ve solo los rooms de su daycare; sin IDOR (patrón de SPEC 09).
- Seed de 3 rooms bajo Guardería Sala Soles — el usuario pidió al menos 3 considerando el estático "Soles"; los otros dos ("Luna", "Estrellas") son de relleno y editables.
- UUID fijos + `on conflict (id) do nothing` — idempotente (patrón SPEC 07/08).
- Integración UI solo en el selector del diálogo "Agregar niño" — el usuario eligió no tocar los labels estáticos de un diseño de un solo room.
- `AddKidDialog` pasa a recibir `rooms` como prop desde el server component `/kids` — mantiene el componente cliente "tonto"; el fetch respeta RLS en el server.

**Descartadas:**
- 0 policies en `rooms` — incompatible con leer los rooms desde la app (default deny los bloquea).
- Policy `using (true)` (cualquier usuario ve todos los rooms) — más simple pero menos restringido; se prefiere el scoping por daycare.
- Reemplazar todos los labels "Sala Soles" (sidebar, headers, home, kids) — cambio de diseño de un solo room a multi-room, que merece su propio spec.
- CRUD de rooms desde la UI — no es parte de "crear los rooms".
- Migraciones solo remotas sin archivos locales — se mantiene el histórico versionado del repo.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| La app no ve los rooms por default deny (0 policies) | Se añade la policy `rooms_daycare_select` en la misma tanda de migraciones. |
| Policy amplia (ver rooms de otras guarderías) | Scoping `daycare_id = daycare del usuario`; sin IDOR. |
| La semilla duplica filas al re-aplicarse | UUID fijos + `on conflict (id) do nothing`. |
| `AddKidDialog` cambia su contrato (recibe `rooms`) | Se actualiza el único punto de uso (`app/kids/page.tsx`); se verifica con `tsc` y Playwright. |
| El select queda vacío si el fetch falla o la policy no permite leer | Fallback `rooms ?? []`; la regresión visual y el login con `pablo@google.com` verifican que se ven los 3 rooms. |

## What is **not** in this spec

- Los demás labels estáticos "Sala Soles" (sidebar, mobile-header, `/home`, `/kids`, `kids/[slug]`, new-post-dialog).
- La tabla `children` ni `children.room_id → rooms`.
- CRUD de rooms desde la UI.
- Policies RLS de otros recursos.
- Cambios en `daycares` ni en el doc de referencia.

Cada uno de esos, si llega, va en su propio spec.
