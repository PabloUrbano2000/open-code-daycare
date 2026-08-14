"use client";

import Link from "next/link";
import { useState } from "react";
import { Sun, CheckCircle2 } from "lucide-react";
import { login } from "./actions";
import { FieldError } from "@/components/form-controls";

export function LoginForm({ activated }: { activated: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const hasError = error !== null;
  const errorId = "login-error";

  async function handleLogin(formData: FormData) {
    setIsPending(true);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
    setIsPending(false);
  }

  return (
    <main className="min-h-screen bg-auth-bg lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E,#F2937A_45%,#F08969)] px-[60px] py-14 text-ink lg:flex">
        <div className="absolute -right-[120px] -top-[140px] size-[420px] rounded-full bg-white/10" />
        <div className="absolute -bottom-[110px] -left-[80px] size-[300px] rounded-full bg-white/10" />

        <div className="relative flex items-center gap-[13px]">
          <div className="flex size-[46px] flex-none items-center justify-center rounded-[14px] bg-white/20">
            <Sun size={26} stroke="#3f362e" strokeWidth={2.2} />
          </div>
          <span className="font-display text-[21px] font-semibold tracking-[.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <p className="m-0 mb-[18px] font-display text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </p>
          <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-ink">
            Publicá momentos, gestioná las salas y mantené a las familias cerca,
            desde un solo lugar.
          </p>
        </div>

        <div className="relative text-sm text-ink">
          🌿 Guardería Sala Soles
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-10 py-10">
        <div className="w-full max-w-[392px]">
          <h1 className="m-0 mb-[6px] font-display text-[30px] font-semibold text-ink">
            Iniciar sesión
          </h1>
          <p className="m-0 mb-[28px] text-[15px] text-ink-muted">
            Ingresá para ver el día de hoy.
          </p>

          {activated && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-[14px] bg-[#CFEBD8] px-4 py-3"
            >
              <CheckCircle2
                size={18}
                strokeWidth={2}
                className="mt-0.5 flex-none text-[#1E6B47]"
              />
              <span className="text-[13.5px] font-bold text-[#1E6B47]">
                Tu cuenta fue activada. Iniciá sesión.
              </span>
            </div>
          )}

          <form action={handleLogin}>
            <label
              htmlFor="login-email"
              className="mb-2 block text-xs font-bold tracking-[.7px] text-ink-muted"
            >
              EMAIL
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? errorId : undefined}
              className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[14px] text-[15px] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-darker"
            />
            <label
              htmlFor="login-password"
              className="mb-2 block text-xs font-bold tracking-[.7px] text-ink-muted"
            >
              CONTRASEÑA
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={hasError || undefined}
              aria-describedby={hasError ? errorId : undefined}
              className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[14px] text-[15px] text-ink placeholder:text-auth-placeholder focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-darker"
            />

            <FieldError id={errorId} message={error ?? undefined} />

            <div className="mb-5 text-right">
              <Link
                href="#"
                className="inline-block py-[3px] text-[13.5px] font-bold text-coral-darker focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-darker"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#C05038,#B34530)] px-4 py-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-darker disabled:opacity-60"
            >
              {isPending ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="m-0 mt-6 text-center text-[14.5px] text-ink-muted">
            ¿Te invitó la guardería?{" "}
            <Link
              href="/activate"
              className="font-extrabold text-coral-darker focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-darker"
            >
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
