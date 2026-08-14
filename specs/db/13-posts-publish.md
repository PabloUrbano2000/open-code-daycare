# SPEC 13 — Publicar posts del staff (con/sin fotos) y feed dinámico

> **State:** Aprobado
> **Depends on:** SPEC 06, SPEC 08, SPEC 09, SPEC 11
> **Date:** 2026-08-13
> **Objective:** Hacer que el diálogo "Nueva publicación" de la SPEC 06 cree posts reales en la DB (con o sin fotos subidas a Storage) como staff del daycare, y que el feed `/` pase a leerse desde `posts`/`post_children`/`post_photos` con header dinámico.

## Scope

**Incluye:**
- Migraciones Supabase (`supabase_apply_migration` + réplica local en `supabase/migrations/`):
  - `add_post_type_mood`: `alter type public.post_type add value 'mood'` (soporta el tipo "Ánimo" del mockup).
  - `create_posts_tables`: `public.posts`, `public.post_children` y `public.post_photos` según el diccionario, con índices (best practice FK) y RLS on.
  - `add_posts_staff_policies`: RLS. SELECT **daycare-wide** en `posts`/`post_children`/`post_photos` (staff y padres del daycare); INSERT solo staff del daycare en `posts` (con `author_id = auth.uid()`), y en `post_children`/`post_photos` scoped a posts/niños del daycare.
  - `seed_posts`: los 3 posts del mockup (logro de Mateo, actividad de Mateo con 1 foto, anuncio general de sala) como filas reales con `author_id` = staff seed, `room_id` = Soles, `post_children` y `post_photos` acordes, para que el feed dinámico luzca igual que hoy.
  - `create_post_photos_bucket`: bucket **privado** `post-photos` (`storage.buckets`) + policies en `storage.objects` (INSERT staff del daycare, SELECT miembros del daycare; path con prefijo `{daycare_id}/`).
- `app/posts/actions.ts` (nuevo, server): Server Action `publishPost` que valida zod, verifica staff (`getClaims`), resuelve slugs → `child_id` (por `full_name`, patrón SPEC 12), valida `photo_consent` cuando hay fotos, inserta `posts` + `post_children` + `post_photos`, y devuelve éxito o error en español.
- `components/new-post-dialog.tsx`: fotos reales (file input oculto → previews → upload al bucket con el client publishable key, máx 4 fotos / 5MB / `image/jpeg|png|webp`), estado "Publicando…" (botón deshabilitado), éxito → cierra el diálogo, error → mensaje inline con el modal abierto y datos intactos, y regla "el tipo Foto exige ≥1 imagen".
- `app/page.tsx`: reescrito como server component que consulta el feed real (posts + autor + destinatarios + fotos) ordenado por `published_at desc` en lista simple, header 100% dinámico (nombre del staff, sala, niños activos, fecha actual), cards con avatar del niño (o icono para anuncios), badge por tipo, "Para: familia de …" / "Para: toda la sala", grid de fotos real (signed URLs; sin fotos no se renderiza contenedor), contadores `0/0` y link "Editar" muerto.
- `utils/feed.ts` (nuevo): query del feed (`getFeed`) + helpers de badge/avatar/`Para:` y de resolución de la sala del staff.
- Mapeo UI→DB de tipos: Comida→meal, Siesta→nap, Actividad→activity, Logro→achievement, Ánimo→mood, Foto→photo, Anuncio→announcement.
- Asset estático `public/seed/` con una imagen de ejemplo para la foto del post seed (apuntada desde `post_photos.url`).

**No incluye:**
- Editar/borrar posts (los links "Editar" siguen `href="#"`).
- Detalle de publicación + comentarios/reacciones (`reactions`/`comments` siguen sin crearse; contadores en `0`).
- Feed de familia por rol (el filtro por `parent_children` viene en otro spec).
- Notificaciones/emails al publicar.
- Cambios en el doc `07-DB-schema` ni migraciones ya aplicadas.

## Data model

```sql
-- add_post_type_mood
alter type public.post_type add value if not exists 'mood';
```

```sql
-- create_posts_tables
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.users (id),
  room_id      uuid references public.rooms (id),
  type         public.post_type not null,
  title        text,
  body         text not null,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index posts_author_id_idx on public.posts (author_id);
create index posts_room_id_idx on public.posts (room_id);
create index posts_published_at_idx on public.posts (published_at desc);

create table public.post_children (
  post_id  uuid not null references public.posts (id),
  child_id uuid not null references public.children (id),
  primary key (post_id, child_id)
);

create index post_children_child_id_idx on public.post_children (child_id);

create table public.post_photos (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id),
  url        text not null,
  width      int,
  height     int,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index post_photos_post_id_idx on public.post_photos (post_id);

alter table public.posts enable row level security;
alter table public.post_children enable row level security;
alter table public.post_photos enable row level security;
```

