import Link from "next/link";
import { Camera, Heart, Image as ImageIcon, MessageCircle } from "lucide-react";
import MobileHeader from "@/components/mobile-header";
import Sidebar from "@/components/sidebar";

function Avatar({
  initials,
  className,
  textColor,
}: {
  initials: string;
  className: string;
  textColor: string;
}) {
  return (
    <div
      className={`flex size-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold ${className}`}
    >
      <span className={textColor}>{initials}</span>
    </div>
  );
}

function Badge({
  className,
  dot,
  label,
  text,
}: {
  className: string;
  dot: string;
  label: string;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${className}`}
    >
      <span className={`size-2 rounded-full ${dot}`} />
      <span className={`text-xs font-extrabold tracking-[.5px] ${text}`}>
        {label}
      </span>
    </div>
  );
}

function PostFooter({
  likes,
  comments,
}: {
  likes: number;
  comments: number;
}) {
  return (
    <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-3.5">
      <span className="flex items-center gap-[7px] text-sm font-bold text-coral-dark">
        <Heart size={19} fill="#E0654A" />
        {likes}
      </span>
      <Link
        href="#"
        className="flex items-center gap-[7px] text-sm font-bold text-ink-muted"
      >
        <MessageCircle size={18} />
        {comments}
      </Link>
      <span className="flex-1" />
      <Link href="#" className="text-sm font-extrabold text-coral-darker">
        Editar
      </Link>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MobileHeader />

      <div className="flex flex-1">
        <Sidebar />

        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-4 py-6 pb-20 lg:px-10 lg:py-[34px] lg:pb-20">
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-coral-brand">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
              Buenas, Caro
            </h1>
            <p className="mt-[5px] text-[14.5px] text-ink-muted">
              12 niños · martes 17 jun
            </p>
          </div>

          <Link
            href="#"
            className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-line bg-surface px-[18px] py-3.5 shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
          >
            <div className="flex size-10 flex-none items-center justify-center rounded-full bg-coral font-display text-base font-semibold text-white">
              C
            </div>
            <span className="flex-1 text-[15px] text-ink-faint">
              Compartí un momento…
            </span>
            <span className="flex size-[38px] items-center justify-center rounded-[12px] bg-peach text-coral-dark">
              <Camera size={19} />
            </span>
          </Link>

          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
              PUBLICADO HOY
            </span>
            <span className="h-px flex-1 bg-hairline" />
          </div>

          <div className="flex flex-col gap-4">
            <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
              <div className="mb-[14px] flex items-center gap-3">
                <Avatar
                  initials="M"
                  className="bg-sky"
                  textColor="text-sky-deep"
                />
                <div className="flex-1">
                  <div className="font-display text-[16.5px] font-semibold text-ink">
                    Mateo
                  </div>
                  <div className="text-[12.5px] text-ink-faint">
                    14:20 · publicado por vos
                  </div>
                </div>
                <Badge
                  className="bg-green-bg"
                  dot="bg-green"
                  text="text-green"
                  label="LOGRO"
                />
              </div>
              <div className="mb-2.5 text-[12.5px] text-ink-faint">
                Para: familia de Mateo
              </div>
              <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">
                ¡Usó el orinal solito por primera vez! Estaba feliz de
                contárselo a todos. Un gran paso.
              </p>
              <PostFooter likes={3} comments={1} />
            </article>

            <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
              <div className="mb-[14px] flex items-center gap-3">
                <Avatar
                  initials="M"
                  className="bg-sky"
                  textColor="text-sky-deep"
                />
                <div className="flex-1">
                  <div className="font-display text-[16.5px] font-semibold text-ink">
                    Mateo
                  </div>
                  <div className="text-[12.5px] text-ink-faint">
                    09:40 · publicado por vos
                  </div>
                </div>
                <Badge
                  className="bg-cyan-bg"
                  dot="bg-cyan"
                  text="text-cyan"
                  label="ACTIVIDAD"
                />
              </div>
              <div className="mb-2.5 text-[12.5px] text-ink-faint">
                Para: familia de Mateo
              </div>
              <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">
                Pintamos con témperas esta mañana. Mateo eligió el azul para
                todo y se concentró un montón mezclando colores.
              </p>
              <Link
                href="#"
                className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-2 rounded-[16px] border-[1.5px] border-dashed border-field-border bg-field text-field-ink"
              >
                <ImageIcon size={30} strokeWidth={1.7} />
                <span className="text-[13.5px]">
                  Foto · pintando con témperas
                </span>
              </Link>
              <PostFooter likes={5} comments={2} />
            </article>

            <article className="rounded-[20px] border border-line bg-surface px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
              <div className="mb-[14px] flex items-center gap-3">
                <div className="flex size-11 flex-none items-center justify-center rounded-full bg-indigo-bg text-indigo">
                  <MessageCircle size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-display text-[16.5px] font-semibold text-ink">
                    Anuncio general
                  </div>
                  <div className="text-[12.5px] text-ink-faint">
                    07:50 · publicado por vos
                  </div>
                </div>
                <Badge
                  className="bg-indigo-bg"
                  dot="bg-indigo"
                  text="text-indigo"
                  label="ANUNCIO"
                />
              </div>
              <div className="mb-2.5 text-[12.5px] text-ink-faint">
                Para: toda la sala
              </div>
              <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">
                El viernes salimos al parque por la mañana. Recuerden mandar
                gorra y una botellita de agua.
              </p>
              <PostFooter likes={8} comments={0} />
            </article>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
