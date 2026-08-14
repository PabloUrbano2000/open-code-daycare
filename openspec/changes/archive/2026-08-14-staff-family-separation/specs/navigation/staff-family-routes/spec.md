## Purpose

Separación de rutas y acceso por rol: el panel del staff vive bajo `/staff` y el de familia bajo `/family`, con guardas en el middleware y navegación acorde a cada rol.

## ADDED Requirements

### Requirement: Rutas del panel staff bajo /staff
El feed, la lista de niños y el perfil de niño del panel staff se sirven en `/staff`, `/staff/kids` y `/staff/kids/[slug]` respectivamente. Las rutas antiguas `/`, `/kids` y `/kids/[slug]` dejan de existir para usuarios autenticados (ver redirect de `/`).

#### Scenario: Feed del staff
- **WHEN** un usuario con rol `staff` navega a `/staff`
- **THEN** ve el feed staff (con botón "Nueva publicación")

#### Scenario: Gestión de niños
- **WHEN** un usuario con rol `staff` navega a `/staff/kids` o `/staff/kids/[slug]`
- **THEN** ve la gestión de niños y el perfil respectivamente

### Requirement: Ruta del panel familia /family
Existe `/family` con el feed de familia para usuarios con rol `parent`. Un staff autenticado no puede acceder a `/family` (es redirigido a `/staff`).

#### Scenario: Feed de familia
- **WHEN** un usuario con rol `parent` navega a `/family`
- **THEN** ve el feed de familia sin botón de publicar ni gestión

#### Scenario: Staff en /family
- **WHEN** un usuario con rol `staff` navega a `/family`
- **THEN** es redirigido a `/staff`

### Requirement: Un padre no accede a rutas del staff
Un usuario con rol `parent` que intenta acceder a `/staff`, `/staff/kids` o `/staff/kids/[slug]` es redirigido a `/family`.

#### Scenario: Padre en /staff
- **WHEN** un usuario con rol `parent` navega a `/staff`
- **THEN** es redirigido a `/family`

### Requirement: `/` resuelve por rol
La ruta raíz `/` redirige según el rol del usuario autenticado: `staff`→`/staff`, `parent`→`/family`. Sin sesión, cualquier ruta privada redirige a `/login`.

#### Scenario: Raíz con staff
- **WHEN** un usuario con rol `staff` navega a `/`
- **THEN** es redirigido a `/staff`

#### Scenario: Raíz con padre
- **WHEN** un usuario con rol `parent` navega a `/`
- **THEN** es redirigido a `/family`

#### Scenario: Sin sesión
- **WHEN** un usuario anónimo navega a `/`, `/staff`, `/staff/kids` o `/family`
- **THEN** es redirigido a `/login`

### Requirement: Post-login redirige al home del rol
Tras autenticarse, el usuario es llevado a su panel según su rol (staff→`/staff`, parent→`/family`).

#### Scenario: Login del padre
- **WHEN** un padre inicia sesión correctamente
- **THEN** es redirigido a `/family`

### Requirement: Navegación acorde al rol
El sidebar (desktop) y el header móvil muestran ítems según el rol: staff → Feed, Niños, Avisos, Mi cuenta (apuntando a rutas `/staff*`); familia → Feed y Mi cuenta (placeholder), sin acciones de publicación ni gestión.

#### Scenario: Navegación del staff
- **WHEN** un staff ve el sidebar o header móvil
- **THEN** ve los ítems del staff con links a `/staff`, `/staff/kids`, etc.

#### Scenario: Navegación de familia
- **WHEN** un padre ve el sidebar o header móvil
- **THEN** ve solo "Feed" (link a `/family`) y "Mi cuenta" (sin enlace funcional)