```sql
-- add_posts_staff_policies
create or replace function public.user_daycare_id()
returns uuid language sql stable set search_path = public as $$
  select daycare_id from public.users where id = auth.uid();
$$;

-- posts
create policy "posts_daycare_select"
  on public.posts for select to authenticated
  using (
    room_id in (select id from public.rooms where daycare_id = public.user_daycare_id())
    or exists (
      select 1 from public.post_children pc
      join public.children c on c.id = pc.child_id
      join public.rooms r on r.id = c.room_id
      where pc.post_id = posts.id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "posts_daycare_insert"
  on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and (select role from public.users where id = auth.uid()) = 'staff'
    and (room_id is null or room_id in (select id from public.rooms where daycare_id = public.user_daycare_id()))
  );

-- post_children
create policy "post_children_daycare_select"
  on public.post_children for select to authenticated
  using (
    exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = post_children.child_id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "post_children_daycare_insert"
  on public.post_children for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_id and r.daycare_id = public.user_daycare_id()
    )
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id and r.daycare_id = public.user_daycare_id()
    )
  );

-- post_photos
create policy "post_photos_daycare_select"
  on public.post_photos for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_photos.post_id and r.daycare_id = public.user_daycare_id()
    )
  );

create policy "post_photos_daycare_insert"
  on public.post_photos for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_id and r.daycare_id = public.user_daycare_id()
    )
  );
```

> Nota: la política SELECT de `posts` cubre tanto posts con `room_id` (anuncios de sala) como posts a niños (vía `post_children`); los posts seed de niños tienen `room_id` null y caen en la segunda rama. Los INSERT de `post_children`/`post_photos` asumen `posts.room_id` del daycare (los posts del staff siempre resuelven la sala; ver decisiones).

```sql
-- create_post_photos_bucket
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', false)
on conflict (id) do nothing;

create policy "post_photos_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'post-photos'
    and (select role from public.users where id = auth.uid()) = 'staff'
    and (storage.foldername(name))[1] = (select daycare_id::text from public.users where id = auth.uid())
  );

create policy "post_photos_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'post-photos'
    and (storage.foldername(name))[1] = (select daycare_id::text from public.users where id = auth.uid())
  );
```

```ts
// app/posts/actions.ts (esquema)
export interface PublishPostResult { error?: string }

export async function publishPost(input: {
  targets: PostTarget[];          // ["toda-la-sala"] o slugs de kids
  type: PostType;                 // Comida | Siesta | ... | Anuncio
  description: string;
  photoPaths: string[];           // paths subidos al bucket, ej. ["<daycareId>/<uuid>.jpg"]
}): Promise<PublishPostResult> {
  // 1. claims -> user (staff); sin sesión -> error
  // 2. validar zod (reusa newPostSchema + regla: type === "Foto" => photoPaths.length >= 1)
  // 3. typeEnum = UI_TO_ENUM[type]; si targets === ["toda-la-sala"] -> roomId = resolveStaffRoom(supabase).id
  //    si no -> childIds = children.where(full_name in names)  -> slug->id; faltante -> error
  // 4. si photoPaths.length > 0 -> verificar photo_consent de los niños destino
  //    (toda-la-sala => todos los children de la sala); si alguno con photo_consent=false
  //    -> error listando los nombres
  // 5. insert posts { author_id, room_id | null, type: typeEnum, body: description, published_at: now() }
  // 6. insert post_children (si childIds) y post_photos (photoPaths con position)
  // 7. return {} (exito) | { error }
}
```

Convenciones:
- `post_photos.url` guarda el **path** del bucket (`{daycare_id}/{nombre}`) para uploads reales, o una URL absoluta (asset `public/seed/…`) para el post seed. El feed distingue: path de bucket → signed URL al renderizar; URL absoluta → se usa tal cual.
- "Toda la sala" (`posts.room_id` set, sin filas en `post_children`) vs niños concretos (filas en `post_children`, `room_id` null).
- `published_at = now()`; la hora del feed se formatea de `published_at`.

## Implementation plan

