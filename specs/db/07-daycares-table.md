# SPEC 07 — Tabla `daycares` en Supabase

**State:** Implementado
**Depends on:** ninguno
**Date:** 2026-08-12
**Objective:** Crear la primera tabla del esquema `public.daycares` en Supabase con RLS habilitado, sin policies y con una semilla de 4 guarderías que incluye "Guardería Sala Soles". Las migraciones se aplican al proyecto remoto vía `supabase_apply_migration` (patrón existente) y además se replican como archivos locales en `supabase/migrations/` para que el esquema quede versionado y reproducible desde el repo.

## Scope

**Incluye:**
- Migración `create_daycares_table` aplicada con `supabase_apply_migration` sobre el proyecto remoto (patrón existente: ya hay `create_test_connection_table`).
- Tabla `public.daycares` con `id` (uuid PK, default `gen_random_uuid()`), `name` (text), `created_at` (timestamptz, default `now()`).
- RLS habilitado en `daycares` (`enable row level security`), **sin** policies.
- Semilla de 4 guarderías en `daycares` (migración `seed_daycares`): "Guardería Sala Soles" más 3 nombres de relleno.
- Archivos locales `supabase/migrations/<version>_create_daycares_table.sql` y `<version>_seed_daycares.sql` replicando las migraciones aplicadas (mismo nombre/versión que las del remoto), sin `supabase init` ni `config.toml`.
- Verificación: estructura y `relrowsecurity` vía SQL, y comprobación de advisors.

