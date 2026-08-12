import type { Metadata } from "next";
import Link from "next/link";
import { Sun } from "lucide-react";

export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-auth-bg px-10 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex size-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <Sun size={30} stroke="#fff" strokeWidth={2.2} />
        </div>

        <h1 className="m-0 mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-ink-muted">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-auth-line bg-white px-4 py-[14px]">
          <div className="flex size-11 flex-none items-center justify-center rounded-full bg-sky font-display text-[19px] font-semibold text-sky-deep">
            M
          </div>
          <div>
            <div className="text-[13px] text-ink-muted">
              Te invitaron a seguir a
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              Mateo · Sala Soles
            </div>
          </div>
        </div>

        <div className="mb-2 text-xs font-bold tracking-[.7px] text-ink-muted">
          CÓDIGO DE INVITACIÓN
        </div>
        <input
          defaultValue="7K4P9"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-ink"
        />
        <div className="mb-2 text-xs font-bold tracking-[.7px] text-ink-muted">
          EMAIL
        </div>
        <input
          type="email"
          defaultValue="lucia.fernandez@gmail.com"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-auth-line bg-white px-4 py-[14px] text-[15px] text-ink"
        />
        <div className="mb-2 text-xs font-bold tracking-[.7px] text-ink-muted">
          CREAR CONTRASEÑA
        </div>
        <input
          type="password"
          defaultValue="contraseña"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-auth-code bg-white px-4 py-[14px] text-[15px] text-ink"
        />

        <div className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-auth-warn px-4 py-[14px]">
          <span className="mt-[1px] flex size-6 flex-none items-center justify-center rounded-lg bg-auth-green">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-sm leading-[1.45] text-auth-warn-ink">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
            de la app.
          </span>
        </div>

        <Link
          href="#"
          className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
        >
          Activar mi cuenta
        </Link>
        <p className="m-0 mt-[22px] text-center text-[14.5px] text-ink-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-coral-darker">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
