# SPEC 06 — Diálogo "Nueva publicación" (modal)

**State:** Aprobado
**Depends on:** SPEC 01, SPEC 04, SPEC 05
**Date:** 2026-08-12
**Objective:** Implementar el diálogo modal "Nueva publicación" accionado desde el botón homónimo del sidebar, el botón Plus del header móvil y la tarjeta compositora del feed, con pills de destinatario (niños de Sala Soles o "Toda la sala") y de tipo, textarea de descripción validada por Zod y sección de fotos estática, cuyo "Publicar" valida y cierra sin persistir.

## Scope

**Incluye:**
- `components/new-post-dialog.tsx` (nuevo, cliente): `NewPostDialog({ children })` con `Dialog.Root` controlado (`open`/`onOpenChange`) y `Dialog.Trigger asChild` que envuelve `children` (los disparadores se pasan como props, así el sidebar sigue siendo server component). `Portal`/`Overlay`/`Content` en panel `w-[calc(100vw-32px)] max-w-[580px]` sobre `bg-auth-bg` (`rounded-[24px]`, `border-line`, sombra `0 20px 50px -24px rgba(63,54,46,.35)`). El `<form>` envuelve header y body.
- Header: `Dialog.Title` "Nueva publicación" (Fredoka 18px semibold) centrado, `Dialog.Close` asChild "Cancelar" a la izquierda (15px, 700, `text-ink-muted`) y botón "Publicar" `type="submit"` a la derecha (15px, extrabold, `text-coral-brand`).
- Body: sección PARA con pills de destinatario (`NEW_POST_TARGETS` = "Toda la sala" + slugs de `kids`), sección TIPO con 7 pills de tipo, sección DESCRIPCIÓN con textarea y sección FOTOS con dos tiles (miniatura placeholder + "Agregar" decorativo).
- Form react-hook-form + `zodResolver`: `newPostSchema` con `targets` (array de slugs, required, min 1, error "Elegí al menos un destinatario"), `type` (enum de tipos), `description` (required, min 1, error "Escribí una descripción"). `defaultValues: { targets: ["mateo-fernandez"], type: "Comida", description: "" }` (coincide con el mockup: Mateo y Comida activos).
- Pills PARA desde `kids` (8 niños de Sala Soles): pill de niño = avatar 26px con inicial (bg/color de `kid.avatarBg`/`avatarColor`) + primer nombre; pill "Toda la sala" = solo texto. Activa: `border-[1.5px] border-ink bg-ink text-white`; inactiva: `border-[1.5px] border-line bg-surface text-ink-soft`. **Selección múltiple** (toggle): cada niño se agrega/saca de `targets`; "Toda la sala" es excluyente — al marcarla se limpian todos los niños (`field.onChange(["toda-la-sala"])`) y al marcar un niño se descarta "Toda la sala". Default `["mateo-fernandez"]` (coincide con el mockup: Mateo activo).
- Pills TIPO con `POST_TYPE_STYLES` (mapa de colores inline `style={{ background, color }}`): Comida `#9A7B1E`/`#fff`, Siesta `#E7DCF6`/`#7B5FC0`, Actividad `#2E89A6`/`#fff`, Logro `#CFEBD8`/`#3E9B6C`, Ánimo `#F9D2DE`/`#C56486`, Foto `#FBD8CC`/`#D9684A`, Anuncio `#CCD8F4`/`#4E72C8`. El activo se resalta con `ring-2 ring-ink/40` manteniendo su color (el mockup no define estado interactivo propio). Default "Comida".
- Textarea DESCRIPCIÓN: reutiliza `fieldClass` con `min-h-[120px]`, `resize-y`, placeholder "Contá cómo le fue hoy…", borde `border-danger` y `FieldError` en español cuando hay error.
- FOTOS: `flex gap-[12px]` con dos tiles de `size-24`: miniatura placeholder (`bg-field`, `border-line`, icono `Image` en `text-[#CBB89F]`) y tile "Agregar" (`border-[1.5px] border-dashed border-field-border bg-field`, icono `Plus` `text-coral-dark` + texto 12px). Ambos `<button type="button">` decorativos, sin file picker.
- Reutiliza `fieldClass`, `FieldLabel` y `FieldError` de `components/form-controls.tsx` (sin cambios).
- `components/sidebar.tsx`: el `<Link href="#">` "Nueva publicación" se reemplaza por `<NewPostDialog>` con un `<button type="button">` de las mismas clases (gradiente coral `linear-gradient(180deg,#F4977E,#EE8164)`, `Plus`, texto). El sidebar sigue siendo server component.
- `components/mobile-header.tsx`: el `<Link aria-label="Nueva publicación">` se reemplaza por `<NewPostDialog>` con un `<button type="button">` del mismo aspecto (cuadrado gradiente coral con `Plus`).
- `app/page.tsx`: la tarjeta compositora `<Link href="#">` ("Compartí un momento…") se reemplaza por `<NewPostDialog>` con un `<button type="button">` de las mismas clases (avatar C, texto, caja con `Camera`).

