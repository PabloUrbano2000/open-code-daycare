import Link from "next/link";
import { cookies } from "next/headers";
import { Bell, Home, LogOut, Plus, Sun, User, Users } from "lucide-react";
import { NewPostDialog } from "@/components/new-post-dialog";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/logout/actions";

export type ActiveItem = "feed" | "kids" | "notices" | "account";
export type UserRole = "staff" | "parent" | "admin";

const staffNavItems = [
  { key: "feed", href: "/staff", label: "Feed", icon: Home },
  { key: "kids", href: "/staff/kids", label: "Niños", icon: Users },
  { key: "notices", href: "#", label: "Avisos", icon: Bell },
  { key: "account", href: "#", label: "Mi cuenta", icon: User },
];

const familyNavItems = [
  { key: "feed", href: "/family", label: "Feed", icon: Home },
  { key: "account", href: "#", label: "Mi cuenta", icon: User },
];

const roleLabels: Record<string, string> = {
  staff: "Maestra",
  parent: "Familia",
  admin: "Admin",
};

export default async function Sidebar({
  activeItem = "feed",
}: {
  activeItem?: ActiveItem;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName: string | null = null;
  let role: UserRole | null = null;

  if (user) {
    const { data } = await supabase
      .from("users")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    if (data) {
      fullName = data.full_name;
      role = data.role as UserRole;
    }
  }

  const isFamily = role === "parent";
  const navItems = isFamily ? familyNavItems : staffNavItems;
  const displayName = fullName ?? "Usuario";
  const initial = displayName.charAt(0).toUpperCase();
  const roleLabel = role ? (roleLabels[role] ?? null) : null;

  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6">
      <Link
        href={isFamily ? "/family" : "/staff"}
        className="mb-[22px] flex items-center gap-[11px] px-2 pt-1 pb-[22px]"
      >
        <div className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <Sun size={21} stroke="#fff" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </div>
          <div className="mt-[2px] text-[11.5px] text-ink-faint">
            {isFamily ? "Familia" : "Sala Soles"}
          </div>
        </div>
      </Link>

      {!isFamily && (
        <NewPostDialog>
          <button
            type="button"
            className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
          >
            <Plus size={17} stroke="#fff" strokeWidth={2.4} />
            Nueva publicación
          </button>
        </NewPostDialog>
      )}

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
              item.key === activeItem
                ? "bg-peach font-extrabold text-coral-brand"
                : "font-semibold text-ink-soft"
            }`}
          >
            <item.icon size={19} strokeWidth={2} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-2.5 border-t border-line pt-3.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="flex size-[38px] flex-none items-center justify-center rounded-full bg-coral font-display text-base font-semibold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">{displayName}</div>
            <div className="text-xs text-ink-faint">
              {roleLabel ? `${roleLabel} · Soles` : "Soles"}
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-cream text-[#94887B]"
            >
              <LogOut size={16} strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}