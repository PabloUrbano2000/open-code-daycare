# SPEC 09 — Login real `/login`, protección de rutas y logout

> **State:** Implementado
> **Depends on:** SPEC 08
> **Date:** 2026-08-13
> **Objective:** Hacer que `/login` autentique de verdad contra Supabase Auth (email + contraseña con `signInWithPassword`), proteger las rutas privadas `/` y `/kids` redirigiendo a `/login` cuando no hay sesión, redirigir a `/` cuando ya hay sesión en `/login`, permitir cerrar sesión, y mostrar en el sidebar el perfil real leído de la tabla `users`.

## Scope

**Incluye:**
- Migración `add_users_self_read_policy` en Supabase: policy RLS `SELECT` en `public.users` para `authenticated` con `using (auth.uid() = id)` (cada usuario lee su propia fila). Replicada como archivo local `supabase/migrations/<version>_add_users_self_read_policy.sql`.
- `proxy.ts`: en `updateSession`, las rutas privadas (`/`, `/kids`) sin sesión → `redirect('/login')`; y `/login` con sesión → `redirect('/')`.
- `app/login/actions.ts` (Server Action `login`) + `app/login/page.tsx`: formulario controlado de email + contraseña que llama `supabase.auth.signInWithPassword` con el client server, muestra error inline si falla y redirige a `/` al éxito. Se elimina el toggle estático "Personal/Familia".
- `app/logout/actions.ts` (Server Action `logout`): `supabase.auth.signOut()` + `redirect('/login')`.
- `components/sidebar.tsx`: se vuelve async server component que lee `full_name` y el rol del usuario autenticado desde `users` y los muestra en lugar del "Caro Giménez · Maestra" hardcodeado; el botón `LogOut` pasa a ser un submit de formulario que llama la acción `logout` (funcional, ya no `href="#"`).

**No incluye:**
- El flujo de `/activate` (activación de cuenta por invitación) — va en su propio spec.
- "¿Olvidaste tu contraseña?" funcional (sigue `href="#"`).
- Registro/signup de nuevos usuarios.
- Policies RLS de otros recursos (`daycares`, `posts`, etc.).

## Data model

```sql
-- add_users_self_read_policy
create policy "users_self_select"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);
```

Convenciones:
- Policy mínima (SELECT de la propia fila) — necesaria porque `users` tiene RLS on y 0 policies (default deny) y el sidebar necesita leer `full_name`/`role` del usuario logueado.
- `auth.uid() = id` → cada `authenticated` solo ve su propia fila; sin IDOR.
- No hay columnas nuevas: se reutiliza el modelo de SPEC 08 (`users.full_name`, `users.role`, `users.status`, `users.daycare_id`).
- El logout no introduce datos: solo `signOut()` de auth.

## Implementation plan

1. **Migración RLS** — aplicar `add_users_self_read_policy` con `supabase_apply_migration`; replicar como `supabase/migrations/<version>_add_users_self_read_policy.sql` con el `<version>` de `supabase_list_migrations`. Estado funcional: `authenticated` puede leer su propia fila de `users`.
2. **Server Action de login** — crear `app/login/actions.ts` con `login(formData)` (`'use server'`) que crea el client server (`createClient(await cookies())`), llama `supabase.auth.signInWithPassword({ email, password })`, y devuelve `{ error }` si falla o `redirect('/')` al éxito.
3. **`app/login/page.tsx`** — convertir el formulario en controlado (Client Component): quitar el toggle "Personal/Familia", dejar solo EMAIL + CONTRASEÑA, submit con `<form action={login}>`, mostrar el mensaje de error devuelto por la action si lo hay. El CTA "Iniciar sesión" pasa a `type="submit"`. "Activá tu cuenta" sigue a `/activate`; "¿Olvidaste tu contraseña?" sigue `#`.
4. **Server Action de logout** — crear `app/logout/actions.ts` con `logout()` (`'use server'`) que llama `supabase.auth.signOut()` y luego `redirect('/login')`.
5. **`proxy.ts`** — en `updateSession`, tras `getClaims()`: si la ruta es privada (`/`, `/kids`) y no hay usuario → `redirect('/login')`; si la ruta es `/login` y hay usuario → `redirect('/')`.
6. **`components/sidebar.tsx`** — volverlo async server component: leer `supabase.auth.getUser()` para el `user.id`, luego `supabase.from('users').select('full_name, role').eq('id', user.id).single()`, y renderizar `full_name` y un label de rol (staff → "Maestra", parent → "Familia") en el bloque inferior. El avatar mantiene la inicial del `full_name`. El botón `LogOut` se envuelve en un `<form action={logout}>` con `type="submit"` (deja de ser un `Link href="#"`).
7. **Verificación** — `npx tsc --noEmit`, `npm run lint`, `supabase_get_advisors(security)`, y Playwright: login correcto/incorrecto, redirecciones `/`↔`/login`, logout, perfil dinámico en sidebar, regresión de `/kids`.

