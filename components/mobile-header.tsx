"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Home, Menu, Plus, Sun, User, Users, X } from "lucide-react";
import type { ActiveItem } from "./sidebar";

const navItems = [
  { key: "feed", href: "/", label: "Feed", icon: Home },
  { key: "kids", href: "/kids", label: "Niños", icon: Users },
  { key: "notices", href: "#", label: "Avisos", icon: Bell },
  { key: "account", href: "#", label: "Mi cuenta", icon: User },
];

export default function MobileHeader({ activeItem = "feed" }: { activeItem?: ActiveItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 lg:hidden">
      <div className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <button
          type="button"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setIsOpen((open) => !open)}
          className="flex size-10 flex-none items-center justify-center rounded-xl bg-cream text-ink-soft"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="#" className="flex items-center gap-2">
          <div className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
            <Sun size={18} stroke="#fff" strokeWidth={2.2} />
          </div>
          <div className="font-display text-base font-semibold leading-tight text-ink">
            OpenDayCare
            <div className="text-[10.5px] font-sans text-ink-faint">
              Sala Soles
            </div>
          </div>
        </Link>

        <Link
          href="#"
          aria-label="Nueva publicación"
          className="ml-auto flex size-10 flex-none items-center justify-center rounded-[12px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
        >
          <Plus size={20} strokeWidth={2.4} />
        </Link>
      </div>

      {isOpen && (
        <nav className="border-b border-line bg-surface px-4 pb-4 pt-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
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
      )}
    </header>
  );
}
