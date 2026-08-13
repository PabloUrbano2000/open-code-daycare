# SPEC 12 — Invitación de padre (código + email Resend) y registro en `/activate`

> **State:** Implementado
> **Depends on:** SPEC 05, SPEC 08, SPEC 09, SPEC 11
> **Date:** 2026-08-13
> **Objective:** Hacer que "Vincular padre" cree una invitación real (código único, vence en 7 días) en `public.invitations`, envíe un email vía Resend (React Email), y que `/activate` registre la cuenta del padre validando código + email, cree su auth user (Edge Function con service_role), lo vincule en `parent_children` y marque la invitación como aceptada, redirigiendo a `/login` con mensaje de éxito.

## Scope

**Incluye:**
- Migraciones Supabase (`supabase_apply_migration` + réplica local en `supabase/migrations/`):
  - `create_invitations_table`: `public.invitations` según el diccionario (id uuid PK default `gen_random_uuid()`; `child_id` uuid FK NOT NULL → children; `invited_by` uuid FK NOT NULL → users; `full_name` text NOT NULL; `email` text NOT NULL; `relationship` `relationship_type` NOT NULL; `code` text NOT NULL UNIQUE; `status` `invitation_status` NOT NULL default `pending`; `expires_at` timestamptz NOT NULL; `accepted_at` timestamptz nullable; `created_at` default `now()`), índices `invitations_child_id_idx` y `invitations_invited_by_idx` (best practice FK), RLS on.
  - `add_invitations_staff_policies`: policies INSERT (with check), UPDATE (using+check) y SELECT para `authenticated` staff del daycare que posee el child: `(select role from users where id = auth.uid()) = 'staff'` y `exists (select 1 from children c join rooms r on r.id = c.room_id where c.id = invitations.child_id and r.daycare_id = (select daycare_id from users where id = auth.uid()))`.
  - `create_parent_children_table`: `public.parent_children` según el diccionario (id uuid PK; `parent_id` uuid FK NOT NULL → users; `child_id` uuid FK NOT NULL → children; `relationship` `relationship_type` NOT NULL; `created_at`; UNIQUE (`parent_id`, `child_id`)), índice `parent_children_child_id_idx`, RLS on con **0 policies** (patrón SPEC 07/08; los INSERT los hace solo la Edge Function con service_role).
- Edge Function `activate-account` (`supabase_deploy_edge_function`, `verify_jwt=false` — autentica por código+email, no por JWT): recibe `{ code, email, password }`, valida la invitación (code upper, email lower, `status='pending'`, `expires_at > now()`), resuelve `daycare_id` del child (`children → rooms → daycares`), crea el auth user con `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { daycare_id, role: 'parent', full_name: invitation.full_name } })` (el trigger `handle_new_user` de SPEC 08 crea la fila `users`), inserta `parent_children` (parent_id = nuevo user, child_id, relationship de la invitación), actualiza la invitación → `accepted` + `accepted_at` (con guard `status='pending'` para evitar doble consumo). Fuente local en `supabase/functions/activate-account/index.ts` + `deno.json`.
- Server Action `inviteParent` en `app/kids/[slug]/actions.ts`: valida zod, genera código de 5 chars (charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` con `crypto.randomInt`), cancela pendientes previas del mismo child+email (`UPDATE ... status='cancelled'`), inserta la invitación (`invited_by = auth.uid()`, `expires_at = now() + 7 días`, `relationship` mapeado Mamá→mother / Papá→father / Tutor/a→guardian), y envía el email con `resend.emails.send({ from: EMAIL_FROM, to, subject, react: InvitationEmail({...}) })`. Si el email falla → marca la recién creada como `cancelled` y devuelve error.
- Plantilla React Email `emails/invitation.tsx` (paquete `react-email`, componente llamado como función, sin JSX en `.ts`): logo/sol, "Te invitaron a seguir a {kidName}", código destacado, "Vence en 7 días", botón link a `{NEXT_PUBLIC_APP_URL}/activate?email={encodeURIComponent(email)}`.
- Deps nuevas: `resend`, `react-email`. Env en `.env` + `.env.template`: `RESEND_API_KEY`, `EMAIL_FROM` (default `OpenDayCare <onboarding@resend.dev>`), `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`).
- `components/link-parent-dialog.tsx`: recibe `childId`; al submit válido llama `inviteParent`; estados **enviando → éxito** (muestra el código real generado + "Vence en 7 días", caja de código solo en este estado) / **error** (mensaje inline, modal abierto). Si `childId` es null → error "No se encontró el niño en la base de datos".
- `app/kids/[slug]/page.tsx`: resolver `childId` desde `children` (`select id ... eq('full_name', kid.name).single()`) y pasárselo al diálogo; el resto del perfil sigue hardcodeado.
- `app/activate/page.tsx` + `app/activate/actions.ts`: formulario real (client, RHF+zod): código (5 chars, a mano), email (prefill desde `?email=` de `searchParams`, editable), contraseña (≥6) y checkbox de consentimiento (gate de UI, no persiste). Server Action `activate` que hace `fetch` a `/functions/v1/activate-account`; éxito → `redirect('/login?activated=1')`; error → mensaje inline en español (código inválido / expirado / ya utilizado / email no coincide).
- `app/login/page.tsx`: banner de éxito cuando `searchParams.activated=1` ("Tu cuenta fue activada. Iniciá sesión.").
- `utils/supabase/middleware.ts`: ampliar `isPrivate` para proteger también `/kids/[slug]` (`pathname.startsWith('/kids/')`) → redirige a `/login` sin sesión.
- Verificación: estructura/policies/edge function, email (log/key de dev), activación end-to-end, `tsc`, lint, advisors, Playwright.

**No incluye:**
- La lista "PADRES VINCULADOS" del perfil con datos reales desde `parent_children` (sigue hardcodeada; spec futuro).
- El feed de familia (familia-feed) ni ruteo por rol — tras activar el padre va a `/login`.
- Reenvío del email desde una pantalla (solo se reenvía creando una invitación nueva desde el diálogo).
- Policies RLS SELECT/INSERT/UPDATE en `parent_children` (las SELECT van con el spec del feed de familia).
- "¿Olvidaste tu contraseña?" (sigue `href="#"`).
- Cambios en el doc `07-DB-schema` ni migraciones ya aplicadas.

## Data model

```sql
-- create_invitations_table
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children (id),
  invited_by   uuid not null references public.users (id),
  full_name    text not null,
  email        text not null,
  relationship public.relationship_type not null,
  code         text not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);

