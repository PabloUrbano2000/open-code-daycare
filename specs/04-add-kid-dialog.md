# SPEC 04 — Diálogo "Agregar niño" (modal)

**State:** Implementado
**Depends on:** SPEC 02
**Date:** 2026-08-12
**Objective:** Implementar el diálogo modal "Agregar niño" desde el botón homónimo de `/kids`, con formulario validado por Zod (nombre completo, fecha de nacimiento con máscara dd/mm/aaaa y sala requeridos; alergias y notas médicas opcionales), cuyo Guardar valida y cierra sin persistir.

## Scope

**Incluye:**
- `package.json`: nuevas dependencias `@radix-ui/react-dialog`, `react-hook-form`, `@hookform/resolvers`, `zod`, `imask` y `react-imask`.
- `components/add-kid-dialog.tsx` (nuevo, cliente): `Dialog.Root` controlado con trigger = botón "Agregar niño" (mismas clases del `Link` actual, gradiente coral + icono `Plus`), `Portal`/`Overlay`/`Content`, y el form con los 5 campos del diseño.
- `app/kids/page.tsx`: el `<Link href="#">` "Agregar niño" se reemplaza por `<AddKidDialog />`; la página sigue siendo server component (el estado vive en el componente cliente).
- `app/globals.css`: token `--color-danger` para bordes y mensajes de error.
- Formulario react-hook-form + `zodResolver`: `addKidSchema` con `fullName` (required, min 3), `birthDate` (máscara imask dd/mm/aaaa + regex + refine de fecha real y no futura), `room` (select, required), `allergies` y `medicalNotes` (opcionales).
- Validación al submit; el error de cada campo se limpia al volver a editarlo (revalidación por defecto de RHF).
- Comportamiento de Guardar: si es válido → cierra el diálogo; no altera `kids` ni persiste. Si es inválido → errores en español bajo cada campo.
- Cierre por "Cancelar" (`Dialog.Close`), backdrop y Esc (Radix).
- Responsive: panel `max-w-[520px]` centrado con scroll interno; header fijo Cancelar / "Agregar niño" / Guardar.

**No incluye:**
- Añadir el niño a la lista ni persistencia (spec con estado futuro).
- Editar niño, vincular padre ni resumen del día.
- Ruta standalone (el diseño se implementa como modal sobre `/kids`).
- Integración con backend.

## Data model

```ts
// components/add-kid-dialog.tsx
import { z } from "zod";

export const ROOMS = ["Soles"] as const;

export const addKidSchema = z.object({
  fullName: z.string().min(3, "Escribí el nombre completo"),
  birthDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato dd/mm/aaaa")
    .refine(isRealDate, "Fecha inválida")
    .refine((d) => parseDate(d) <= new Date(), "La fecha no puede ser futura"),
  room: z.string().min(1, "Elegí la sala"),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
});

export type AddKidValues = z.input<typeof addKidSchema>;
```

Convenciones:
- `birthDate` se valida como máscara formateada `dd/mm/aaaa` (string, no ISO). `isRealDate` reconstruye la fecha y comprueba que coincida (31/02 → inválido, lo que imask no captura hasta completar).
- Sala es un `<select>` cuyo único option es "Soles" (default); el schema lo mantiene required para salas futuras.
- Errores en español.

## Implementation plan

1. **Dependencias** — `npm i @radix-ui/react-dialog react-hook-form @hookform/resolvers zod imask react-imask`. Estado funcional: `npm run lint` y `npx tsc --noEmit` pasan sin tocar código.
2. **`app/globals.css`** — añadir `--color-danger: #d9534f` al bloque `@theme inline`.
3. **`components/add-kid-dialog.tsx`** — componente cliente: `Dialog.Root open/onOpenChange`, `Dialog.Trigger` con el botón de gradiente coral, header con `Dialog.Title` "Agregar niño" + `Dialog.Close` Cancelar + botón Guardar `type="submit"`; `useForm<AddKidValues>({ resolver: zodResolver(addKidSchema) })`; `handleSubmit(() => setOpen(false))`; campos con `Controller` (input `fullName`, `IMaskInput mask={Date}` para `birthDate`, `<select>` para `room`, input `allergies`, textarea `medicalNotes`); mensajes de error con `formState.errors.<campo>` en `text-danger`, borde `border-danger` en inputs con error.
4. **Integrar en `/kids`** — `app/kids/page.tsx`: importar `<AddKidDialog />` y reemplazar el `Link` del botón. La página sigue renderizándose en servidor.
5. **Verificación** — `npx tsc --noEmit`, `npm run lint`, y Playwright: `/kids` desktop ≥1024px (abrir modal y comparar estructura contra `agregar-nino.dc.html`) y móvil ~390px; cierre por Esc/backdrop/Cancelar; submit vacío → errores que se limpian al editar; 31/02/2020 → "Fecha inválida"; submit válido → cierra sin cambios en la lista; regresión de `/` y de la lista de `/kids`.