**No incluye:**
- Agregar el post al feed ni persistencia (spec con estado futuro).
- Upload real de fotos (sin backend; los tiles de FOTOS son decorativos).
- Selección única de destinatarios.
- Editar publicaciones ni detalle de publicación.
- Cambios en `app/globals.css` (sin tokens nuevos).
- Ruta standalone (se implementa como modal sobre `/`).
- Integración con backend.

## Data model

```ts
// components/new-post-dialog.tsx
import { kids } from "@/app/kids/data";

export const POST_TYPES = ["Comida", "Siesta", "Actividad", "Logro", "Ánimo", "Foto", "Anuncio"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const NEW_POST_TARGETS = ["toda-la-sala", ...kids.map((k) => k.slug)] as const;
export type PostTarget = (typeof NEW_POST_TARGETS)[number];

export const POST_TYPE_STYLES: Record<PostType, { bg: string; text: string }> = {
  Comida: { bg: "#9A7B1E", text: "#fff" },
  Siesta: { bg: "#E7DCF6", text: "#7B5FC0" },
  Actividad: { bg: "#2E89A6", text: "#fff" },
  Logro: { bg: "#CFEBD8", text: "#3E9B6C" },
  Ánimo: { bg: "#F9D2DE", text: "#C56486" },
  Foto: { bg: "#FBD8CC", text: "#D9684A" },
  Anuncio: { bg: "#CCD8F4", text: "#4E72C8" },
};

export const newPostSchema = z.object({
  targets: z
    .array(z.enum(NEW_POST_TARGETS))
    .min(1, "Elegí al menos un destinatario"),
  type: z.enum(POST_TYPES),
  description: z.string().min(1, "Escribí una descripción"),
});

export type NewPostValues = z.input<typeof newPostSchema>;
```

Convenciones:
- `targets` se guarda como array de slugs (estables, sin acentos/espacios); el label de la pill es "Toda la sala" o el primer nombre del kid (`kid.name.split(" ")[0]`); avatar e iniciales salen de `kid.avatarBg`/`kid.avatarColor`; activo = `targets.includes(slug)`.
- `type` y `targets` tienen default (Comida y `["mateo-fernandez"]`), así que la validación de submit se reduce a `description` cuando hay destinatarios; deseleccionar todos dispara "Elegí al menos un destinatario" (el error de array se lee con `get(errors, "targets.message")`).
- Los colores de TIPO van por `style` inline (mapa dinámico), no como clases arbitrarias de Tailwind.

## Implementation plan

1. **`components/new-post-dialog.tsx`** — componente cliente completo según el Scope: schema y `defaultValues`, pills PARA desde `kids` y TIPO desde `POST_TYPE_STYLES` vía `Controller`, textarea DESCRIPCIÓN con `FieldError`, FOTOS estáticas, header (Cancelar con `Dialog.Close`, "Publicar" `type="submit"`), y `handleSubmit(() => setOpen(false))`. Estado funcional: compila; nadie lo usa todavía.
2. **`components/sidebar.tsx`** — reemplazar el `<Link>` del botón por `<NewPostDialog>` con un `<button type="button">` de las mismas clases. Estado funcional: `/` igual, pero el botón abre el modal en desktop.
3. **`components/mobile-header.tsx`** — reemplazar el `<Link>` del botón Plus por `<NewPostDialog>` con un `<button type="button">` del mismo aspecto.
4. **`app/page.tsx`** — reemplazar la tarjeta compositora `<Link>` por `<NewPostDialog>` con un `<button type="button">` de las mismas clases.
5. **Verificación** — `npx tsc --noEmit`, `npm run lint`, y Playwright: `/` desktop ≥1024px y móvil ~390px. Abrir el modal desde los 3 disparadores y comparar estructura contra `crear-publicacion.dc.html` (panel 580px, header, 4 secciones, 9 pills PARA, 7 pills TIPO con colores, textarea, 2 tiles FOTOS). Probar cierre por Cancelar/Esc/backdrop, selección de pills, submit vacío → error que se limpia al escribir, submit con texto → cierra sin cambios en el feed, y regresión de `/`, `/kids` y el perfil.

## Acceptance criteria