alter table public.invitations enable row level security;
```

```sql
-- add_invitations_staff_policies
create or replace function public.invitations_daycare_staff()
returns boolean language sql stable set search_path = public as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'staff'
  );
$$;

create policy "invitations_daycare_select"
  on public.invitations for select to authenticated
  using (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );

create policy "invitations_daycare_insert"
  on public.invitations for insert to authenticated
  with check (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );

create policy "invitations_daycare_update"
  on public.invitations for update to authenticated
  using (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  )
  with check (
    public.invitations_daycare_staff()
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = child_id
        and r.daycare_id = (select daycare_id from public.users where id = auth.uid())
    )
  );
```

```sql
-- create_parent_children_table
create table public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users (id),
  child_id     uuid not null references public.children (id),
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index parent_children_child_id_idx on public.parent_children (child_id);
alter table public.parent_children enable row level security;
```

```tsx
// emails/invitation.tsx (React Email, paquete react-email)
import { Html, Head, Preview, Body, Container, Heading, Text, Button } from "react-email";

export function InvitationEmail({ kidName, code, expiresLabel, activationUrl }: {
  kidName: string;
  code: string;
  expiresLabel: string;
  activationUrl: string;
}) {
  // "Te invitaron a seguir a {kidName}", código destacado, "Vence en 7 días",
  // botón link -> activationUrl ({NEXT_PUBLIC_APP_URL}/activate?email=...)
}
```

```ts
// Edge Function activate-account/index.ts (esquema)
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
// 1. invitation = select invitations(join children->rooms->daycares) by upper(code) y lower(email)
//    si !invitation -> { error: "invalid" }; status != 'pending' -> { error: "used" }; expires_at < now() -> { error: "expired" }
// 2. { data: user, error } = supabase.auth.admin.createUser({
//      email, password, email_confirm: true,
//      user_metadata: { daycare_id, role: "parent", full_name: invitation.full_name } })
// 3. insert parent_children { parent_id: user.id, child_id, relationship }
// 4. update invitations set status='accepted', accepted_at=now() where id=invitation.id and status='pending'
//    si rowCount === 0 -> { error: "used" }  // carrera: no duplicar
// 5. return { ok: true } | { error }
```

```ts
// Server Action inviteParent (app/kids/[slug]/actions.ts) — orden:
// 1. claims -> user.id (staff)  2. validar zod  3. generar code (crypto.randomInt)
// 4. update invitations set status='cancelled' where child_id=? and lower(email)=lower(?) and status='pending'
// 5. insert invitation (invited_by=user.id, expires_at=now()+7d, relationship mapeado)
// 6. resend.emails.send({ from: EMAIL_FROM, to: email, subject, react: InvitationEmail({...}) })
//    si error -> update la recién creada a 'cancelled' y return { error }
// 7. return { code, expiresAt }
```

Convenciones:
- Código de 5 chars en charset sin ambiguos (0/O/1/I); la colisión se resuelve regenerando (probabilidad ínfima) y la UNIQUE la garantiza.
- El envío del email se hace desde Next.js (paquete `resend`, prop `react`); la Edge Function NO envía emails.
- `invitations` la gestiona solo el staff de la guardería del niño vía RLS; `parent_children` solo se escribe desde la Edge Function (service_role); el consumo de la invitación nunca expone `invitations` a `anon`.
- Mapeo de parentesco: `Mamá→mother`, `Papá→father`, `Tutor/a→guardian` (enums del diccionario).
- Con `RESEND_API_KEY` de desarrollo (`onboarding@resend.dev`) el email solo llega al email verificado de la cuenta; en dev se valida el flujo por la invitación creada en DB + el código mostrado.

## Implementation plan

1. **Aplicar migración** `create_invitations_table` (`supabase_apply_migration`). Estado funcional: `invitations` existe, RLS on.
2. **Aplicar migración** `add_invitations_staff_policies`. Estado funcional: el staff de la guardería del niño puede SELECT/INSERT/UPDATE invitaciones de sus niños.
3. **Aplicar migración** `create_parent_children_table`. Estado funcional: `parent_children` existe con UNIQUE y RLS on.
4. **Replicar** las 3 migraciones como `supabase/migrations/<version>_*.sql` con los `<version>` de `supabase_list_migrations`.
5. **Edge Function** — crear `supabase/functions/activate-account/index.ts` + `deno.json` y desplegarla con `supabase_deploy_edge_function` (`verify_jwt=false`). Estado funcional: se puede probar con curl con un código válido.
6. **Deps + env** — `npm i resend react-email`; añadir `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL` a `.env` y `.env.template`.
7. **Email template** — crear `emails/invitation.tsx` (React Email).
8. **Server Action `inviteParent`** — crear `app/kids/[slug]/actions.ts` (código, cancelar pendientes, insertar, enviar, rollback si el email falla).
9. **Diálogo** — `components/link-parent-dialog.tsx`: `childId` prop + estados enviando/éxito (código real + "Vence en 7 días")/error.
10. **`app/kids/[slug]/page.tsx`** — resolver `childId` desde `children` y pasarlo al diálogo.
11. **`/activate`** — reescribir `app/activate/page.tsx` (form real, prefill `?email=`) + crear `app/activate/actions.ts` que llama la Edge Function.
12. **`/login`** — banner de éxito con `?activated=1`.
13. **Middleware** — ampliar `isPrivate` en `utils/supabase/middleware.ts` a `/kids/*`.
14. **Verificación** — `supabase_list_migrations`/`list_tables`/`pg_policies`, curl a la Edge Function, `npx tsc --noEmit`, `npm run lint`, `supabase_get_advisors(security)`, y Playwright: login staff → invitar (código en diálogo, invitación pending en DB) → `/activate?email=...` con el código → redirect `/login?activated=1` → login con el nuevo padre → errores (código inválido/expirado/usado/email no coincide), regresión del resto.

## Acceptance criteria

- [ ] `supabase_list_migrations` incluye `create_invitations_table`, `add_invitations_staff_policies` y `create_parent_children_table`; existen los 3 `.sql` locales con el mismo version.
- [ ] `invitations` tiene las columnas del diccionario, índices `child_id`/`invited_by`, `code` UNIQUE, RLS on y 3 policies (insert/update/select) scoped al daycare del staff.
- [ ] `parent_children` tiene UNIQUE (`parent_id`,`child_id`), índice `child_id`, RLS on y 0 policies.
- [ ] La Edge Function `activate-account` está desplegada con `verify_jwt=false`; su fuente está en `supabase/functions/activate-account/`.
- [ ] Con `pablo@google.com`, en `/kids/mateo-fernandez` el diálogo crea una invitación `pending` con código de 5 chars, `expires_at ≈ now()+7d`, `relationship` correcto e `invited_by = pablo`. Reenviar el mismo email cancela la pendiente anterior y crea una nueva con código distinto.
- [ ] El email se intenta enviar con `resend.emails.send` y la plantilla `InvitationEmail`; en dev sin dominio el fallo del envío marca la invitación `cancelled` y el diálogo muestra el error (con key de dev verificable por log de Resend).
- [ ] `link-parent-dialog` muestra el código real generado + "Vence en 7 días" tras enviar, y el botón muestra "Enviando…" mientras espera.
- [ ] `/activate?email=lucia@gmail.com` pre-completa EMAIL; el código se tipea a mano; contraseña <6 o checkbox sin marcar → error sin llamar la Edge Function.
- [ ] Activar con código+email válidos crea el auth user (`email_confirm: true`), la fila en `users` vía trigger (`role='parent'`, `full_name` de la invitación, `daycare_id` del child), el `parent_children` y la invitación `accepted` con `accepted_at`; redirige a `/login?activated=1`.
- [ ] Código inválido → "Código inválido"; expirado → "El código expiró"; ya utilizado → "La invitación ya fue utilizada"; email que no coincide → "El email no coincide con la invitación"; ninguno crea usuario.
- [ ] `/login?activated=1` muestra el banner de éxito.
- [ ] Sin sesión, `/kids/mateo-fernandez` redirige a `/login`.
- [ ] `npx tsc --noEmit` y `npm run lint` pasan; `supabase_get_advisors(security)` sin hallazgos nuevos.
- [ ] No se tocó `app/kids/data.ts`, el doc `07-DB-schema` ni migraciones ya aplicadas.

## Decisions taken and discarded

**Adoptadas:**
- Registro en `/activate` vía **Edge Function con service_role** (auth por código+email, `verify_jwt=false`) — `admin.createUser` con email confirmado; la service key nunca sale de Supabase.
- Tras activar → **`/login?activated=1`** con banner de éxito — el feed de familia por rol es otro spec.
- `child_id` resuelto en `[slug]` page por `full_name = kid.name` — el perfil sigue hardcodeado (SPEC 11).
- Diálogo con **estado de éxito mostrando el código real** — la caja de código solo aparece tras enviar (se desvía del mockup que la muestra estática antes; el mockup no tiene backend).
- Email con **React Email + `resend` npm desde Next.js** (prop `react`); key de desarrollo resend.dev, env-driven (`RESEND_API_KEY`/`EMAIL_FROM`/`NEXT_PUBLIC_APP_URL`).
- Reenvío: **cancelar la pendiente anterior del mismo child+email** y crear una nueva.
- Link del email **prefill `?email=`**; el código se tipea a mano (no viaja en el link).
- Checkbox de consentimiento como **gate de UI** (no persiste; no hay campo en users/parents).
- Proteger **`/kids/*`** en el middleware.
- `parent_children` con RLS on y 0 policies (patrón SPEC 07/08); solo la Edge Function la escribe.
- `invitations` con policies staff-only (por role + scoping al daycare del child) — el invite exige staff logueado.
- Consumo atómico de la invitación (`UPDATE ... where status='pending'` + UNIQUE) para no duplicar cuentas.
- Mapeo de parentesco a los enums del diccionario (mother/father/guardian).

**Descartadas:**
- `signUp` público con confirmación por email — requiere doble confirmación y complica el vínculo con la invitación.
- Server Action con `SUPABASE_SERVICE_ROLE_KEY` en Next — la service key quedaría en la app; se prefiere en la Edge Function.
- Plantilla HTML string sin React Email — el usuario eligió React Email.
- Prefill del código en el link — reduce seguridad.
- Persistir el consentimiento en `children.photo_consent` — no lo pidió el usuario y no hay campo de padres.
- Migrar `/kids/[slug]` completo a datos reales — se queda para cuando exista `parent_children` con lectura.
- Policies RLS en `parent_children` — van con el spec del feed de familia.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| resend.dev solo envía al email de la cuenta en dev | El flujo se valida por la invitación creada en DB + el código mostrado; el email queda env-driven para rotar a dominio verificado. |
| Colisión del código de 5 chars (UNIQUE) | Regenerar en la acción (probabilidad ínfima). |
| Edge Function sin JWT (`verify_jwt=false`) | Autenticación propia por código+email; código aleatorio, expira en 7 días, se consume al usarse (estado `accepted`). |
| Carrera al activar el mismo código dos veces | UPDATE con guard `status='pending'` + UNIQUE (`parent_id`,`child_id`) → el segundo intento devuelve "ya utilizada". |
| `handle_new_user` exige `daycare_id` en metadata | La Edge Function lo resuelve del child; si el child no tiene room/daycare → error controlado. |
| El trigger `handle_new_user` crea `users` con el `full_name` de la metadata | Se pasa el `full_name` de la invitación. |
| La acción de invitar la dispara un no-staff | La policy exige `role='staff'` + sesión (middleware `/kids/*`); un `parent` no puede insertar. |

## What is **not** in this spec

- Lista "PADRES VINCULADOS" con datos reales desde `parent_children`.
- Feed de familia / ruteo por rol (el padre aterriza en `/login`).
- Reenvío del email desde una pantalla.
- Policies RLS de lectura de `parent_children`.
- "¿Olvidaste tu contraseña?" funcional.
- Cambios en el doc `07-DB-schema`.

Cada uno de esos, si llega, va en su propio spec.
