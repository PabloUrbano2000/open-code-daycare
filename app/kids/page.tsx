import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ChevronRight, Search } from "lucide-react";
import { AddKidDialog } from "@/components/add-kid-dialog";
import MobileHeader from "@/components/mobile-header";
import Sidebar from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Niños · OpenDayCare",
};

interface ChildRow {
  id: string;
  full_name: string;
  birth_date: string;
  allergy_tags: string[] | null;
  rooms: { name: string } | { name: string }[] | null;
}

interface KidCardData {
  slug: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  age: number;
  badge?: { label: string; bg: string; color: string };
}

const allergyBadge = { bg: "#FBD8CC", color: "#D9684A" };

const avatarPalette = [
  { bg: "#A9D9E8", color: "#1F7A93" },
  { bg: "#F4B8CC", color: "#C44A7A" },
  { bg: "#B9DEC4", color: "#3E8B62" },
  { bg: "#C9B6E8", color: "#7B5FC0" },
  { bg: "#F4DC8E", color: "#9A7B1E" },
  { bg: "#A9C7E8", color: "#2F6FB4" },
];

function parentsLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

function slugify(fullName: string): string {
  return fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function initials(fullName: string): string {
  return fullName.trim().charAt(0).toUpperCase();
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function ageFrom(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function allergyBadgeFor(tags: string[] | null) {
  if (!tags) return undefined;
  if (tags.includes("peanut")) return { label: "MANÍ", ...allergyBadge };
  if (tags.includes("lactose")) return { label: "LACTOSA", ...allergyBadge };
  return undefined;
}

function toCardData(child: ChildRow): KidCardData {
  const palette = avatarPalette[hashString(child.full_name) % avatarPalette.length];
  return {
    slug: slugify(child.full_name),
    name: child.full_name,
    initials: initials(child.full_name),
    avatarBg: palette.bg,
    avatarColor: palette.color,
    age: ageFrom(child.birth_date),
    badge: allergyBadgeFor(child.allergy_tags),
  };
}

function roomNameOf(child: ChildRow): string {
  const rooms = child.rooms;
  return Array.isArray(rooms) ? rooms[0]?.name ?? "" : rooms?.name ?? "";
}

function KidCard({ kid }: { kid: KidCardData }) {
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
          {kid.age} años · {parentsLabel(0)}
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

export default async function KidsPage() {
  const supabase = createClient(await cookies());
  const { data: roomRows } = await supabase
    .from("rooms")
    .select("name")
    .order("name");
  const rooms = (roomRows ?? []).map((room) => room.name);

  const { data: childRows } = await supabase
    .from("children")
    .select("id, full_name, birth_date, allergy_tags, rooms(name)")
    .order("rooms(name)")
    .order("full_name");

  const childrenByRoom = new Map<string, KidCardData[]>();
  for (const child of (childRows ?? []) as ChildRow[]) {
    const roomName = roomNameOf(child);
    const list = childrenByRoom.get(roomName) ?? [];
    list.push(toCardData(child));
    childrenByRoom.set(roomName, list);
  }
  const sections = Array.from(childrenByRoom.entries());

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
              <AddKidDialog rooms={rooms} />
            </div>

            <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-line bg-surface px-4 py-3">
              <Search size={18} strokeWidth={2} className="text-field-ink" />
              <input
                placeholder="Buscar niño…"
                className="flex-1 bg-transparent text-[15px] text-ink placeholder:text-[#B6A99B] focus:outline-none"
              />
            </div>

            {sections.map(([roomName, cards]) => (
              <section key={roomName} className="mb-6">
                <div className="mb-3.5 flex items-center gap-3">
                  <span className="text-[12.5px] font-extrabold tracking-[.8px] text-ink">
                    SALA {roomName.toUpperCase()}
                  </span>
                  <span className="text-[13px] text-ink-faint">
                    {cards.length} niños
                  </span>
                  <span className="h-px flex-1 bg-hairline" />
                </div>

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                  {cards.map((kid) => (
                    <KidCard key={kid.slug} kid={kid} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}