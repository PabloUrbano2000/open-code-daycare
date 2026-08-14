## 1. Base de datos — RLS por rol y seed

- [x] 1.1 Aplicar y replicar migración `add_role_helper_functions` (`is_staff()`/`is_parent()`)
- [x] 1.2 Aplicar y replicar migración `add_role_based_select_policies` (pares staff/parent en posts, post_children, post_photos, children + parent_children_parent_select)
- [x] 1.3 Aplicar y replicar migración `tighten_post_photos_storage_select` (storage por rol delegando a posts)
- [x] 1.4 Aplicar y replicar migración `seed_family_parent` (Lucía + 2 vínculos)
- [x] 1.5 Verificar RLS con consultas readonly por claims (staff: todo; Lucía: solo sus posts/hijos + anuncio de Soles; post de otro niño invisible) y `supabase_get_advisors(security)`

## 2. Rutas del staff bajo /staff

- [x] 2.1 Mover `app/page.tsx` → `app/staff/page.tsx` y `app/kids/*` → `app/staff/kids/*` actualizando imports y metadata
- [x] 2.2 Actualizar links en `components/sidebar.tsx` y `components/mobile-header.tsx` a rutas `/staff*`

## 3. Middleware por rol

- [x] 3.1 Guardas por rol en `proxy.ts`/`utils/supabase/middleware.ts` consultando `users.role` (no claims user_metadata): `/staff*` exige staff, `/family` exige parent, redirects cruzados
- [x] 3.2 `/` redirige por rol (staff→`/staff`, parent→`/family`, anón→`/login`); `/login` con sesión → home del rol

## 4. Feed de familia

- [x] 4.1 Builder `getFamilyFeed()` (contexto con saludo/sala/fecha, hijos del padre, posts visibles con autor)
- [x] 4.2 `app/family/page.tsx` (cabecera + chips + lista de cards)
- [x] 4.3 Componente cliente de chips (hijos + "Todos") con filtrado por hijo
- [x] 4.4 Card de post de familia (avatar/badge/hora/autor/"Para:", fotos, sin "Editar") + estado vacío
- [x] 4.5 Navegación de familia (Feed → `/family`, Mi cuenta placeholder `#`) en sidebar y header móvil por rol

## 5. Verificación

- [x] 5.1 `npx tsc --noEmit` y `npm run lint` sin errores
- [x] 5.2 Playwright: login Lucía → `/family` (chips filtran), login Pablo → `/staff`/`/staff/kids` intactos, guards cruzados (staff en `/family` → `/staff`; parent en `/staff` → `/family`; anón → `/login`)
- [x] 5.3 Regresión: feed staff muestra las 4 publicaciones con fotos; advisors sin hallazgos nuevos