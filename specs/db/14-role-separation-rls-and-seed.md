# SPEC 14 — Separación por rol en RLS (staff vs familia) + seed del padre

> **State:** Aprobado
> **Depends on:** SPEC 12, SPEC 13
> **Date:** 2026-08-14
> **Objective:** Hacer que la RLS de `posts`, `post_children`, `post_photos`, `children`, `parent_children` y del bucket `post-photos` sea por rol —el staff del daycare ve todo su daycare, el padre solo los posts de sus hijos más los anuncios de su sala— y sembrar al padre de prueba "Lucía Fernández" (mamá de Mateo y Sofía) para habilitar el panel familia de la SPEC 07.

## Scope

**Incluye:**
- Migraciones Supabase (`supabase_apply_migration` + réplica local en `supabase/migrations/`):
  - `add_role_helper_functions`: funciones SQL `public.is_staff()` y `public.is_parent()` (patrón `invitations_daycare_staff` de SPEC 12; leen `public.users` con RLS `users_self_select`).
  - `add_role_based_select_policies`: **reemplaza** las 4 policies SELECT daycare-wide (`posts_daycare_select`, `post_children_daycare_select`, `post_photos_daycare_select`, `children_daycare_select`) por pares por rol (staff/parent), y agrega `parent_children_parent_select`. Las policies de INSERT (staff) de `posts`/`post_children`/`post_photos` no se tocan.
  - `tighten_post_photos_storage_select`: reemplaza la SELECT del bucket `post-photos` (hoy daycare-wide) por una por rol — el padre solo firma fotos de posts que le son visibles.
  - `seed_family_parent`: usuario padre "Lucía Fernández" (`lucia.fernandez@gmail.com`) insertado con el patrón de `seed_staff_user` (`auth.users` + `auth.identities`, el trigger `handle_new_user` crea la fila en `users` con `role='parent'`) + 2 filas en `parent_children` (madre de Mateo y de Sofía).
- Verificación de RLS con consultas readonly (setting de claims) y login real del padre.

**No incluye:**
- La UI del panel familia (`/family`, feed con chips, cuenta) — va en la SPEC 07.
- El ruteo por rol en `proxy.ts`/middleware ni el redirect del login — SPEC 07.
- Cambiar las policies de INSERT (staff) existentes.
- Policies SELECT de staff sobre `parent_children` (la sección "PADRES VINCULADOS" del perfil sigue hardcodeada).
- Cambios en el doc `07-DB-schema` ni migraciones ya aplicadas.

## Data model

```sql
-- add_role_helper_functions
create or replace function public.is_staff()
returns boolean language sql stable set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'staff'
  );
$$;

create or replace function public.is_parent()
returns boolean language sql stable set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'parent'
  );
$$;
```

```sql
-- add_role_based_select_policies
-- posts
drop policy if exists "posts_daycare_select" on public.posts;

create policy "posts_staff_select"
  on public.posts for select to authenticated
  using (
    public.is_staff()
    and room_id in (select id from public.rooms where daycare_id = public.user_daycare_id())
  );

create policy "posts_parent_select"
  on public.posts for select to authenticated
  using (
    public.is_parent()
    and (
      (type = 'announcement'::public.post_type and room_id in (
        select c.room_id from public.children c
        join public.parent_children pc on pc.child_id = c.id
        where pc.parent_id = auth.uid()
      ))
      or exists (
        select 1 from public.post_children pc
        where pc.post_id = posts.id
          and pc.child_id in (
            select plc.child_id from public.parent_children plc
            where plc.parent_id = auth.uid()
          )
      )
    )
  );

-- post_children
drop policy if exists "post_children_daycare_select" on public.post_children;

create policy "post_children_staff_select"
  on public.post_children for select to authenticated
  using (
    public.is_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = post_children.child_id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "post_children_parent_select"
  on public.post_children for select to authenticated
  using (
    public.is_parent()
    and exists (
      select 1 from public.parent_children pc
      where pc.parent_id = auth.uid() and pc.child_id = post_children.child_id
    )
  );

-- post_photos (visibilidad delegada a posts)
drop policy if exists "post_photos_daycare_select" on public.post_photos;

create policy "post_photos_staff_select"
  on public.post_photos for select to authenticated
  using (
    public.is_staff()
    and exists (select 1 from public.posts p where p.id = post_photos.post_id)
  );

create policy "post_photos_parent_select"
  on public.post_photos for select to authenticated
  using (
    public.is_parent()
    and exists (select 1 from public.posts p where p.id = post_photos.post_id)
  );

-- children
drop policy if exists "children_daycare_select" on public.children;

create policy "children_staff_select"
  on public.children for select to authenticated
  using (
    public.is_staff()
    and room_id in (select id from public.rooms where daycare_id = public.user_daycare_id())
  );

create policy "children_parent_select"
  on public.children for select to authenticated
  using (
    public.is_parent()
    and exists (
      select 1 from public.parent_children pc
      where pc.parent_id = auth.uid() and pc.child_id = children.id
    )
  );

-- parent_children (self-scoped; el staff aún no lee esta tabla)
create policy "parent_children_parent_select"
  on public.parent_children for select to authenticated
  using (parent_id = auth.uid());
```

