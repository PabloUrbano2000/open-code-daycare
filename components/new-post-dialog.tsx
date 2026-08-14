"use client";

import { useId, useState, type ReactNode } from "react";
import { Image as ImageIcon, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, get } from "react-hook-form";
import { z } from "zod";
import { kids } from "@/app/kids/data";
import { fieldClass, FieldLabel, FieldError, fieldErrorId } from "@/components/form-controls";

export const POST_TYPES = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
] as const;
export type PostType = (typeof POST_TYPES)[number];

export const NEW_POST_TARGETS = [
  "toda-la-sala",
  ...kids.map((kid) => kid.slug),
] as const;
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

const pillBase =
  "rounded-full text-[14px] font-bold transition border-[1.5px]";

function targetPillClass(active: boolean) {
  return `${pillBase} ${
    active
      ? "border-ink bg-ink text-white"
      : "border-line bg-surface text-ink-soft"
  }`;
}

function toggleTarget(
  current: readonly PostTarget[],
  option: PostTarget
): PostTarget[] {
  if (option === "toda-la-sala") {
    return ["toda-la-sala"];
  }
  if (current.includes("toda-la-sala")) {
    return [option];
  }
  return current.includes(option)
    ? current.filter((t) => t !== option)
    : [...current, option];
}

export function NewPostDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const descriptionId = useId();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewPostValues>({
    resolver: zodResolver(newPostSchema),
    defaultValues: {
      targets: ["mateo-fernandez"],
      type: "Comida",
      description: "",
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
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#3F362E]/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[580px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
          <Dialog.Description className="sr-only">
            Formulario para crear una publicación con destinatarios, tipo,
            descripción y fotos.
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
              <Dialog.Title className="m-0 font-display text-[18px] font-semibold text-ink">
                Nueva publicación
              </Dialog.Title>
              <button
                type="submit"
                className="text-[15px] font-extrabold text-coral-brand transition hover:text-coral-dark"
              >
                Publicar
              </button>
            </div>

            <div className="px-[26px] py-6">
              <div className="mb-[22px]">
                <FieldLabel>PARA</FieldLabel>
                <Controller
                  name="targets"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-[9px]">
                      {NEW_POST_TARGETS.map((option) => {
                        const kid = kids.find((k) => k.slug === option);
                        const active = field.value.includes(option);
                        if (!kid) {
                          return (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                field.onChange(
                                  toggleTarget(field.value, "toda-la-sala")
                                )
                              }
                              className={`${targetPillClass(active)} px-4 py-[6px]`}
                            >
                              Toda la sala
                            </button>
                          );
                        }
                        return (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              field.onChange(
                                toggleTarget(field.value, option)
                              )
                            }
                            className={`${targetPillClass(active)} flex items-center gap-2 py-[6px] pl-[6px] pr-[14px]`}
                          >
                            <span
                              className="flex size-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                              style={{
                                background: kid.avatarBg,
                                color: kid.avatarColor,
                              }}
                            >
                              {kid.initials}
                            </span>
                            {kid.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
                <FieldError
                  id={fieldErrorId("targets")}
                  message={get(errors, "targets.message") as string | undefined}
                />
              </div>

              <div className="mb-[22px]">
                <FieldLabel>TIPO</FieldLabel>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-[9px]">
                      {POST_TYPES.map((type) => {
                        const styles = POST_TYPE_STYLES[type];
                        const active = field.value === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={active}
                            onClick={() => field.onChange(type)}
                            className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold transition ${
                              active ? "ring-2 ring-ink/40" : ""
                            }`}
                            style={{ background: styles.bg, color: styles.text }}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </div>

              <div className="mb-[22px]">
                <FieldLabel htmlFor={descriptionId}>DESCRIPCIÓN</FieldLabel>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      id={descriptionId}
                      placeholder="Contá cómo le fue hoy…"
                      aria-invalid={errors.description ? true : undefined}
                      aria-describedby={
                        errors.description
                          ? fieldErrorId("description")
                          : undefined
                      }
                      className={`${fieldClass} min-h-[120px] resize-y py-[14px] leading-[1.5] ${
                        errors.description ? "border-danger" : ""
                      }`}
                    />
                  )}
                />
                <FieldError
                  id={fieldErrorId("description")}
                  message={errors.description?.message}
                />
              </div>

              <div>
                <FieldLabel>FOTOS</FieldLabel>
                <div className="flex gap-3">
                  <div className="flex size-24 flex-none items-center justify-center rounded-[14px] border border-line bg-field text-[#CBB89F]">
                    <ImageIcon size={26} strokeWidth={1.7} />
                  </div>
                  <button
                    type="button"
                    className="flex size-24 flex-none flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-field-border bg-field text-field-ink"
                  >
                    <Plus size={22} strokeWidth={2} className="text-coral-dark" />
                    <span className="text-[12px]">Agregar</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}