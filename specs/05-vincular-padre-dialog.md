# SPEC 05 — Diálogo "Vincular padre" (modal)

**State:** Aprobado
**Depends on:** SPEC 02, SPEC 04
**Date:** 2026-08-12
**Objective:** Implementar el diálogo modal "Vincular padre" accionado desde la fila "Vincular otro padre" del perfil `/kids/[slug]`, con formulario validado por Zod (nombre, email y parentesco con pills Mamá/Papá/Tutor/a, default Mamá) cuyo "Enviar invitación" valida y cierra sin persistir.

## Scope

**Incluye:**
- `app/globals.css`: tokens `--color-azure-bg` `#E3ECFB`, `--color-azure-ink` `#3F5694`, `--color-gold` `#A88526` y `--color-gold-line` `#E6D08A` en `@theme inline`. El borde del pill activo (`#9FB8EC`) y el fondo del X (`#F0E6D8`) van como valores arbitrarios (uso único).
- `components/form-controls.tsx` (nuevo): `fieldClass`, `FieldLabel` y `FieldError` extraídos de `add-kid-dialog.tsx`.
- `components/add-kid-dialog.tsx`: pasa a importar `fieldClass`/`FieldLabel`/`FieldError` desde `form-controls` (se eliminan las definiciones locales).
- `components/link-parent-dialog.tsx` (nuevo, cliente): `Dialog.Root` controlado (`open`/`onOpenChange`). `Dialog.Trigger` asChild sobre un `<button type="button">` con las mismas clases de la fila actual (círculo punteado + `Plus` + texto coral). `Portal`/`Overlay`/`Content` en panel `max-w-[480px]` (`w-[calc(100vw-32px)]` en móvil) sobre `bg-auth-bg`. Header: título `Dialog.Title` "Vincular padre" + subtítulo "a {kidName}" + X `Dialog.Close`. Caja info azul ("Le enviaremos un correo… Solo verá el feed de {kid.name}."). Inputs NOMBRE DEL PADRE/MADRE (placeholder "Ej. Diego Fernández") y EMAIL (`type="email"`, placeholder "correo@ejemplo.com"). PARENTESCO con pills Mamá (activo default) / Papá / Tutor/a. Caja CÓDIGO DE INVITACIÓN estática `7K4P9` + "Vence en 7 días". Botón submit "Enviar invitación" con gradiente coral y icono `Send`.
- Form react-hook-form + `zodResolver`: `linkParentSchema`. El campo `relation` vive en el formulario (`defaultValues.relation = "Mamá"`); el clic de un pill hace `setValue("relation", r, { shouldValidate: true })` y el estado activo sale de `watch("relation")`.
- Validación al submit; errores en español bajo cada campo (reutiliza `FieldError`, borde `border-danger`). Submit válido → cierra el diálogo; inválido → modal abierto con errores.
- `app/kids/[slug]/page.tsx`: la fila `<Link href="#">` "Vincular otro padre" se reemplaza por `<LinkParentDialog kidName={kid.name} />`; la página sigue siendo server component.

**No incluye:**
- Agregar el padre a PADRES VINCULADOS ni persistencia (spec con estado futuro).
- Extender `Parent.relation` en `app/kids/data.ts` ("Tutor/a" es local al diálogo).
- Generación real del código ni envío de email (7K4P9 estático, mockup).
- Ruta standalone (el diseño se implementa como modal sobre `/kids/[slug]`).
- Integración con backend.

## Data model

```ts
// components/link-parent-dialog.tsx
export const RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
export type Relation = (typeof RELATIONS)[number];

export const linkParentSchema = z.object({
  name: z.string().min(3, "Escribí el nombre del padre/madre"),
  email: z.string().regex(/^\S+@\S+\.\S+$/, "Ingresá un email válido"),
  relation: z.enum(RELATIONS),
});

export type LinkParentValues = z.input<typeof linkParentSchema>;
```

Convenciones:
- `email` se valida por regex (evita `z.string().email()`, deprecado en zod v4).
- `relation` es parte del formulario, no un `useState` aparte, para que submit/validación la conozcan.

## Implementation plan