## Acceptance criteria

- [x] `supabase_list_migrations` incluye `add_users_self_read_policy` y existe `supabase/migrations/<version>_add_users_self_read_policy.sql` con el mismo SQL/version.
- [x] `pg_policies` tiene 1 policy SELECT en `users` para `authenticated` con `using (auth.uid() = id)`.
- [x] Sin sesión, `/` y `/kids` redirigen a `/login`; con sesión, `/login` redirige a `/`.
- [x] Loguear con `pablo@google.com` / `ElMaldy123@` autentica y redirige a `/`.
- [x] Credenciales incorrectas muestran un error inline en `/login` (no redirigen).
- [x] El login ya no muestra el toggle "Personal/Familia"; solo EMAIL + CONTRASEÑA + CTA submit.
- [x] El sidebar muestra `full_name` ("Pablo") y el label de rol del usuario logueado (no "Caro Giménez · Maestra").
- [x] El avatar del sidebar usa la inicial del `full_name` real.
- [x] Al hacer click en "Cerrar sesión" se ejecuta `signOut()` y redirige a `/login`; después de loguear, `/` vuelve a redirigir a `/login`.
- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [x] `supabase_get_advisors(security)` no reporta hallazgos nuevos en `users`.
- [x] `/kids` no cambia visualmente (regresión) más allá del nombre dinámico del sidebar.

## Decisions taken and discarded

**Adoptadas:**
- `signInWithPassword` real contra Supabase Auth — el usuario eligió autenticación real; el seed de SPEC 08 (`pablo@google.com`) es el usuario de prueba.
- Protección de rutas en `proxy.ts` (middleware) — el usuario eligió redirección centralizada en el middleware; sin duplicar guardas `getClaims()` en cada server component.
- Eliminar el toggle "Personal/Familia" del login — el rol se resuelve de la sesión/`users`, no de un toggle; el login es solo email+contraseña.
- Perfil del sidebar desde la fila `users` — el usuario eligió leer la fila real; requiere la policy RLS `users_self_select` (default deny lo bloqueaba).
- Logout funcional con `signOut()` vía Server Action — el usuario lo pidió incluir en este spec; el botón del sidebar pasa a ser submit del form.
- Error inline en el formulario (no `throw`) — el client recibe `{ error }` de la Server Action y lo muestra; evita que Next muestre el error boundary.
- Server Action con client server (`createClient(await cookies())`) — patrón estándar de `@supabase/ssr`; `setAll` de `server.ts` funciona en Server Actions.

**Descartadas:**
- Protección solo con `getClaims()` en cada server component — el usuario eligió el middleware centralizado.
- Toggle funcional Personal/Familia — el rol sale de la sesión.
- Leer `full_name` de `user_metadata` (sin tocar DB) — el usuario eligió leer la fila de `users`.
- Policy de SELECT amplia (ver filas de su daycare) — se limita a `auth.uid() = id` (propia fila); leer compañeros de daycare va con las policies de dominio.
- Logout con `useRouter().refresh()`/`useRouter().push()` en cliente — se hace con `redirect` en la Server Action.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| `signInWithPassword` desde Server Action: el cookie `setAll` de `server.ts` captura errores pensados para Server Components | En Server Actions `setAll` sí escribe cookies; patrón estándar verificado en docs de `@supabase/ssr`. |
| El sidebar era síncrono; al volverse async puede afectar el render de las páginas | Se mantiene el mismo contrato de props (`activeItem`); el fetch se resuelve en el server component. |
| Lectura de `users` con RLS: si la policy falla, el sidebar no muestra nombre | Se verifica la policy con login real + advisors; el fallback es dejar el bloque vacío (sin romper la página). |
| El rol del usuario seed es `staff` y su `full_name` es "Pablo" → el sidebar ya no muestra "Caro Giménez" | Cambio esperado y deseado: el nombre pasa a ser el del usuario logueado. |

## What is **not** in this spec

- Activación de cuenta `/activate` (invitación).
- "¿Olvidaste tu contraseña?" funcional.
- Registro/signup de nuevos usuarios.
- Policies RLS de otros recursos (daycares, posts, children, etc.).

Cada uno de esos, si llega, va en su propio spec.
