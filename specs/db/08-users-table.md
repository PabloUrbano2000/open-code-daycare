# SPEC 08 — Tabla `users` y enums en Supabase

**State:** Implementado
**Depends on:** SPEC 07
**Date:** 2026-08-12
**Objective:** Crear los 6 enums del diccionario y la tabla `public.users` en Supabase (FK a `auth.users` y `daycares`, RLS on sin policies, autoprovisionado vía trigger `AFTER INSERT`, `updated_at` automático) y sembrar un usuario staff de prueba real que se puede loguear con `pablo@google.com` / `ElMaldy123@`.

## Scope

**Incluye:**
- Migración `create_app_enums`: los 6 enums del diccionario (`user_role`, `user_status`, `relationship_type`, `invitation_status`, `post_type`, `child_status`) con sus valores exactos.
- Migración `create_users_table`: `public.users` con las 10 columnas de la referencia (`id` uuid PK FK → `auth.users(id)` ON DELETE CASCADE; `daycare_id` uuid FK NOT NULL → `daycares`; `role` `user_role` NOT NULL; `status` `user_status` default `active`; `full_name` NOT NULL; `avatar_url` nullable; `notify_on_post` default `true`; `daily_summary_enabled` default `true`; `created_at`/`updated_at`), índice en `daycare_id` (best practice de FK), RLS on **sin** policies.
- Función `public.set_updated_at()` + trigger `users_set_updated_at` (BEFORE UPDATE) para `updated_at` automático.
- Función `public.handle_new_user()` (SECURITY DEFINER, `search_path = public`) + trigger `on_auth_user_created` (AFTER INSERT sobre `auth.users`) que inserta el perfil en `users` leyendo `raw_user_meta_data` (`daycare_id`, `role`, `full_name`, `avatar_url`); defaults: `role` → `parent`, `full_name` → parte local del email.
- `REVOKE EXECUTE` de ambas funciones a `public`/`anon`/`authenticated` (solo las invoca el trigger).
- Migración `seed_staff_user`: auth.user `pablo@google.com` (bcrypt vía `extensions.crypt`) + fila en `auth.identities`; la fila de `users` la crea el trigger. `daycare_id` = Guardería Sala Soles, `role = staff`, `full_name = "Pablo"`.
- Migración `fix_staff_user_auth_tokens`: setea a `''` los tokens NULL (`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`) del staff — GoTrue devuelve `500: Database error querying schema` con NULLs en esas columnas (hallado en la verificación de login; se documenta en Decisions).
- Archivos locales `supabase/migrations/<version>_<name>.sql` replicando las 4 migraciones (mismos `<version>` que el remoto).
- Verificación de estructura, RLS/policies, triggers, seed, login, `updated_at` y advisors.

**No incluye:**
- Políticas RLS en `users` (spec de auth/RLS cuando haya sesión).
- Flujo real de signup/login/activación (el trigger queda listo; el flujo de invitación va en su spec).
- Las demás tablas del esquema (`rooms`, `children`, `parent_children`, `invitations`, `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`).
- Semillas de dominio (niños, salas, posts) ni otros usuarios.
- Cambios en código de la app.
- `supabase init` / `config.toml` / proyecto local.

## Data model

```sql
-- create_app_enums
create type public.user_role         as enum ('staff', 'parent', 'admin');
create type public.user_status       as enum ('pending', 'active');
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
create type public.post_type         as enum ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');
create type public.child_status      as enum ('active', 'archived');
```

```sql
-- create_users_table
create table public.users (
  id                    uuid primary key references auth.users (id) on delete cascade,
  daycare_id            uuid not null references public.daycares (id),
  role                  public.user_role not null,
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, daycare_id, role, full_name, avatar_url)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
```

```sql
-- seed_staff_user
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a2b2c2d2-0000-0000-0000-000000000011',
  'authenticated', 'authenticated',
  'pablo@google.com',
  extensions.crypt('ElMaldy123@', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"daycare_id":"a2b2c2d2-0000-0000-0000-000000000001","role":"staff","full_name":"Pablo"}',
  now(), now()
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'a2b2c2d2-0000-0000-0000-000000000011',
  'a2b2c2d2-0000-0000-0000-000000000011',
  '{"sub":"a2b2c2d2-0000-0000-0000-000000000011","email":"pablo@google.com"}',
  'email', 'pablo@google.com',
  now(), now(), now()
) on conflict (id) do nothing;
```

Convenciones:
- UUID fijos del staff (`a2b2c2d2-…-000000000011`, propios, no chocan con los de daycares) + `on conflict do nothing` → idempotente.
- `auth.identities.email` es columna generada (STORED desde `identity_data`), por eso se omite en el INSERT.
- La fila de `users` del staff la crea el trigger (el seed no inserta en `users`): sirve de prueba viva del autoprovisionado.
- pgcrypto está en el schema `extensions`; `crypt`/`gen_salt` calificados.

## Implementation plan

1. Aplicar migración `create_app_enums` con `supabase_apply_migration`. Estado funcional: los 6 enums existen.
2. Aplicar migración `create_users_table` (tabla + índice + RLS + `set_updated_at` + `handle_new_user` + triggers + revokes). Estado funcional: `users` existe, RLS on, 0 policies.
3. Aplicar migración `seed_staff_user` (auth.users + auth.identities). Estado funcional: el trigger crea la fila `users` del staff.
4. Replicar las 4 migraciones como archivos locales con los `<version>` de `supabase_list_migrations`.
5. Verificar estructura (enums con `enum_range`, `users` vía `list_tables` verbose, índices/FKs).
6. Verificar RLS/policies/triggers (`relrowsecurity`, `pg_policies`, `pg_trigger`).
7. Verificar seed + trigger (fila staff con `role='staff'` y Sala Soles; login `pablo@google.com` / `ElMaldy123@`).
8. Verificar `updated_at` (UPDATE de prueba que se revierte).
9. `supabase_get_advisors(security)` sin hallazgos nuevos.

