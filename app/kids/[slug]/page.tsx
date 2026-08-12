import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus, Sun, TriangleAlert } from "lucide-react";
import MobileHeader from "@/components/mobile-header";
import Sidebar from "@/components/sidebar";
import { getKidBySlug, kids, type Parent } from "../data";

export async function generateStaticParams() {
  return kids.map((kid) => ({ slug: kid.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/kids/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const kid = getKidBySlug(slug);
  return { title: kid ? `${kid.name} · OpenDayCare` : "Niños · OpenDayCare" };
}

function parentSubtitle(parent: Parent): string {
  if (parent.status === "pending") return "invitación enviada";
  return parent.relation === "Papá" ? "activo" : "activa";
}

function parentBadge(parent: Parent) {
  return parent.status === "active"
    ? { label: "ACTIVA", bg: "#CFEBD8", color: "#3E9B6C" }
    : { label: "PENDIENTE", bg: "#F7E7A6", color: "#9A7B1E" };
}

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[slug]">) {
  const { slug } = await params;
  const kid = getKidBySlug(slug);
  if (!kid) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <MobileHeader activeItem="kids" />

      <div className="flex flex-1">
        <Sidebar activeItem="kids" />

        <main className="h-screen min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[820px] px-4 py-6 pb-20 lg:px-10 lg:py-[34px] lg:pb-20">
            <Link
              href="/kids"
              className="mb-5 flex items-center gap-[7px] text-sm font-bold text-ink-muted"
            >
              <ChevronLeft size={18} strokeWidth={2.2} />
              Volver a Niños
            </Link>

            <div className="flex flex-wrap items-start gap-[26px]">
              <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
                <div className="flex items-center gap-[18px]">
                  <div
                    className="flex size-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
                    style={{
                      backgroundColor: kid.avatarBg,
                      color: kid.avatarColor,
                    }}
                  >
                    {kid.initials}
                  </div>
                  <div className="flex-1">
                    <h1 className="m-0 font-display text-[28px] font-semibold text-ink">
                      {kid.name}
                    </h1>
                    <p className="mt-[3px] text-[15px] text-ink-muted">
                      {kid.age} años · Sala {kid.room}
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-ink-soft"
                  >
                    Editar
                  </Link>
                </div>

                {kid.allergies && (
                  <div className="flex gap-3.5 rounded-2xl bg-[#FBDAD6] px-[18px] py-4">
                    <div className="flex size-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                      <TriangleAlert
                        size={22}
                        stroke="#fff"
                        strokeWidth={2.2}
                      />
                    </div>
                    <div>
                      <div className="mb-[2px] text-[15px] font-extrabold text-[#C5413A]">
                        {kid.allergies.title}
                      </div>
                      <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
                        {kid.allergies.note}
                      </div>
                    </div>
                  </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                  <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-ink-muted">
                      Fecha de nacimiento
                    </span>
                    <span className="text-[14.5px] font-extrabold text-ink">
                      {kid.birthDate}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-ink-muted">Sala</span>
                    <span className="text-[14.5px] font-extrabold text-ink">
                      {kid.room}
                    </span>
                  </div>
                  <div className="flex justify-between px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-ink-muted">
                      Ingreso
                    </span>
                    <span className="text-[14.5px] font-extrabold text-ink">
                      {kid.enrollmentDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex w-[300px] flex-none flex-col gap-3.5">
                <Link
                  href="#"
                  className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-4 py-[13px] text-[15px] font-extrabold text-white"
                >
                  <Sun size={18} stroke="#fff" strokeWidth={2.2} />
                  Resumen del día
                </Link>

                <div className="rounded-2xl border border-line bg-surface px-[18px] py-4">
                  <div className="mb-3.5 text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
                    PADRES VINCULADOS
                  </div>
                  <div className="flex flex-col gap-3.5">
                    {kid.parents.map((parent) => {
                      const badge = parentBadge(parent);
                      return (
                        <div
                          key={parent.name}
                          className="flex items-center gap-3"
                        >
                          <div
                            className="flex size-10 flex-none items-center justify-center rounded-full font-display text-base font-semibold text-white"
                            style={{ backgroundColor: parent.avatarBg }}
                          >
                            {parent.initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14.5px] font-extrabold text-ink">
                              {parent.name}
                            </div>
                            <div className="text-[12.5px] text-ink-faint">
                              {parent.relation} · {parentSubtitle(parent)}
                            </div>
                          </div>
                          <span
                            className="flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold"
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                    <Link
                      href="#"
                      className="flex items-center gap-3 pt-2"
                    >
                      <span className="flex size-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
                        <Plus size={18} strokeWidth={2.2} />
                      </span>
                      <span className="text-[14.5px] font-extrabold text-coral-darker">
                        Vincular otro padre
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
