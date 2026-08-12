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

## MCPs
- Playwright: screenshots y cualquier artefacto de Playwright van en `.playwright-mcp` (gitignored).
- Context7: usar para traer la documentación actualizada del framework.

## Spec Driven Development. - Skills
- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta habilidad para hacer las implementaciones.

## Reglas de código
- Usar código limpio, nombres de variables, funciones, etc, en inglés.