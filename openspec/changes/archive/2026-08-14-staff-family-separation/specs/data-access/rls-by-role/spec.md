## Purpose

Acceso de lectura por rol en Supabase: el staff ve todo su daycare y el padre solo el contenido de sus hijos más los anuncios de su sala. Incluye el seed del padre de prueba.

## ADDED Requirements

### Requirement: El staff lee todo su daycare
El staff autenticado de un daycare puede leer todos los posts, destinatarios, fotos y niños de sus salas (mismo alcance que hoy).

#### Scenario: Feed completo del staff
- **WHEN** un usuario con rol `staff` consulta `posts`, `post_children`, `post_photos` o `children` de su daycare
- **THEN** obtiene todas las filas del daycare (posts de todas las salas, todos los niños)

### Requirement: El padre lee solo posts de sus hijos y anuncios de su sala
Un usuario con rol `parent` solo puede leer posts etiquetados con alguno de sus hijos vinculados, o anuncios de una sala a la que pertenezca alguno de sus hijos. No puede leer posts de otros niños.

#### Scenario: Post de un hijo propio
- **WHEN** un padre consulta `posts` y existe un post etiquetado con uno de sus hijos
- **THEN** el post es visible, junto con sus `post_children` y `post_photos`

#### Scenario: Post de otro niño
- **WHEN** un padre consulta `posts` y existe un post etiquetado solo con un niño que no le está vinculado
- **THEN** el post no es visible ni sus fotos

#### Scenario: Anuncio de la sala
- **WHEN** un padre consulta `posts` y existe un post de tipo `announcement` en la sala de uno de sus hijos
- **THEN** el anuncio es visible

#### Scenario: Anuncio de otra sala
- **WHEN** un padre consulta `posts` y existe un anuncio de una sala sin hijos suyos
- **THEN** el anuncio no es visible

### Requirement: El padre lee solo sus niños vinculados
Un padre solo puede leer de `children` los niños con los que tiene un vínculo en `parent_children`.

#### Scenario: Hijos propios
- **WHEN** un padre consulta `children`
- **THEN** obtiene únicamente los niños vinculados a él

### Requirement: El padre lee sus propios vínculos
Un padre puede leer solo sus filas de `parent_children`; no las de otros padres.

#### Scenario: Vínculos propios
- **WHEN** un padre consulta `parent_children`
- **THEN** obtiene únicamente sus filas (`parent_id = auth.uid()`)

### Requirement: Las fotos del bucket siguen la visibilidad de los posts
Un padre solo puede firmar/leer objetos del bucket `post-photos` que pertenezcan a posts visibles para él; el staff sigue leyendo todo su daycare.

#### Scenario: Firma de foto visible
- **WHEN** un padre solicita una URL firmada de una foto de un post visible para él
- **THEN** la firma se genera correctamente

#### Scenario: Firma de foto no visible
- **WHEN** un padre solicita una URL firmada de una foto de un post no visible para él
- **THEN** la operación falla (sin URL)

### Requirement: Policies de escritura del staff intactas
Las policies de INSERT de `posts`/`post_children`/`post_photos`/`invitations` siguen restringidas al staff del daycare; un padre no puede insertar.

#### Scenario: Un padre no publica
- **WHEN** un usuario con rol `parent` intenta insertar en `posts`, `post_children` o `post_photos`
- **THEN** RLS lo rechaza

### Requirement: Seed del padre de prueba
Existe el usuario padre `lucia.fernandez@gmail.com` (Lucía Fernández), con `role='parent'`, `daycare_id` de la Guardería Sala Soles, vinculado como `mother` de Mateo Fernández y Sofía Méndez, y con login funcional.

#### Scenario: Login del padre
- **WHEN** se inicia sesión con `lucia.fernandez@gmail.com`
- **THEN** autentica y su fila en `users` tiene `role='parent'` y sus vínculos en `parent_children` a Mateo y Sofía