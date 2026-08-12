"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { Info, Plus, Send, X } from "lucide-react";
import { z } from "zod";
import { fieldClass, FieldLabel, FieldError } from "@/components/form-controls";

export const RELATIONS = ["Mamá", "Papá", "Tutor/a"] as const;
export type Relation = (typeof RELATIONS)[number];

export const linkParentSchema = z.object({
  name: z.string().min(3, "Escribí el nombre del padre/madre"),
  email: z.string().regex(/^\S+@\S+\.\S+$/, "Ingresá un email válido"),
  relation: z.enum(RELATIONS),
});

export type LinkParentValues = z.input<typeof linkParentSchema>;

const pillClass =
  "flex-1 rounded-full py-[11px] text-[14px] font-extrabold transition";

function relationPillClass(active: boolean) {
  return active
    ? `${pillClass} border-[1.5px] border-[#9FB8EC] bg-indigo-bg text-indigo`
    : `${pillClass} border-[1.5px] border-line bg-surface text-ink-soft`;
}

export function LinkParentDialog({ kidName }: { kidName: string }) {
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkParentValues>({
    resolver: zodResolver(linkParentSchema),
    defaultValues: { name: "", email: "", relation: "Mamá" },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 pt-2 text-left"
        >
          <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-field-ink">
            <Plus size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[14.5px] font-extrabold text-coral-darker">
            Vincular otro padre
          </span>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#3F362E]/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[24px] border border-line bg-auth-bg shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]">
          <form onSubmit={handleSubmit(() => setOpen(false))} noValidate>
            <div className="flex items-center justify-between border-b border-line px-[26px] py-5">
              <div>
                <Dialog.Title className="m-0 font-display text-[18px] font-semibold text-ink">
                  Vincular padre
                </Dialog.Title>
                <div className="text-[13px] text-ink-faint">a {kidName}</div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-ink-muted transition hover:text-ink"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </Dialog.Close>
            </div>

            <div className="px-[26px] py-[22px]">
              <div className="mb-5 flex gap-[11px] rounded-[14px] bg-azure-bg px-4 py-[13px]">
                <Info
                  size={20}
                  strokeWidth={2}
                  className="mt-0.5 flex-none text-indigo"
                />
                <span className="text-[13.5px] leading-[1.45] text-azure-ink">
                  Le enviaremos un correo con un código para que active su
                  cuenta. Solo verá el feed de {kidName}.
                </span>
              </div>

              <div className="mb-[18px]">
                <FieldLabel>Nombre del padre/madre</FieldLabel>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Ej. Diego Fernández"
                      className={`${fieldClass} ${
                        errors.name ? "border-danger" : ""
                      }`}
                    />
                  )}
                />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="mb-[18px]">
                <FieldLabel>Email</FieldLabel>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      placeholder="correo@ejemplo.com"
                      className={`${fieldClass} ${
                        errors.email ? "border-danger" : ""
                      }`}
                    />
                  )}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div className="mb-5">
                <FieldLabel>Parentesco</FieldLabel>
                <Controller
                  name="relation"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-[9px]">
                      {RELATIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => field.onChange(option)}
                          className={relationPillClass(
                            field.value === option
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-gold-line bg-auth-warn px-4 py-[18px] text-center">
                <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-gold">
                  CÓDIGO DE INVITACIÓN
                </div>
                <div className="font-display text-[34px] font-semibold tracking-[7px] text-auth-warn-ink">
                  7K4P9
                </div>
                <div className="mt-1.5 text-[13px] text-gold">
                  Vence en 7 días
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2.25 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3.5 text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
              >
                <Send size={19} strokeWidth={2} />
                Enviar invitación
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}