1. **Aplicar migraciones** `add_post_type_mood`, `create_posts_tables`, `add_posts_staff_policies` y `create_post_photos_bucket` (`supabase_apply_migration`) y **replicarlas** como `supabase/migrations/<version>_*.sql` con los `<version>` de `supabase_list_migrations`. Estado funcional: tablas + bucket + policies creados.
2. **Aplicar y replicar** `seed_posts`. Estado funcional: `posts` tiene los 3 posts del mockup con sus relaciones.
3. **Asset seed** — crear `public/seed/temperas.png` (o `.webp`; imagen de ejemplo pequeña). Estado funcional: la URL del post seed resuelve.
4. **`utils/feed.ts`** — `getFeed()` (server, client de `@/utils/supabase/server`): usuario + sala + niños activos + posts del daycare ordenados por `published_at desc`, con autor, destinatarios (nombre/avatar desde `kids` por `full_name`) y fotos (signed URL si es path de bucket); helpers `badgeForType`, `paraText`, `staffRoom`. Estado funcional: tipos exportados.
5. **`app/posts/actions.ts`** — `publishPost` según el Data model. Estado funcional: compila y valida.
6. **`components/new-post-dialog.tsx`** — fotos reales (input file → previews → upload a `post-photos`, máx 4/5MB/tipos), estado "Publicando…", error inline, y validación "Foto exige imagen"; al submit llama `publishPost`. Estado funcional: se puede publicar un post real desde el diálogo.
7. **`app/page.tsx`** — reescribir con `getFeed()`: header dinámico, tarjeta compositora (igual), lista de cards dinámicas (sin secciones por día), contadores `0/0`, "Editar" muerto. Estado funcional: `/` muestra los posts de la DB.
8. **Verificación** — `npx tsc --noEmit`, `npm run lint`, `supabase_get_advisors(security)`, y Playwright: login staff → publicar con y sin fotos → verificar filas en DB y el post arriba del feed; comparación estructural de `/` contra `feed.png`/`feed2.png` (el header, fecha y contadores difieren del mockup por diseño; ver riesgos).

## Acceptance criteria

- [ ] `supabase_list_migrations` incluye las 5 migraciones nuevas; existen sus `.sql` locales con el mismo version.
- [ ] `post_type` incluye `mood`; `posts`/`post_children`/`post_photos` tienen las columnas del diccionario, índices, RLS on y las policies esperadas (SELECT daycare-wide, INSERT staff).
- [ ] El bucket `post-photos` existe con `public=false` y las 2 policies de `storage.objects` scoped al daycare.
- [ ] Los 3 posts seed están en DB con `author_id` = staff seed, `room_id` = Soles (anuncio), `post_children` correctos y 1 `post_photos` para la actividad.
- [ ] `/` muestra el feed desde la DB: header con nombre real del staff, sala, conteo de niños y fecha actual; lista ordenada por `published_at desc`; sin secciones por día.
- [ ] Cards: avatar del niño (o icono para anuncio), hora de `published_at`, badge por tipo (7 tipos mapeados, colores del mockup), "Para: familia de {nombres}" o "Para: toda la sala", contadores `0/0` y "Editar" sin navegar.
- [ ] Con fotos, el feed renderiza un grid de imágenes reales (signed URLs para uploads reales; URL absoluta para el seed). Sin fotos no hay contenedor de imágenes.
- [ ] Publicar desde el diálogo con un niño destino crea `posts` + `post_children` y aparece arriba del feed.
- [ ] Publicar con "Toda la sala" crea `posts` con `room_id` set y **sin** filas en `post_children`.
- [ ] Publicar el tipo "Foto" sin imágenes muestra error y no persiste.
- [ ] Publicar con una foto hacia un niño con `photo_consent=false` bloquea con mensaje que lista al niño (probar marcando un niño sin consentimiento en seed, p. ej. actualizar temporalmente `photo_consent`).
- [ ] El diálogo muestra "Publicando…" mientras sube/guarda; ante error queda abierto con descripción y fotos intactas; ante éxito cierra y el post aparece.
- [ ] Máx 4 fotos, cada una ≤5MB y de tipo `image/jpeg|png|webp` (rechazo cliente y server).
- [ ] Un `parent` autenticado no puede insertar `posts` (RLS lo rechaza) y sí puede leer el feed del daycare.
- [ ] `npx tsc --noEmit` y `npm run lint` pasan; `supabase_get_advisors(security)` sin hallazgos nuevos.
- [ ] No se tocó `app/kids/data.ts`, el doc `07-DB-schema` ni migraciones ya aplicadas.

## Decisions taken and discarded