```sql
-- tighten_post_photos_storage_select
drop policy if exists "post_photos_storage_select" on storage.objects;

create policy "post_photos_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = (select daycare_id::text from public.users where id = auth.uid())
    and (
      public.is_staff()
      or exists (
        select 1 from public.post_photos pp
        where pp.url = name
          and exists (select 1 from public.posts p where p.id = pp.post_id)
      )
    )
  );
```

```sql
-- seed_family_parent
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a2b2c2d2-0000-0000-0000-000000000021',
  'authenticated', 'authenticated',
  'lucia.fernandez@gmail.com',
  extensions.crypt('ElMaldy123@', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"daycare_id":"a2b2c2d2-0000-0000-0000-000000000001","role":"parent","full_name":"Lucía Fernández"}',
  now(), now()
) on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'a2b2c2d2-0000-0000-0000-000000000021',
  'a2b2c2d2-0000-0000-0000-000000000021',
  '{"sub":"a2b2c2d2-0000-0000-0000-000000000021","email":"lucia.fernandez@gmail.com"}',
  'email', 'lucia.fernandez@gmail.com',
  now(), now(), now()
) on conflict (id) do nothing;

insert into public.parent_children (parent_id, child_id, relationship)
values
  ('a2b2c2d2-0000-0000-0000-000000000021', 'a2b2c2d2-0000-0000-0000-000000000201', 'mother'),
  ('a2b2c2d2-0000-0000-0000-000000000021', 'a2b2c2d2-0000-0000-0000-000000000202', 'mother')
on conflict (parent_id, child_id) do nothing;
```

Convenciones:
- Todos los posts llevan `room_id` del daycare (decisión de SPEC 13: el staff siempre resuelve su sala). Por eso el staff se scoped por sala y el padre usa "anuncios de la sala de sus hijos" + "posts etiquetados con un hijo suyo".
- `post_photos` (tabla y storage) delegan su visibilidad a `posts`: una sola definición de visibilidad (DRY), sin duplicar la lógica del feed.
- Los helpers `is_staff()`/`is_parent()` son `SECURITY INVOKER` y leen la propia fila de `users` (policy `users_self_select`), sin ciclos de RLS.
- El seed replica `seed_staff_user` (insert en `auth.users` + `auth.identities`); el trigger `handle_new_user` crea la fila en `public.users` con `role='parent'` desde la metadata. `parent_children` con RLS on y 0 policies se inserta con privilegios de migración (service role), sin exponerse a `anon`/`authenticated`.
- Credenciales del padre de prueba: `lucia.fernandez@gmail.com` / `ElMaldy123@` (misma contraseña de dev que el staff).

## Implementation plan

