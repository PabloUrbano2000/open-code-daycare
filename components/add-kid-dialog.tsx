"use client";

import { useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { ChevronDown, Plus } from "lucide-react";
import { z } from "zod";
import { fieldClass, FieldLabel, FieldError, fieldErrorId } from "@/components/form-controls";

function parseDate(value: string): Date | null {
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  const isReal =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isReal ? date : null;
}

export const addKidSchema = z.object({
  fullName: z.string().min(3, "Escribí el nombre completo"),
  birthDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato dd/mm/aaaa")
    .refine((d) => parseDate(d) !== null, "Fecha inválida")
    .refine((d) => {
      const date = parseDate(d);
      return date !== null && date <= new Date();
    }, "La fecha no puede ser futura"),
  room: z.string().min(1, "Elegí la sala"),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
});

export type AddKidValues = z.input<typeof addKidSchema>;

const DATE_MASK = "00/00/0000";
const DATE_DEFINITIONS: Record<string, RegExp> = { "0": /\d/ };

export function AddKidDialog({ rooms }: { rooms: string[] }) {
  const [open, setOpen] = useState(false);

  const fullNameId = useId();
  const birthDateId = useId();
  const roomId = useId();
  const allergiesId = useId();
  const medicalNotesId = useId();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddKidValues>({
    resolver: zodResolver(addKidSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      room: "",
      allergies: "",
      medicalNotes: "",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset();
    }
  }

  function onSubmit() {
    setOpen(false);
    reset();
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
        >
          <Plus size={17} strokeWidth={2.4} />
          Agregar niño
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#3F362E]/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
          <Dialog.Description className="sr-only">
            Formulario para agregar un niño con nombre, fecha de nacimiento,
            sala, alergias y notas médicas.
          </Dialog.Description>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="text-[15px] font-bold text-ink-muted transition hover:text-ink"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <Dialog.Title className="font-display text-[18px] font-semibold text-ink">
                Agregar niño
              </Dialog.Title>
              <button
                type="submit"
                className="text-[15px] font-extrabold text-coral-brand transition hover:text-coral-darker"
              >
                Guardar
              </button>
            </div>

            <div className="px-[26px] py-6">
              <div className="mb-[18px]">
                <FieldLabel htmlFor={fullNameId}>Nombre completo</FieldLabel>
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id={fullNameId}
                      type="text"
                      placeholder="Ej. Martina López"
                      aria-invalid={errors.fullName ? true : undefined}
                      aria-describedby={
                        errors.fullName ? fieldErrorId("fullName") : undefined
                      }
                      className={`${fieldClass} ${
                        errors.fullName ? "border-danger" : ""
                      }`}
                    />
                  )}
                />
                <FieldError
                  id={fieldErrorId("fullName")}
                  message={errors.fullName?.message}
                />
              </div>

              <div className="mb-[18px] flex gap-[14px]">
                <div className="min-w-0 flex-1">
                  <FieldLabel htmlFor={birthDateId}>
                    Fecha de nacimiento
                  </FieldLabel>
                  <Controller
                    name="birthDate"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        id={birthDateId}
                        name={field.name}
                        onBlur={field.onBlur}
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/aaaa"
                        mask={DATE_MASK}
                        definitions={DATE_DEFINITIONS}
                        value={field.value}
                        onAccept={(value) => field.onChange(value as string)}
                        aria-invalid={errors.birthDate ? true : undefined}
                        aria-describedby={
                          errors.birthDate
                            ? fieldErrorId("birthDate")
                            : undefined
                        }
                        className={`${fieldClass} ${
                          errors.birthDate ? "border-danger" : ""
                        }`}
                      />
                    )}
                  />
                  <FieldError
                    id={fieldErrorId("birthDate")}
                    message={errors.birthDate?.message}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <FieldLabel htmlFor={roomId}>Sala</FieldLabel>
                  <Controller
                    name="room"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <select
                          {...field}
                          id={roomId}
                          aria-invalid={errors.room ? true : undefined}
                          aria-describedby={
                            errors.room ? fieldErrorId("room") : undefined
                          }
                          className={`${fieldClass} appearance-none pr-10 font-bold ${
                            errors.room ? "border-danger" : ""
                          }`}
                        >
                          <option value="" disabled>
                            Elegí la sala
                          </option>
                          {rooms.map((room) => (
                            <option key={room} value={room}>
                              {room}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          strokeWidth={2.2}
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-field-ink"
                        />
                      </div>
                    )}
                  />
                  <FieldError
                    id={fieldErrorId("room")}
                    message={errors.room?.message}
                  />
                </div>
              </div>

              <div className="mb-[18px]">
                <FieldLabel htmlFor={allergiesId}>
                  Alergias (etiquetas)
                </FieldLabel>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      id={allergiesId}
                      type="text"
                      placeholder="Ej. Maní, Lactosa"
                      className={fieldClass}
                    />
                  )}
                />
                <FieldError
                  id={fieldErrorId("allergies")}
                  message={errors.allergies?.message}
                />
              </div>

              <FieldLabel htmlFor={medicalNotesId}>Notas médicas</FieldLabel>
              <Controller
                name="medicalNotes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    id={medicalNotesId}
                    placeholder="Indicaciones, medicación, contactos…"
                    className={`${fieldClass} min-h-[90px] resize-y leading-relaxed`}
                  />
                )}
              />
              <FieldError
                id={fieldErrorId("medicalNotes")}
                message={errors.medicalNotes?.message}
              />
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}