1. **`app/globals.css`** — añadir los 4 tokens al bloque `@theme inline`. Estado funcional: `npm run lint` y `npx tsc --noEmit` pasan sin tocar código.
2. **`components/form-controls.tsx`** — crear con `fieldClass`, `FieldLabel` y `FieldError` (copiados de `add-kid-dialog.tsx`) y refactorizar `add-kid-dialog.tsx` para importarlos. Estado funcional: modal de `/kids` idéntico (regresión).
3. **`components/link-parent-dialog.tsx`** — componente cliente completo según el Scope (schema, pills vía `setValue`/`watch`, header con X, caja info, código estático, CTA submit que cierra al validar).
4. **`app/kids/[slug]/page.tsx`** — reemplazar la fila por el trigger; pasar `kidName`.
5. **Verificación** — `npx tsc --noEmit`, `npm run lint`, y Playwright: `/kids/mateo-fernandez` desktop ≥1024px (abrir modal y comparar estructura contra `vincular-padre.dc.html`) y móvil ~390px; cierre por X/Esc/backdrop; pills con default Mamá e interacción; submit vacío → errores que se limpian al editar; email inválido → "Ingresá un email válido"; submit válido → cierra sin cambiar la lista PADRES VINCULADOS; regresión de `/kids`, del perfil y del modal "Agregar niño".

## Acceptance criteria

- [ ] `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [ ] Clic en "Vincular otro padre" en `/kids/[slug]` abre el modal; la fila mantiene el aspecto actual (círculo punteado + `Plus` + texto coral).
- [ ] El panel replica `vincular-padre.dc.html`: `max-w-[480px]`, header "Vincular padre / a {kid.name}" con X, y las 5 secciones (info azul, nombre, email, parentesco, código 7K4P9).
- [ ] X, Esc y clic en backdrop cierran el modal sin errores.
- [ ] "Mamá" aparece activo al abrir; clic en "Papá" o "Tutor/a" lo activa y desactiva al anterior.
- [ ] "Enviar invitación" con `name` o `email` vacíos o inválidos muestra el error en español bajo cada campo y el modal permanece abierto.
- [ ] Editar un campo con error limpia su mensaje.
- [ ] Con `name` "Diego Fernández", `email` válido y parentesco Papá, enviar cierra el modal y no agrega ningún padre a PADRES VINCULADOS.
- [ ] El bloque de código muestra `7K4P9` y "Vence en 7 días" en toda apertura.
- [ ] El modal "Agregar niño" (`/kids`) sigue funcionando igual tras el refactor de `form-controls`.
- [ ] `/kids` y el perfil `/kids/[slug]` no cambian (regresión).
- [ ] Sin errores de consola al abrir/cerrar/validar.

## Decisions taken and discarded

**Adoptadas:**
- Validado y cierra sin persistir — consistente con SPEC 04; agregar a la lista va en un spec con estado.
- Pills seleccionables con default Mamá, integrados al form RHF (`setValue`/`watch`) para que la validación los conozca.
- Código de invitación estático `7K4P9` y "Vence en 7 días" — no hay backend que lo genere.
- `components/form-controls.tsx` compartido — `FieldLabel`/`FieldError`/`fieldClass` son idénticos en ambos diálogos; listo para futuros forms.
- "Tutor/a" es local al diálogo; no se toca `Parent.relation` (no hay persistencia).
- Tokens para colores repetidos del modal (caja info azul y acentos dorados) y valores arbitrarios para los de uso único.
- X discreto (`#F0E6D8`) en el header, como en el mockup, en lugar de "Cancelar".

**Descartadas:**
- Persistencia/agregar padre PENDIENTE y extender `Parent.relation` — spec con estado futuro.
- Generación de código o envío de email real.
- Pills estáticos (tipo SPEC 03) — el usuario eligió interacción.
- Duplicar `form-controls` en el nuevo dialog.
- `z.string().email()` — deprecado en zod v4; se usa regex.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| No existe `references/screenshots/vincular-padre.png` → validación solo estructural contra `.dc.html` | Aceptado; criterios de datos/layout como en SPEC 03/04. |
| El refactor de `form-controls` puede romper `add-kid-dialog` | Regresión del modal "Agregar niño" en los criterios de aceptación. |
| Radix exige `Dialog.Title` para a11y | "Vincular padre" se usa como `Dialog.Title`; el subtítulo/la caja info como contexto visual. |
| `setValue` sin `shouldValidate` dejaría el pill sin revalidar | Se usa `{ shouldValidate: true }` para limpiar el error al cambiar parentesco. |

## What is **not** in this spec

- Agregar el padre a PADRES VINCULADOS ni persistencia.
- Extensión de `Parent.relation` con "Tutor/a".
- Generación real de código, envío de email ni activación de cuenta.
- Backend/integración API.

Cada uno de esos, si llega, va en su propio spec.