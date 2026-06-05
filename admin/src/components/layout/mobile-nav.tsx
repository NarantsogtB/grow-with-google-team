"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Route,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BOTTOM_ITEMS = [
  { label: "Хяналт", href: "/dashboard", icon: LayoutDashboard },
  { label: "Түүх", href: "/dashboard/history", icon: ClipboardList },
  { label: "Оршин суугч", href: "/dashboard/patients", icon: Users },
  { label: "Хуваарь", href: "/dashboard/schedules", icon: CalendarDays },
  { label: "Эргэлт", href: "/dashboard/visits", icon: CalendarCheck2 },
  { label: "Маршрут", href: "/dashboard/route", icon: Route },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-slate-200 flex items-center safe-area-bottom">
      {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors",
              isActive
                ? "text-blue-600"
                : "text-slate-400 hover:text-slate-600",
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none">
              {label}
            </span>
            {isActive && (
              <span className="w-1 h-1 rounded-full bg-blue-600 mt-0.5" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
