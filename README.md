# Open DayCare

Aplicación web de gestión de guarderías construida con **Next.js 16** + **React 19** + **Tailwind CSS v4** (App Router) y backend en **Supabase**. El copy de UI y los mockups están en español (ver `references/pantallas/`).

## Requisitos previos

- **Node.js 20 o superior**
- **npm**

> Docker y el CLI de Supabase son opcionales: solo se necesitan si vas a trabajar con la pila local de Supabase o con migraciones vía CLI (ver [Supabase CLI](#supabase-cli)).

## Configuración

1. Instalar dependencias:

```bash
npm install
```

2. Crear el archivo de variables de entorno a partir de la plantilla:

```bash
cp .env.template .env
```

3. Completar las variables en `.env`:

| Variable | Dónde obtenerla |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (publishable key) |
| `SUPABASE_DB_PASSWORD` | Contraseña de la base de datos del proyecto |
| `RESEND_API_KEY` | Resend → API Keys |
| `EMAIL_FROM` | Remitente de los correos (por defecto `OpenDayCare <onboarding@resend.dev>`) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (por defecto `http://localhost:3000`) |

> `.env` está en `.gitignore`. Nunca subas secretos ni la publishable key al repositorio.

## Levantar el proyecto

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Otros comandos

```bash
npm run lint        # ESLint
npx tsc --noEmit    # Typecheck
npm run build       # Build de producción
```

## Backend (Supabase)

El backend de esta app es **Supabase** (proyecto `qgxexqucxfmfihkpsish`). Las migraciones viven en `supabase/migrations/` y las Edge Functions en `supabase/functions/`. El esquema de referencia está documentado en `07-DB-schema`.

Las credenciales se consumen desde el código con los helpers de `utils/supabase/` (`server.ts`, `client.ts`, `middleware.ts`) usando `@supabase/supabase-js` y `@supabase/ssr`.

### Supabase CLI

Para que cada miembro del equipo pueda autenticarse y operar sobre el proyecto con el CLI:

1. **Instalar el CLI**:

```bash
brew install supabase/tap/supabase
# o como dependencia del proyecto
npm install -D supabase
```

2. **Iniciar sesión**. El CLI se autentica con un *personal access token* de tu cuenta:

```bash
supabase login
```

Genera tu token en [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) y pégalo en el prompt. El token queda guardado de forma segura en el credential store nativo del sistema (o en `~/.supabase/access-token` si no hay credential store disponible).

3. **Verificar la sesión**:

```bash
supabase projects list
```

Para **CI/CD o entornos sin interacción**, en lugar de `supabase login` se usa la variable de entorno `SUPABASE_ACCESS_TOKEN` con el token de una cuenta de bot.

**Vincular el proyecto** (requerido para comandos como `db push`, `db pull` o `migration list`):

```bash
supabase link --project-ref qgxexqucxfmfihkpsish
```

### MCP de Supabase

Este repo usa el **MCP remoto de Supabase** (configurado en `opencode.json`) apuntando al proyecto `qgxexqucxfmfihkpsish`.

**Autenticar el MCP.** La autenticación es **OAuth 2.1**: hay que autenticar el servidor MCP antes de que las herramientas queden disponibles. Con opencode:

```bash
opencode mcp auth supabase
```

El comando abre el flujo de login en el navegador; al completarlo, la sesión queda autorizada para el servidor `supabase`. Si las herramientas no aparecen después de autenticar, recarga la sesión del agente.