- [ ] `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [ ] Clic en "Nueva publicación" (sidebar), en el botón Plus del header móvil y en "Compartí un momento…" abren el modal; cada disparador conserva su aspecto anterior.
- [ ] El panel replica `crear-publicacion.dc.html`: `max-w-[580px]`, header "Cancelar / Nueva publicación / Publicar", y las 4 secciones PARA, TIPO, DESCRIPCIÓN y FOTOS con sus labels en mayúsculas.
- [ ] En móvil el panel entra en `w-[calc(100vw-32px)]` y las 9 pills de PARA se envuelven (flex-wrap).
- [ ] PARA lista "Toda la sala" + los 8 niños de `kids` con su avatar e inicial; "Mateo Fernández" activo al abrir.
- [ ] Se pueden marcar varios niños a la vez (toggle); seleccionar "Toda la sala" desactiva todos los niños y seleccionar un niño descarta "Toda la sala".
- [ ] Con todos los destinatarios deseleccionados, "Publicar" muestra "Elegí al menos un destinatario" bajo PARA y el modal permanece abierto; marcar uno limpia el error.
- [ ] TIPO lista los 7 tipos con los colores del mockup y "Comida" activa al abrir; clic en otro tipo lo activa con anillo oscuro y desactiva al anterior.
- [ ] La descripción abre vacía con placeholder "Contá cómo le fue hoy…".
- [ ] "Publicar" con descripción vacía muestra "Escribí una descripción" bajo el textarea y el modal permanece abierto.
- [ ] Escribir en el textarea limpia su error.
- [ ] Con descripción no vacía, "Publicar" cierra el modal y no agrega ningún post al feed ni persiste.
- [ ] "Cancelar", Esc y clic en el backdrop cierran el modal sin errores.
- [ ] FOTOS muestra la miniatura placeholder (icono de foto sobre `bg-field`) y el tile punteado "Agregar" con `Plus` coral; ninguno abre file picker.
- [ ] El feed `/` se ve igual salvo que los 3 disparadores abren el diálogo (regresión); `/kids` y el perfil no cambian.
- [ ] Sin errores de consola al abrir/cerrar/seleccionar/validar.

## Decisions taken and discarded

**Adoptadas:**
- Radix Dialog controlado + react-hook-form/zod — patrón ya probado en SPEC 04/05; sin dependencias nuevas.
- `NewPostDialog` recibe los disparadores como `children` (patrón `Trigger asChild`): evita convertir `sidebar.tsx` a cliente y permite 3 triggers con estilos distintos.
- Panel `max-w-[580px]` — ancho del mockup (los diálogos previos usaban 480px).
- Destinatarios desde `kids` (8 niños reales de Sala Soles) + "Toda la sala", selección múltiple con "Toda la sala" excluyente — el usuario eligió nómina real sobre los 3 del mockup y ajustó el comportamiento tras la implementación.
- Default "Mateo Fernández" (primer kid, coincide con el activo del mockup) y tipo "Comida".
- Estado activo del tipo con `ring` oscuro superpuesto — el mockup no define su propio estado interactivo (Comida aparece activa solo por ser el único pill sólido de fondo oscuro).
- Colores de TIPO en `POST_TYPE_STYLES` vía `style` inline — mapa dinámico; las clases arbitrarias de Tailwind no funcionan limpio en un Record.
- Publicar valida (descripción requerida) y cierra sin persistir — consistente con SPEC 04/05; el post real va en un spec con estado.
- "Cancelar" como `Dialog.Close` de texto (el mockup no tiene X en este diálogo).
- FOTOS estáticas decorativas — no hay backend. El placeholder replica el thumb de ejemplo y el tile "Agregar".

**Descartadas:**
- Persistencia/crear el post en el feed y edición de publicaciones — spec con estado futuro.
- Upload de fotos (file picker + thumbnails locales) — el usuario eligió estático.
- Selección única de destinatarios — el usuario pidió múltiple con "Toda la sala" excluyente (ajuste post-implementación).
- Solo los 3 kids del mockup — se usa la nómina real.
- Convertir `sidebar.tsx` o `app/page.tsx` a componentes cliente.
- Tokens nuevos en `globals.css` para los colores de TIPO (uso único e inline).

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| Sin screenshot de referencia del modal (no hay `references/screenshots` de crear-publicación; no se puede leer `compose.png`) → validación solo estructural contra `.dc.html` | Aceptado; criterios de datos/layout como en SPEC 04/05. |
| El mockup no define estado activo interactivo para TIPO ni PARA inactivo | Se define anillo oscuro para el tipo activo y estilo invertido (fondo ink) para el destinatario activo; verificado visualmente en Playwright. |
| Pasar triggers como `children` a un cliente desde un server component | Patrón Radix `Trigger asChild` ya usado en SPEC 05; `sidebar.tsx` sigue siendo server. |
| 9 pills de PARA + 7 de TIPO pueden romper el ancho en móvil | Ambas filas usan `flex-wrap` como el diseño; se valida a ~390px. |
| Radix exige `Dialog.Title` para a11y | "Nueva publicación" se usa como `Dialog.Title` del header. |

## What is **not** in this spec

- Crear el post en el feed ni persistencia.
- Upload real de fotos.
- Editar publicaciones ni detalle/publicación.
- Selección única de destinatarios.
- Backend/integración API.

Cada uno de esos, si llega, va en su propio spec.