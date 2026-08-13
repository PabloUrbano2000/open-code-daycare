<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# open-daycare

Next.js 16.3.0 + React 19 + Tailwind CSS v4 (App Router). UI copy and design mockups are in Spanish.

## Commands
- `npm run dev` — dev server (localhost:3000)
- `npm run lint` — eslint only
- `npx tsc --noEmit` — typecheck (no npm script exists; run it, then lint)
- No test framework installed.

## Conventions
- `@/*` path alias maps to the repo root (e.g. `@/app/...`).
- Tailwind v4: no `tailwind.config.*` — theme tokens are defined via `@theme inline` in `app/globals.css`.
- `references/pantallas/*.dc.html` (+ `references/screenshots/`) are the visual UI spec for the daycare app; `support.js` there is generated — do not edit.
- Large features use the spec-driven workflow via the repo-local `spec` / `spec-impl` skills (`.agents/skills/`); specs are saved to `specs/`.
- **Specs that touch the database go in `specs/db/`** — if a spec involves Supabase (schema, tablas, migraciones, RLS, triggers, enums, seeds) it is saved to `specs/db/NN-slug.md`, not `specs/`. The numbering is sequential across both folders (the last DB spec was 08, so the next one is 09). Specs that only touch UI/code go in `specs/`.

## MCPs
- Playwright: screenshots y cualquier artefacto de Playwright van en `.playwright-mcp` (gitignored).
- Context7: usar para traer la documentación actualizada del framework.
- Supabase: usar para todo lo relacionado con el backend (MCP tools; ver también la skill `supabase`).

## Supabase / Backend
- El backend de esta app es Supabase. El esquema de base de datos (tablas, columnas, RLS) está documentado en `07-DB-schema` (referencia externa, no implementado aún).
- Usar la skill `supabase` para cualquier tarea que toque Supabase (DB, Auth, Edge Functions, Realtime, Storage, RLS, logs…).
- Cargar la skill `supabase-postgres-best-practices` ANTES de escribir o modificar cualquier esquema/migración/query en Postgres.
- **Toda manipulación del esquema o de la base de datos se hace SIEMPRE vía migraciones aplicadas con `supabase_apply_migration`** — nunca por `supabase_execute_sql` ad-hoc cuando el cambio toca DDL o seeder datos. `supabase_execute_sql` queda solo para consultas/inspectos readonly (verificaciones, SELECT, EXPLAIN). Si un cambio amerita persistir, va como migración.
- Cada migración aplicada se replica como archivo local en `supabase/migrations/<version>_<name>.sql` con el MISMO `<version>` que reporta `supabase_list_migrations`, para mantener el histórico en el repo sin drift. No se editan ni renumeran migraciones ya aplicadas; los cambios nuevos van en migraciones nuevas.
- Cambios de esquema (DDL) se aplican con `supabase_apply_migration`; consultas ad-hoc con `supabase_execute_sql`. RLS debe estar habilitado en todas las tablas expuestas.

## Spec Driven Development. - Skills
- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta habilidad para hacer las implementaciones.
- /supabase (`.agents/skills/supabase`) Cargar en cualquier tarea que involucre Supabase.
- /supabase-postgres-best-practices (`.agents/skills/supabase-postgres-best-practices`) Cargar antes de tocar esquemas, migraciones, RLS o queries en Postgres.

## Reglas de código
- Usar código limpio, nombres de variables, funciones, etc, en inglés.