1. **Aplicar migración** `add_role_helper_functions` (`supabase_apply_migration`) y **replicarla** como `supabase/migrations/<version>_add_role_helper_functions.sql` con el `<version>` de `supabase_list_migrations`. Estado funcional: `is_staff()`/`is_parent()` responden `true`/`false` según el rol.
2. **Aplicar y replicar** `add_role_based_select_policies`. Estado funcional: `pg_policies` muestra los pares por rol en `posts`/`post_children`/`post_photos`/`children` + `parent_children_parent_select`; las 4 policies daycare-wide ya no existen.
3. **Aplicar y replicar** `tighten_post_photos_storage_select`. Estado funcional: `storage.objects` del bucket `post-photos` se lee por rol.
4. **Aplicar y replicar** `seed_family_parent`. Estado funcional: existe `lucia.fernandez@gmail.com` (auth + `users` con `role='parent'`) y sus 2 filas en `parent_children`.
5. **Verificación de RLS (readonly)** — con `supabase_execute_sql` seteando claims (`select set_config('request.jwt.claims', '{"sub":"<id>","role":"authenticated"}', false)`):
   - Como staff (Pablo): `posts` devuelve las 4 filas; `children` las 8; `post_children`/`post_photos` todo el daycare.
   - Como padre (Lucía): `children` solo Mateo y Sofía; `posts` solo sus posts (logro/actividad de Mateo, comida de Mateo+Sofía) + el anuncio de Soles; `parent_children` sus 2 filas.
   - Un post dirigido solo a un niño no vinculado (p. ej. crear temporalmente uno para Benjamín Ruiz y borrarlo) **no** aparece para Lucía.
   - Registrar también `supabase_get_advisors(security)`.
6. **Regresión de la app staff** — `npm run dev` y login staff: `/` y `/kids` siguen iguales (el feed staff ve las 4 publicaciones). `npx tsc --noEmit` y `npm run lint` sin errores (no debería tocarse código).
7. **Regresión del storage** — las fotos del feed staff se siguen firmando; el post seed (URL absoluta) no depende del bucket.

## Acceptance criteria

- [ ] `supabase_list_migrations` incluye las 4 migraciones nuevas; existen sus `.sql` locales con el mismo version.
- [ ] `pg_policies`: `posts`/`post_children`/`post_photos`/`children` tienen SELECT por rol (staff + parent) y **no** quedan las policies `*_daycare_select`; `parent_children` tiene `parent_children_parent_select`.
- [ ] `public.is_staff()` es `true` para el staff y `false` para el padre y para `anon`; `public.is_parent()` es `true` para el padre y `false` para el staff.
- [ ] Con claims de Pablo: `select count(*) from posts` = 4, `children` = 8, `post_children` = todas, `post_photos` = todas.
- [ ] Con claims de Lucía: `children` = exactamente Mateo (…201) y Sofía (…202); `posts` = los 3 posts seed de Mateo/Sofía + el anuncio de Soles; `post_children`/`post_photos` solo de esos posts; `parent_children` = 2 filas (mother).
- [ ] Con claims de Lucía, un post temporal dirigido a Benjamín Ruiz (…203, sala Soles) no es visible; borrado después de la prueba.
- [ ] El padre no puede firmar URLs de fotos de un post que no le es visible (`createSignedUrls` devuelve error); el staff sí firma las de su daycare.
- [ ] `lucia.fernandez@gmail.com` inicia sesión con `ElMaldy123@`; su fila en `users` tiene `role='parent'`, `daycare_id` = Guardería Sala Soles y `full_name` = "Lucía Fernández"; `parent_children` la vincula como `mother` a Mateo y Sofía.
- [ ] Las policies de INSERT existentes de `posts`/`post_children`/`post_photos`/`invitations` no cambiaron.
- [ ] El feed staff (`/`) sigue mostrando las 4 publicaciones con sus fotos (regresión).
- [ ] `npx tsc --noEmit` y `npm run lint` pasan sin cambios de código.
- [ ] `supabase_get_advisors(security)` no reporta hallazgos nuevos.
- [ ] No se tocó código de la app, el doc `07-DB-schema` ni migraciones ya aplicadas.

## Decisions taken and discarded