## Acceptance criteria

- [ ] `supabase_list_migrations` incluye `create_app_enums`, `create_users_table`, `seed_staff_user` y `fix_staff_user_auth_tokens`.
- [ ] Los 6 enums existen con sus valores exactos del diccionario (verificable con `enum_range`).
- [ ] `users` tiene las 10 columnas de la referencia, PK `id`, FK `id → auth.users(id)` ON DELETE CASCADE, FK `daycare_id → daycares(id)` NOT NULL e índice `users_daycare_id_idx`.
- [ ] `relrowsecurity` de `users` es `true` y `pg_policies` no tiene filas para `users` (0 policies).
- [ ] Existen los triggers `users_set_updated_at` y `on_auth_user_created`.
- [ ] `auth.users` contiene `pablo@google.com` con `email_confirmed_at` seteado y su `auth.identities` (provider `email`).
- [ ] `public.users` tiene exactamente 1 fila del staff (id `…-011`), con `role='staff'`, `status='active'`, `full_name='Pablo'` y `daycare_id` = Guardería Sala Soles, creada por el trigger (el seed no inserta en `users`).
- [ ] Login `pablo@google.com` / `ElMaldy123@` autentica contra auth.
- [ ] Un UPDATE sobre una fila de `users` cambia `updated_at` (verificado y revertido).
- [ ] `supabase_get_advisors(security)` no reporta a `users` sin RLS ni hallazgos nuevos; `anon`/`authenticated` no pueden ejecutar `handle_new_user` ni `set_updated_at`.
- [ ] Existen los 4 archivos en `supabase/migrations/` con el mismo SQL/version que el remoto; no hay `config.toml`.
- [ ] No se tocó el código de la app ni el doc `07-DB-schema`.

## Decisions taken and discarded

**Adoptadas:**
- Los 6 enums en un solo spec — decisión explícita del usuario (4 aún sin uso).
- Trigger `AFTER INSERT` en `auth.users` (SECURITY DEFINER) leyendo `raw_user_meta_data` — implementación que manda la referencia; el seed del staff lo ejercita.
- Seed del staff como auth.user real (bcrypt) + `auth.identities` → logueable con `pablo@google.com` / `ElMaldy123@` (elegidos por el usuario); `full_name = "Pablo"` derivado del email (ajustable). La fila `users` la crea el trigger.
- `daycare_id` NOT NULL — la referencia no lo marca nullable; el admin sin guardería no existe aún.
- 0 policies RLS (default deny) — consistente con SPEC 07; policies van con el spec de auth.
- `updated_at` con trigger `set_updated_at` — la referencia incluye la columna y el trigger la mantiene sin código de app.
- `REVOKE EXECUTE` de las funciones a `public`/`anon`/`authenticated` — mitigación del skill de Supabase para `SECURITY DEFINER` en schema expuesto.
- Índice en `daycare_id` — best practice de FK (Postgres no indexa FKs automáticamente).
- UUID fijos + `on conflict do nothing` — migraciones idempotentes (patrón SPEC 07).
- Migración `fix_staff_user_auth_tokens` — hallazgo de la verificación de login: GoTrue devuelve `500: Database error querying schema` si los tokens de `auth.users` son NULL (insert manual con columnas mínimas). Se aplicó como migración nueva (regla de AGENTS.md: no editar migraciones ya aplicadas), se replicó en `supabase/migrations/` y el login quedó verificado con HTTP 200.

**Descartadas:**
- Policy de auto-lectura — el usuario eligió 0 policies.
- Staff sin auth.user real (fila `users` suelta) — rompe la FK y no permite probar login.
- Trigger sin defaults — un signup futuro sin metadata fallaría ininteligible.
- `updated_at` omitida (como daycares) — la referencia la incluye para `users`.
- Migraciones solo remotas sin archivos locales — se mantiene el histórico versionado del repo.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| Insertar en `auth.users` es frágil (columnas requeridas, bcrypt) | Seed con columnas mínimas de Supabase, `extensions.crypt` calificado, `on conflict do nothing`, verificación con login real. |
| `auth.identities.email` es generada → INSERT falla si se incluye | Se omite en el INSERT. |
| `SECURITY DEFINER` en `public` es invocable por cualquier rol | `REVOKE EXECUTE` a `public`/`anon`/`authenticated`; advisors tras aplicar. |
| El trigger exige `daycare_id` en metadata; un signup sin él falla (NOT NULL) | Aceptado: no hay flujo de signup aún; el spec de auth proveerá `daycare_id`. |
| Credenciales del staff (`pablo@google.com` / `ElMaldy123@`) quedan en el repo | Usuario de desarrollo; se documentan aquí y se rotan en el spec de auth. |

## What is **not** in this spec

- Políticas RLS en `users` (spec de auth/RLS).
- Flujo de signup/login/activación de cuenta.
- El resto de las tablas y semillas de dominio.
- Código de la app.
- `supabase init` completo / `config.toml`.

Cada uno de esos, si llega, va en su propio spec.