## Acceptance criteria

- [x] `npx tsc --noEmit` y `npm run lint` pasan sin errores.
- [x] Clic en "Agregar niño" en `/kids` abre el modal; el botón mantiene el mismo aspecto (gradiente coral + `Plus`).
- [x] En desktop ≥1024px el modal replica `agregar-nino.dc.html`: panel `max-w-[520px]`, header Cancelar/Agregar niño/Guardar, y los 5 campos con fecha y sala lado a lado.
- [x] Esc, clic en backdrop y "Cancelar" cierran el modal sin errores.
- [x] "Guardar" con `fullName`, `birthDate` o `room` vacíos muestra el error en español bajo cada campo faltante y el modal permanece abierto.
- [x] Editar un campo con error limpia su mensaje.
- [x] El campo fecha solo acepta dígitos y `/` (máscara dd/mm/aaaa); `31/02/2020` muestra "Fecha inválida".
- [x] Con `fullName` "Martina López", `birthDate` "15/03/2022" y `room` "Soles", Guardar cierra el modal y no agrega ningún niño a la lista.
- [x] Alergias y notas médicas vacías no generan errores.
- [x] La lista de `/kids` se renderiza sin cambios y `/` no cambia (regresión).
- [x] Sin errores de consola al abrir/cerrar el modal ni al validar.

## Decisions taken and discarded

**Adoptadas:**
- Radix Dialog: accesibilidad (focus, aria, Esc) resuelta; nueva dependencia aceptada por el usuario.
- react-hook-form + `zodResolver` (resolvers auto-detecta zod v4): estado y errores declarativos, tipado con `z.input`.
- imask/react-imask `IMaskInput` (`mask={Date}`) para la máscara dd/mm/aaaa; zod valida la fecha real con `refine`.
- Validación al submit y limpieza al editar (revalidación por defecto de RHF).
- Select de sala con única opción "Soles" (default) — única sala actual; perpetúa su required para el futuro.
- Guardar solo cierra: sin persistencia, consistente con SPEC 01/02/03; agregar a la lista va en un spec con estado.
- Token `--color-danger` en `globals.css` — el diseño no define estados de error.

**Descartadas:**
- Persistencia/localStorage y añadir a `kids` en memoria — spec con estado futuro.
- Manejo manual (useState + `safeParse`) — el usuario prefirió RHF.
- Máscara manual — el usuario prefirió imask.
- `<dialog>` nativo u overlay propio — Radix da a11y gratis.

## Identified risks

| Riesgo | Mitigación |
| --- | --- |
| react-imask + `Controller`: el valor pasado a `field.onChange` debe ser el formateado; API puede variar | Verificar contra docs de imask/react-imask en la implementación y test manual del flujo de fecha. |
| zod v4 cambia algunas APIs respecto a v3 | resolvers lo detecta solo; chequear con Context7 al instalar. |
| Radix exige `Dialog.Title` para a11y | El título "Agregar niño" del diseño se usa como `Dialog.Title`. |
| Sin screenshot de referencia del modal → validación solo estructural | Comparar contra `agregar-nino.dc.html` con criterios de datos/layout. |
| imask permite fechas inexistentes hasta completar la máscara | El `refine(isRealDate)` de zod marca 31/02 como inválido. |

## What is **not** in this spec

- Añadir el niño a la lista ni persistencia.
- Editar perfil, vincular padre, resumen del día.
- Backend/integración API.

Cada uno de esos, si llega, va en su propio spec.