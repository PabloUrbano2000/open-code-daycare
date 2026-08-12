import Link from "next/link";
import { Bell, Home, LogOut, Plus, Sun, User, Users } from "lucide-react";

const navItems = [
  { href: "#", label: "Feed", active: true, icon: Home },
  { href: "#", label: "Niños", active: false, icon: Users },
  { href: "#", label: "Avisos", active: false, icon: Bell },
  { href: "#", label: "Mi cuenta", active: false, icon: User },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-[248px] flex-none flex-col border-r border-line bg-surface px-4 py-6">
      <Link
        href="#"
        className="mb-[22px] flex items-center gap-[11px] px-2 pt-1 pb-[22px]"
      >
        <div className="flex size-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <Sun size={21} stroke="#fff" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-ink">
            OpenDayCare
          </div>
          <div className="mt-[2px] text-[11.5px] text-ink-faint">Sala Soles</div>
        </div>
      </Link>

      <Link
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <Plus size={17} stroke="#fff" strokeWidth={2.4} />
        Nueva publicación
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
              item.active
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
            C
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-ink">Caro Giménez</div>
            <div className="text-xs text-ink-faint">Maestra · Soles</div>
          </div>
          <Link
            href="#"
            title="Cerrar sesión"
            className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-cream text-[#94887B]"
          >
            <LogOut size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </aside>
  );
}
