"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sun, TriangleAlert } from "lucide-react";
import { z } from "zod";
import { FieldError } from "@/components/form-controls";
import { activate } from "./actions";

const activateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(5, "Ingresá el código de 5 caracteres")
    .max(5, "El código tiene 5 caracteres"),
  email: z.string().regex(/^\S+@\S+\.\S+$/, "Ingresá un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  consent: z
    .boolean()
    .refine((v) => v === true, {
      message: "Necesitás autorizar el uso de fotos para continuar.",
    }),
});

type ActivateValues = z.input<typeof activateSchema>;

export function ActivateForm({ prefilledEmail }: { prefilledEmail: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateValues>({
    resolver: zodResolver(activateSchema),
    defaultValues: { code: "", email: prefilledEmail, password: "", consent: false },
  });

  async function onSubmit(values: ActivateValues) {
    setIsPending(true);
    setError(null);
    const result = await activate({
      code: values.code,
      email: values.email,
      password: values.password,
    });
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-[22px] flex size-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
        <Sun size={30} stroke="#fff" strokeWidth={2.2} />
      </div>

      <h1 className="m-0 mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
        Bienvenida a OpenDayCare
      </h1>
      <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-ink-muted">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
        la cuenta.
      </p>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-[12px] bg-[#FBDAD6] px-4 py-3">
          <TriangleAlert
            size={18}
            strokeWidth={2}
            className="mt-0.5 flex-none text-[#C5413A]"
          />
          <span className="text-[13px] font-bold text-[#C5413A]">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-2 text-xs font-bold tracking-[.7px] text-ink-muted">
          CÓDIGO DE INVITACIÓN
        </div>
        <Controller
          name="code"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              maxLength={5}
              autoCapitalize="characters"
              placeholder="7K4P9"
              className={`mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-ink ${
                errors.code ? "border-danger" : "border-auth-line"
              }`}
            />
          )}
        />
        <FieldError message={errors.code?.message} />

        <div className="mb-2 text-xs font-bold tracking-[.7px] text-ink-muted">
          EMAIL
        </div>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="email"
              className={`mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-ink ${
                errors.email ? "border-danger" : "border-auth-line"
              }`}
            />
          )}
        />
        <FieldError message={errors.email?.message} />

        <div className="mb-2 text-xs font-bold tracking-[.7px] text-ink-muted">
          CREAR CONTRASEÑA
        </div>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              className={`mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-ink ${
                errors.password ? "border-danger" : "border-auth-code"
              }`}
            />
          )}
        />
        <FieldError message={errors.password?.message} />

        <div className="mb-2">
          <Controller
            name="consent"
            control={control}
            render={({ field }) => (
              <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-auth-warn px-4 py-[14px]">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="mt-[2px] size-5 accent-[#F2937A]"
                />                <span className="text-sm leading-[1.45] text-auth-warn-ink">
                  Autorizo a la guardería a tomar y compartir fotos de mi hijo
                  dentro de la app.
                </span>
              </label>
            )}
          />
          <FieldError message={errors.consent?.message} />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-60"
        >
          {isPending ? "Activando…" : "Activar mi cuenta"}
        </button>
      </form>

      <p className="m-0 mt-[22px] text-center text-[14.5px] text-ink-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-coral-darker">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
