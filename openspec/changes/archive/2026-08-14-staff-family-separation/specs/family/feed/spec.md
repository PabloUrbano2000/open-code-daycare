## Purpose

Pantalla `/family`: el feed de los padres con selector de hijo, limitado por RLS a los posts de sus hijos y anuncios de su sala, en modo solo lectura.

## ADDED Requirements

### Requirement: Cabecera del feed de familia
`/family` muestra un saludo con el nombre del usuario ("Hola, {nombre}"), el nombre de la sala de sus hijos y la fecha actual.

#### Scenario: Cabecera dinámica
- **WHEN** un padre entra a `/family`
- **THEN** ve el saludo con su nombre, la sala y la fecha

### Requirement: Selector de hijo por chips
El feed muestra un chip por cada hijo vinculado y un chip "Todos". Elegir un hijo filtra los posts a los de ese hijo; "Todos" muestra todos los posts visibles.

#### Scenario: Filtrar por hijo
- **WHEN** el padre selecciona el chip de un hijo
- **THEN** solo se muestran los posts en los que ese hijo está etiquetado (no los de otros hijos ni anuncios de otros niños)

#### Scenario: Todos
- **WHEN** el padre selecciona el chip "Todos"
- **THEN** se muestran todos los posts visibles para él (de todos sus hijos + anuncios de su sala)

### Requirement: Cards de post de familia
Cada post muestra el avatar del niño (o icono para anuncios), el badge por tipo, la hora, el autor ("Maestra {nombre}") y "Para: familia de …" / "Para: toda la sala", y las fotos si tiene. No incluye acciones de edición ni botón de nueva publicación.

#### Scenario: Card sin acciones de staff
- **WHEN** un padre ve un post en `/family`
- **THEN** la card no muestra enlace "Editar" ni opciones de publicación, y muestra el autor en vez de "publicado por vos"

#### Scenario: Anuncio en el feed
- **WHEN** existe un anuncio de la sala de los hijos del padre
- **THEN** el anuncio aparece en el feed de familia con icono de anuncio

### Requirement: Estado vacío
Cuando no hay posts visibles, el feed muestra un mensaje de estado vacío.

#### Scenario: Feed sin publicaciones
- **WHEN** un padre entra a `/family` y no tiene posts visibles
- **THEN** ve un mensaje de "todavía no hay publicaciones"