**Adoptadas:**
- **`posts_daycare_select` simplificada a la rama de sala** (migración `simplify_posts_select_policy`) — la policy aprobada con el `OR exists(post_children…)` causaba *infinite recursion* (42P17) en los INSERT de `post_children`/`post_photos` (subquery a `posts` → RLS SELECT de `posts` → subquery a `post_children` → ciclo). Dado que por la Opción 1 todos los posts llevan `room_id` (incluidos los de niños, vía `set_seed_posts_room_id`), la rama de `post_children` es redundante; se quitó manteniendo el SELECT daycare-wide. Decisión del usuario (Opción 1 del diagnóstico).
- **Feed `/` 100% dinámico** desde la DB — el usuario lo eligió sobre "solo persistir"; reemplaza los posts hardcodeados de `app/page.tsx`.
- **`mood` en `post_type`** (migración) — mantiene los 7 tipos del mockup; sin mapeo que pierda el tipo "Ánimo".
- **`Toda la sala` → `posts.room_id` + sin `post_children`** — coincide con el diccionario; los posts a niños van a `post_children`.
- **INSERT staff de cualquier rol staff del daycare** (`author_id = auth.uid()` en la policy) — RLS como única puerta; el servidor valida igualmente.
- **Client upload a Storage** con publishable key (reusa el patrón de la app) y Server Action que guarda los paths — el archivo no pasa por Next.
- **Límites 4 fotos / 5MB / jpeg-png-webp** validados en cliente y server.
- **Bucket `post-photos` privado** + policies de `storage.objects` scoped al daycare por prefijo `{daycare_id}/` — las fotos de niños no quedan públicas.
- **`photo_consent` bloqueante** con mensaje que lista al niño — riguroso con el modelo (los 8 seed tienen consentimiento; se prueba desmarcando uno).
- **Tipo Foto exige ≥1 imagen** — decidido por el usuario.
- **Seed de los 3 posts del mockup** — el feed dinámico arranca visualmente igual; la foto seed apunta a un asset en `public/seed/` (aprobado por el usuario).
- **Header todo dinámico** (nombre, sala, niños, fecha) y **lista simple** sin secciones por día.
- **"Para: familia de {nombres} listados"** (uno o varios) y "Para: toda la sala".
- **Contadores `0/0` y "Editar" muerto** — `reactions`/`comments` no existen; se acepta la desviación visual contra el mockup.
- **Estados del diálogo "Publicando…" + error inline** — patrón consistente con SPEC 12 (`Enviando…`/error).
- **`post_photos.url` dual** (path de bucket o URL absoluta para el seed) — evita firmar la URL del asset estático.
- **Sala del staff resuelta como la sala "Soles" del daycare** (fallback: primera sala) — `users` no tiene `room_id`; en el escenario mockup hay una sola sala relevante.

**Descartadas:**
- Feed dinámico con agrupación por día ("PUBLICADO HOY" + secciones anteriores) — el usuario eligió lista simple.
- Notificaciones/email a los padres al publicar — spec futuro.
- Feed de familia por rol en este spec — spec futuro.
- Bucket público — expone fotos de niños; se rechazó por privacidad.
- Base64 en `post_photos` — no usa Storage, no recomendado.
- Validar `photo_consent` solo como advertencia — se bloquea.
- Sembrar `reactions`/`comments` para igualar los contadores del mockup — ampliaba el alcance; se eligió `0/0`.
- Mapear "Ánimo" a `activity` o quitar el tipo — el usuario eligió extender el enum.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| Comparación visual contra `feed.png` con diferencias esperadas (header real: nombre "Pablo" en vez de "Caro", fecha de hoy en vez de "martes 17 jun", contadores `0/0` en vez de `3/1`, `5/2`, `8/0`, foto real en vez del placeholder dashed) | Verificación estructural con Playwright; las desviaciones están documentadas y aceptadas. |
| `alter type … add value` puede fallar si el enum se usa en defaults/checks | `IF NOT EXISTS`; el enum no tiene usos previos. |
| Los INSERT de `post_children`/`post_photos` dependen de que `posts.room_id` sea del daycare | El staff siempre resuelve su sala; los posts de niños insertan `room_id` null y caen en la rama por `post_children` de la SELECT. |
| Signed URLs expiran (los `post_photos.url` guardan paths, no URLs firmadas) | Se firman al renderizar el feed; si expira, basta recargar. |
| `photo_consent` requiere tocar un seed para probar el bloqueo | Se prueba con un UPDATE temporal en la sesión de verificación, sin migración permanente. |
| Upload de archivos grandes en móvil | Límite 5MB por archivo y validación previa al upload. |
| Resolución de `child_id` por `full_name` colisiona si hay homónimos | Los nombres seed son únicos; se documenta la convención (patrón de SPEC 12). |

## What is **not** in this spec

- Editar/borrar posts.
- Detalle de publicación + comentarios/reacciones (contadores quedan en `0`).
- Feed de familia por rol.
- Notificaciones/emails al publicar.
- Cambios en el doc `07-DB-schema` ni migraciones ya aplicadas.

Cada uno de esos, si llega, va en su propio spec.