**No incluye:**
- Las demás tablas del esquema (`rooms`, `users`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`).
- Los enums del diccionario (`user_role`, `user_status`, `relationship_type`, `invitation_status`, `post_type`, `child_status`) — ninguna los usa todavía.
- Políticas RLS ni el trigger `AFTER INSERT` en `auth.users` — dependen de la tabla `users`.
- Columna `updated_at` en `daycares`.
- Tablas/seed de datos de dominio (rooms, children, etc.).
- Cambios en código de la app (spec solo backend).
- `supabase init` completo, `config.toml`, CLI `supabase db` ni proyecto local de desarrollo.

## Data model

```sql
create table public.daycares (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
```

Semilla (migración `seed_daycares`):

```sql
insert into public.daycares (id, name) values
  ('a2b2c2d2-0000-0000-0000-000000000001', 'Guardería Sala Soles'),
  ('a2b2c2d2-0000-0000-0000-000000000002', 'Guardería Los Girasoles'),
  ('a2b2c2d2-0000-0000-0000-000000000003', 'Guardería Las Estrellitas'),
  ('a2b2c2d2-0000-0000-0000-000000000004', 'Guardería Arcoíris')
on conflict (id) do nothing;
```

Convenciones:
- `gen_random_uuid()` es core en Postgres 15+ (sin extensión pgcrypto).
- Los UUID fijos de la semilla son propios (no referencian otras tablas) y hacen la migración idempotente (`on conflict (id) do nothing`).
- Se persiste en inglés (nombre de tabla/columna); las etiquetas visibles se traducen en la UI.
- Con RLS on y 0 policies, solo `service_role`/roles con `bypassrls` pueden acceder; los roles `anon`/`authenticated` quedan bloqueados por defecto.

## Implementation plan

1. **Aplicar la migración** `create_daycares_table` con `supabase_apply_migration` (CREATE TABLE + RLS on, SQL del Data model). Estado funcional: la tabla existe en `public`.
2. **Aplicar la migración** `seed_daycares` con `supabase_apply_migration` (INSERT de la semilla, idempotente). Estado funcional: `daycares` tiene 4 filas.
3. **Replicar en archivos locales** — crear `supabase/migrations/<version>_create_daycares_table.sql` y `<version>_seed_daycares.sql` con el mismo SQL/version que las migraciones del remoto (versiones existentes en `supabase_list_migrations`), para que el esquema quede versionado en el repo. Sin `supabase init` ni `config.toml`.
4. **Verificar estructura** — `supabase_list_tables(public, verbose)` confirma `daycares` con PK `id` y las 3 columnas con sus defaults.
5. **Verificar RLS y policies** — SQL: `select relrowsecurity from pg_class where relname='daycares'` devuelve `true` y `select count(*) from pg_policies where tablename='daycares'` devuelve `0`.
6. **Avidsores** — `supabase_get_advisors(security)` sin hallazgos nuevos sobre `daycares`.

## Acceptance criteria

- [ ] `supabase_list_migrations` incluye `create_daycares_table` y `seed_daycares`.
- [ ] `supabase_list_tables(public, verbose)` muestra `daycares` con PK `id` y columnas `id`, `name`, `created_at` (defaults `gen_random_uuid()` y `now()`).
- [ ] `daycares` tiene exactamente 4 filas; `select name from daycares order by name` incluye "Guardería Sala Soles".
- [ ] Re-ejecutar la semilla con los mismos UUIDs no duplica filas (`on conflict (id) do nothing`).
- [ ] `relrowsecurity` de `daycares` es `true`.
- [ ] `pg_policies` no tiene filas para `daycares` (0 policies).
- [ ] `supabase_get_advisors(security)` no reporta a `daycares` sin RLS ni hallazgos nuevos.
- [ ] Existen `supabase/migrations/<version>_create_daycares_table.sql` y `<version>_seed_daycares.sql` con el mismo SQL que las migraciones aplicadas; sus versiones coinciden con las de `supabase_list_migrations`. No hay `config.toml` ni el resto de `supabase init`.
- [ ] No se tocó el código de la app ni el doc de referencia `07-DB-schema`.

## Decisions taken and discarded

**Adoptadas:**
- Columnas exactas de la referencia (`id`, `name`, `created_at`) sin `updated_at` — la tabla 1 del diccionario la omite expresamente.
- RLS habilitado **sin** policies (default deny) — la tabla es raíz sin owner; las policies llegan cuando exista `users` y la relación user→daycare.
- Migraciones DDL directo al remoto vía `supabase_apply_migration` — replica el patrón ya usado en el proyecto.
- Replicar las migraciones como archivos locales en `supabase/migrations/` — el usuario lo pidió explícito; versiona el esquema en el repo y habilita reproducibilidad con el CLI a futuro, manteniendo los `<version>` idénticos a los del remoto para que no haya drift.
- Semilla de 4 guarderías incluyendo "Guardería Sala Soles" — el usuario lo pidió explícito ("si o sí"); los otros 3 nombres son de relleno y se pueden editar.
- `create table` + `enable row level security` en la misma migración — aplica la regla del AGENTS.md al primer paso.

**Descartadas:**
- `updated_at` — no lo lista la referencia para esta tabla.
- Policy temporal de SELECT para `authenticated` — sin forma de filtrar por fila es BOLA/IDOR.
- RLS off — contradice la regla del AGENTS.md y deja la Data API abierta.
- `supabase init` completo (config.toml, seed, `supabase db`) — el proyecto gestiona migraciones por MCP; la carpeta se replica para que exista el histórico, sin proyecto local de desarrollo.
- Enums y demás tablas del esquema — la referencia se implementa por etapas.
- Semilla con `gen_random_uuid()` — se usan UUID fijos y `on conflict (id) do nothing` para que la migración sea idempotente y reproduciible.
- Más de 4 guarderías — el usuario pidió 4 filas, una de ellas Sala Soles.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| La migración existe solo en el proyecto remoto | Se replica en `supabase/migrations/` con el mismo `<version>`, dejando el histórico del esquema en el repo. |
| Desfase entre archivos locales y migraciones del remoto (drift) | Los `<version>` de los archivos replican exactamente los de `supabase_list_migrations`; no se alteran sin espec. |
| La semilla no es idempotente y duplica filas al re-aplicarse | UUID fijos + `on conflict (id) do nothing`. |
| La Data API puede no exponer tablas creadas por SQL | No impacta: sin GRANT ni policies, nadie accede por la Data API por ahora. |
| `gen_random_uuid()` depende de una función del servidor | Núcleo de Postgres 15+; se verifica al crear la tabla. |

## What is **not** in this spec

- El resto de las tablas y enums del diccionario.
- Políticas RLS, trigger de `auth.users` ni flujo de onboarding.
- Semilla de datos de dominio (rooms, children, etc.) ni integración con la app.
- `supabase init` completo (`config.toml`, seed, entorno local de desarrollo) ni CLI `supabase db`.
- `updated_at` en `daycares`.

Cada uno de esos, si llega, va en su propio spec.