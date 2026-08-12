"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { ChevronDown, Plus } from "lucide-react";
import { z } from "zod";

export const ROOMS = ["Soles"] as const;

function parseDate(value: string): Date {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day);
}

function isRealDate(value: string): boolean {
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

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

const DATE_MASK = "00/00/0000";
const DATE_DEFINITIONS: Record<string, RegExp> = { "0": /\d/ };

const fieldClass =
  "w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[13px] text-[15px] text-ink placeholder:text-auth-placeholder focus:outline-none";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 text-[12px] font-extrabold uppercase tracking-[.7px] text-ink-muted">
      {children}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span className="mt-1.5 block text-[12.5px] font-bold text-danger">
      {message}
    </span>
  );
}

export function AddKidDialog() {
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
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

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
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
          <form onSubmit={handleSubmit(() => setOpen(false))} noValidate>
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
                <FieldLabel>Nombre completo</FieldLabel>
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ej. Martina López"
                      className={`${fieldClass} ${
                        errors.fullName ? "border-danger" : ""
                      }`}
                    />
                  )}
                />
                <FieldError message={errors.fullName?.message} />
              </div>

              <div className="mb-[18px] flex gap-[14px]">
                <div className="min-w-0 flex-1">
                  <FieldLabel>Fecha de nacimiento</FieldLabel>
                  <Controller
                    name="birthDate"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/aaaa"
                        mask={DATE_MASK}
                        definitions={DATE_DEFINITIONS}
                        value={field.value}
                        onAccept={(value) => field.onChange(value as string)}
                        className={`${fieldClass} ${
                          errors.birthDate ? "border-danger" : ""
                        }`}
                      />
                    )}
                  />
                  <FieldError message={errors.birthDate?.message} />
                </div>

                <div className="min-w-0 flex-1">
                  <FieldLabel>Sala</FieldLabel>
                  <Controller
                    name="room"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <select
                          {...field}
                          className={`${fieldClass} appearance-none pr-10 font-bold ${
                            errors.room ? "border-danger" : ""
                          }`}
                        >
                          <option value="" disabled>
                            Elegí la sala
                          </option>
                          {ROOMS.map((room) => (
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
                  <FieldError message={errors.room?.message} />
                </div>
              </div>

              <div className="mb-[18px]">
                <FieldLabel>Alergias (etiquetas)</FieldLabel>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ej. Maní, Lactosa"
                      className={`${fieldClass} ${
                        errors.allergies ? "border-danger" : ""
                      }`}
                    />
                  )}
                />
                <FieldError message={errors.allergies?.message} />
              </div>

              <FieldLabel>Notas médicas</FieldLabel>
              <Controller
                name="medicalNotes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Indicaciones, medicación, contactos…"
                    className={`${fieldClass} min-h-[90px] resize-y leading-relaxed`}
                  />
                )}
              />
              <FieldError message={errors.medicalNotes?.message} />
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}