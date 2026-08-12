import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, Search } from "lucide-react";
import MobileHeader from "@/components/mobile-header";
import Sidebar from "@/components/sidebar";
import { kids, type Kid } from "./data";

export const metadata: Metadata = {
  title: "Niños · OpenDayCare",
};

function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

function KidCard({ kid }: { kid: Kid }) {
  return (
    <Link
      href={`/kids/${kid.slug}`}
      className="flex min-w-0 items-center gap-3.5 rounded-[18px] border border-line bg-surface p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex size-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ backgroundColor: kid.avatarBg, color: kid.avatarColor }}
      >
        {kid.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-semibold text-ink">
          {kid.name}
        </div>
        <div className="text-[13px] text-ink-faint">
          {kid.age} años · {parentsLabel(kid.parents.length)}
        </div>
      </div>
      {kid.badge ? (
        <span
          className="flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold"
          style={{ backgroundColor: kid.badge.bg, color: kid.badge.color }}
        >
          {kid.badge.label}
        </span>
      ) : (
        <ChevronRight
          size={18}
          strokeWidth={2.2}
          className="flex-none text-[#CBB89F]"
        />
      )}
    </Link>
  );
}

export default function KidsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MobileHeader activeItem="kids" />

      <div className="flex flex-1">
        <Sidebar activeItem="kids" />

        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[880px] px-4 py-6 pb-20 lg:px-10 lg:py-[34px] lg:pb-20">
            <div className="mb-[22px] flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-coral-brand">
                  GESTIÓN
                </div>
                <h1 className="m-0 font-display text-[30px] font-semibold text-ink">
                  Niños
                </h1>
              </div>
              <Link
                href="#"
                className="flex items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
              >
                <Plus size={17} strokeWidth={2.4} />
                Agregar niño
              </Link>
            </div>

            <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
              <Search size={18} strokeWidth={2} className="text-field-ink" />
              <input
                placeholder="Buscar niño…"
                className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-[#B6A99B] focus:outline-none"
              />
            </div>

            <div className="mb-3.5 flex items-center gap-3">
              <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">
                SALA SOLES
              </span>
              <span className="text-[13px] text-ink-faint">
                {kids.length} niños
              </span>
              <span className="h-px flex-1 bg-hairline" />
            </div>

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {kids.map((kid) => (
                <KidCard key={kid.slug} kid={kid} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