**Adoptadas:**
- **RLS por rol como fuente de verdad** (no filtrar en la app) — el usuario eligió lo recomendado; los SELECT por rol evitan fugas entre niños aunque un cliente pida todo.
- **Seed por insert directo** (`auth.users` + `auth.identities` + `parent_children`) en vez de la invitación — la invitación solo vincula **1 hijo por activación** (crea un usuario nuevo por `/activate`); el mockup pide mamá de Mateo y Sofía. Se descartó el camino de invitación acordado en el plan al descubrir esa limitación. Patrón idéntico a `seed_staff_user`.
- **Pares de policies SELECT por rol** que reemplazan las daycare-wide — el staff mantiene exactamente el alcance actual (su daycare); el padre queda acotado a sus hijos + anuncios de su sala.
- **`post_photos` y storage delegan a `posts`** (`exists (select 1 from posts p where p.id = …)`) — una sola definición de visibilidad (DRY); evita duplicar la lógica del feed y reduce el riesgo de recursión (SPEC 13 ya chocó con 42P17).
- **Helpers `is_staff()`/`is_parent()` `SECURITY INVOKER`** leyendo la propia fila de `users` — reutilizan `users_self_select`; sin `SECURITY DEFINER` (el skill de Supabase lo desaconseja para esto).
- **`parent_children_parent_select` self-scoped** (`parent_id = auth.uid()`) — el padre lee solo sus vínculos; el staff no lee esta tabla todavía (PADRES VINCULADOS sigue hardcodeado).
- **`tighten_post_photos_storage_select` incluido en esta spec** — no estaba en la lista original del plan, pero la policy de storage era daycare-wide (un padre podía firmar fotos de otros niños); es la misma fuga que esta spec cierra en las tablas.
- **Credenciales de dev compartidas** (`ElMaldy123@`) — consistente con el seed staff existente.

**Descartadas:**
- Seed vía invitación + `/activate` — solo vincula 1 hijo y crea un usuario nuevo por activación.
- Filtrar el feed por rol solo en el query de la app (`getFeed`) — la RLS es la fuente de verdad; la app aplicará el mismo filtro igual para los chips.
- Policy SELECT explícita en `post_photos` duplicando la lógica de visibilidad de `posts` — DRY vía RLS de `posts`.
- Dejar `post_photos_storage_select` daycare-wide — expone fotos de otros niños al padre.
- Extender `activate-account` para vincular varios hijos — agrandaba el alcance; se prefirió el seed directo.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| Recursión infinita (42P17) al encadenar policies (posts → post_children → parent_children → users) | Diseño sin ciclos: `post_photos`/storage delegan a `posts`; `posts_parent_select` nunca referencia `post_photos`/storage. Se verifica con una query real por rol. |
| Alterar las SELECT daycare-wide rompe el feed staff | Las policies staff replican el alcance actual (sala del daycare); regresión cubierta en `/`. |
| El seed en `auth.users` exige consistencia con el trigger `handle_new_user` | Se replica el patrón `seed_staff_user` (ya probado); `on conflict do nothing`; la metadata lleva `daycare_id`/`role`/`full_name` que el trigger requiere. |
| Contraseña de dev hardcodeada en la migración | Es un seed de desarrollo (patrón del repo), documentada en la spec; nunca una credencial real. |
| Subquery a `post_photos`/`posts` en la policy de storage agrega costo por objeto | Son pocos objetos por daycare y se firman por id en el feed; aceptable. |
| `post_photos.url` guarda paths; la policy compara `pp.url = name` | El feed firma el path exacto guardado; el post seed usa URL absoluta y no toca el bucket. |

## What is **not** in this spec

- Panel familia (`/family`), feed con chips y cuenta — SPEC 07.
- Ruteo por rol en `proxy.ts`/middleware y redirect post-login — SPEC 07.
- Policies de INSERT (staff) nuevas o modificadas.
- SELECT de staff sobre `parent_children` ("PADRES VINCULADOS" real).
- Cambios en el doc `07-DB-schema` ni migraciones ya aplicadas.

Cada uno de esos, si llega, va en su propio spec.